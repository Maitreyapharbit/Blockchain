// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title Token
/// @notice ERC-1155 batch token contract with batch lifecycle, dual-signature transfer, and recall enforcement.
/// @dev Consolidated from PharmaToken and PharmaceuticalBatch with gas optimizations.
contract Token is ERC1155, ERC1155Burnable, AccessControl, ReentrancyGuard {
    using ECDSA for bytes32;

    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    enum BatchStatus { ACTIVE, COMPROMISED, RECALLED, CONSUMED }

    // Custom errors to save bytecode size
    error QuantityMustBePositive();
    error InvalidDateRange();
    error FutureTimestampNotAllowed();
    error BatchNotActive();
    error InsufficientBalance();
    error InvalidRecipient();
    error InvalidSenderSignature();
    error OnlyRecipient();
    error AlreadySigned();
    error TransferNotFound();
    error TransferExpired();
    error InvalidReceiverSignature();
    error InsufficientBalanceFromSender();
    error BatchNotAvailable();
    error RoleRequired();

    struct BatchMetadata {
        bytes32 batchHash;
        address manufacturer;
        uint256 manufacturingDate;
        uint256 expiryDate;
        uint256 totalQuantity;
        uint256 remainingQuantity;
        BatchStatus status;
        uint256 createdAt;
        bytes32 drugName;
        bytes32 batchNumber;
        bytes32 employeeId;
    }

    struct PendingTransfer {
        uint256 batchId;
        address from;
        address to;
        uint256 quantity;
        uint256 measurementTime;
        uint256 proposedAt;
        bool fromSigned;
        bool toSigned;
        bytes32 fromSignatureHash;
        bool isCompleted;
    }

    mapping(uint256 => BatchMetadata) public batches;
    mapping(uint256 => mapping(address => bool)) public batchHolderExists; // O(1) checks
    mapping(uint256 => uint256) public holderCount; // optional count
    mapping(bytes32 => PendingTransfer) public pendingTransfers;

    uint256 private _batchIdCounter;

    event BatchMinted(uint256 indexed batchId, address indexed manufacturer, uint256 quantity, bytes32 batchMetadataHash, bytes32 employeeId, uint256 hardwareTimestamp, uint256 recordTimestamp);
    event HolderAdded(uint256 indexed batchId, address indexed holder);
    event TransferProposed(bytes32 indexed transferId, uint256 indexed batchId, address indexed from, address to, uint256 quantity, bytes32 employeeId, uint256 measurementTime);
    event TransferAcknowledged(bytes32 indexed transferId, address indexed recipient, bytes32 employeeId, uint256 timestamp);
    event TransferCompleted(bytes32 indexed transferId, uint256 indexed batchId, address indexed from, address to, uint256 quantity, uint256 timestamp);
    event DrugConsumed(uint256 indexed batchId, bytes32 hashedPatientId, uint256 quantity, address indexed pharmacy, bytes32 employeeId, uint256 timestamp);
    event BatchCompromised(uint256 indexed batchId, string reason, address indexed reporter, bytes32 employeeId, uint256 timestamp);
    event BatchRecalled(uint256 indexed batchId, uint256 timestamp);

    constructor(string memory baseUri) ERC1155(baseUri) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mintBatch(
        bytes32 drugName,
        uint256 quantity,
        uint256 manufacturingDate,
        uint256 expiryDate,
        bytes32 batchNumber,
        bytes32 employeeId,
        uint256 hardwareTimestamp
    ) external onlyRole(MANUFACTURER_ROLE) nonReentrant returns (uint256) {
        require(quantity > 0, "Quantity must be positive");
        if (!(expiryDate > manufacturingDate)) revert InvalidDateRange();
        if (hardwareTimestamp > block.timestamp) revert FutureTimestampNotAllowed();

        _batchIdCounter++;
        uint256 batchId = _batchIdCounter;

        bytes32 metadataHash = keccak256(abi.encodePacked(drugName, quantity, manufacturingDate, expiryDate, batchNumber, block.timestamp));

        batches[batchId] = BatchMetadata({
            batchHash: metadataHash,
            manufacturer: msg.sender,
            manufacturingDate: manufacturingDate,
            expiryDate: expiryDate,
            totalQuantity: quantity,
            remainingQuantity: quantity,
            status: BatchStatus.ACTIVE,
            createdAt: block.timestamp,
            drugName: drugName,
            batchNumber: batchNumber,
            employeeId: employeeId
        });

        // Effects first: update holder bookkeeping before invoking external calls in _mint
        if (!batchHolderExists[batchId][msg.sender]) {
            batchHolderExists[batchId][msg.sender] = true;
            holderCount[batchId] += 1;
        }

        // Interaction
        _mint(msg.sender, batchId, quantity, "");

        // Emit events after a successful external call
        emit HolderAdded(batchId, msg.sender);
        emit BatchMinted(batchId, msg.sender, quantity, metadataHash, employeeId, hardwareTimestamp, block.timestamp);
        return batchId;
    }

    function proposeDrugTransfer(
        uint256 batchId,
        address to,
        uint256 quantity,
        uint256 measurementTime,
        bytes32 employeeId,
        bytes calldata senderSignature
    ) external nonReentrant returns (bytes32) {
        BatchMetadata storage batch = batches[batchId];
        if (batch.status != BatchStatus.ACTIVE) revert BatchNotActive();
        if (balanceOf(msg.sender, batchId) < quantity) revert InsufficientBalance();
        if (to == address(0)) revert InvalidRecipient();
        if (quantity == 0) revert QuantityMustBePositive();

        bytes32 messageHash = keccak256(abi.encodePacked(batchId, to, quantity, measurementTime, msg.sender));
        address signer = messageHash.toEthSignedMessageHash().recover(senderSignature);
        if (signer != msg.sender) revert InvalidSenderSignature();

        bytes32 transferId = keccak256(abi.encodePacked(batchId, msg.sender, to, quantity, block.timestamp));

        pendingTransfers[transferId] = PendingTransfer({
            batchId: batchId,
            from: msg.sender,
            to: to,
            quantity: quantity,
            measurementTime: measurementTime,
            proposedAt: block.timestamp,
            fromSigned: true,
            toSigned: false,
            fromSignatureHash: keccak256(senderSignature),
            isCompleted: false
        });

        emit TransferProposed(transferId, batchId, msg.sender, to, quantity, employeeId, measurementTime);
        return transferId;
    }

    function acknowledgeDrugTransfer(bytes32 transferId, bytes32 employeeId, bytes calldata receiverSignature) external nonReentrant {
        PendingTransfer storage transfer = pendingTransfers[transferId];
        if (transfer.to != msg.sender) revert OnlyRecipient();
        if (transfer.toSigned) revert AlreadySigned();
        if (transfer.proposedAt == 0) revert TransferNotFound();
        if (block.timestamp - transfer.proposedAt > 86400) revert TransferExpired();

        // Use the original proposedAt timestamp so the recipient can sign off-chain
        bytes32 messageHash = keccak256(abi.encodePacked(transfer.batchId, msg.sender, transfer.quantity, transfer.from, transfer.proposedAt));
        address signer = messageHash.toEthSignedMessageHash().recover(receiverSignature);
        if (signer != msg.sender) revert InvalidReceiverSignature();

        // Mark recipient as signed
        transfer.toSigned = true;

        // Re-check sender balance before completing (defensive)
        if (balanceOf(transfer.from, transfer.batchId) < transfer.quantity) revert InsufficientBalanceFromSender();

        // Effects: update batch and transfer state before external calls
        BatchMetadata storage batch = batches[transfer.batchId];
        batch.remainingQuantity -= transfer.quantity;

        if (!batchHolderExists[transfer.batchId][transfer.to]) {
            batchHolderExists[transfer.batchId][transfer.to] = true;
            holderCount[transfer.batchId] += 1;
        }

        transfer.isCompleted = true;

        // Interaction: perform token transfer
        _safeTransferFrom(transfer.from, transfer.to, transfer.batchId, transfer.quantity, "");

        // Emit events after successful interaction
        emit HolderAdded(transfer.batchId, transfer.to);
        emit TransferAcknowledged(transferId, msg.sender, employeeId, block.timestamp);
        emit TransferCompleted(transferId, transfer.batchId, transfer.from, transfer.to, transfer.quantity, block.timestamp);
    }

    function consumeMedicine(uint256 batchId, bytes32 hashedPatientId, uint256 quantity, bytes32 employeeId) external onlyRole(PHARMACY_ROLE) nonReentrant {
        BatchMetadata storage batch = batches[batchId];
        if (batch.status != BatchStatus.ACTIVE) revert BatchNotAvailable();
        if (balanceOf(msg.sender, batchId) < quantity) revert InsufficientBalance();
        if (quantity == 0) revert QuantityMustBePositive();

        batch.remainingQuantity -= quantity;
        _burn(msg.sender, batchId, quantity);

        if (batch.remainingQuantity == 0) {
            batch.status = BatchStatus.CONSUMED;
        }

        emit DrugConsumed(batchId, hashedPatientId, quantity, msg.sender, employeeId, block.timestamp);
    }

    function flagBatchCompromised(uint256 batchId, string calldata reason, bytes32 employeeId) external onlyRole(AUDITOR_ROLE) {
        BatchMetadata storage batch = batches[batchId];
        if (batch.status != BatchStatus.ACTIVE) revert BatchNotActive();
        batch.status = BatchStatus.COMPROMISED;
        emit BatchCompromised(batchId, reason, msg.sender, employeeId, block.timestamp);
    }

    function recallBatch(uint256 batchId) external onlyRole(AUDITOR_ROLE) {
        BatchMetadata storage batch = batches[batchId];
        if (!(batch.status == BatchStatus.ACTIVE || batch.status == BatchStatus.COMPROMISED)) revert BatchNotActive();
        batch.status = BatchStatus.RECALLED;
        emit BatchRecalled(batchId, block.timestamp);
    }

    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) internal override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        if (from != address(0) && to != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                if (batches[ids[i]].status != BatchStatus.ACTIVE) revert BatchNotActive();
            }
        }
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
