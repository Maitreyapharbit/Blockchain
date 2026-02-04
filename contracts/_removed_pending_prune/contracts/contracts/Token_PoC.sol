// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title Token (PoC)
/// @notice ERC-1155 batch token contract PoC with bytes32 employeeId for gas optimization.
contract TokenPoC is ERC1155, ERC1155Burnable, AccessControl, ReentrancyGuard {
    using ECDSA for bytes32;

    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    enum BatchStatus { ACTIVE, COMPROMISED, RECALLED, CONSUMED }

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
        bytes32 employeeId; // optimized
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
        bytes32 fromSignatureHash; // store only hash
        bool isCompleted;
    }

    mapping(uint256 => BatchMetadata) public batches;
    mapping(uint256 => mapping(address => bool)) public batchHolderExists; // optimized holder tracking
    mapping(bytes32 => PendingTransfer) public pendingTransfers;

    uint256 private _batchIdCounter;

    event BatchMinted(
        uint256 indexed batchId,
        address indexed manufacturer,
        uint256 quantity,
        bytes32 batchMetadataHash,
        bytes32 employeeId,
        uint256 hardwareTimestamp,
        uint256 recordTimestamp
    );

    event TransferProposed(
        bytes32 indexed transferId,
        uint256 indexed batchId,
        address indexed from,
        address to,
        uint256 quantity,
        bytes32 employeeId,
        uint256 measurementTime
    );

    event TransferAcknowledged(
        bytes32 indexed transferId,
        address indexed recipient,
        bytes32 employeeId,
        uint256 timestamp
    );

    event TransferCompleted(
        bytes32 indexed transferId,
        uint256 indexed batchId,
        address indexed from,
        address to,
        uint256 quantity,
        uint256 timestamp
    );

    constructor(string memory uri) ERC1155(uri) {
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
    ) external onlyRole(MANUFACTURER_ROLE) returns (uint256) {
        require(quantity > 0, "Quantity must be positive");
        require(expiryDate > manufacturingDate, "Invalid date range");
        require(hardwareTimestamp <= block.timestamp, "Future timestamp not allowed");

        _batchIdCounter++;
        uint256 batchId = _batchIdCounter;

        bytes32 metadataHash = keccak256(abi.encodePacked(
            drugName,
            quantity,
            manufacturingDate,
            expiryDate,
            batchNumber,
            block.timestamp
        ));

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

        _mint(msg.sender, batchId, quantity, "");
        batchHolderExists[batchId][msg.sender] = true;

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
        require(batch.status == BatchStatus.ACTIVE, "Batch not active");
        require(balanceOf(msg.sender, batchId) >= quantity, "Insufficient balance");
        require(to != address(0), "Invalid recipient");
        require(quantity > 0, "Quantity must be positive");

        bytes32 messageHash = keccak256(abi.encodePacked(
            batchId,
            to,
            quantity,
            measurementTime,
            msg.sender
        ));

        address signer = messageHash.toEthSignedMessageHash().recover(senderSignature);
        require(signer == msg.sender, "Invalid sender signature");

        bytes32 transferId = keccak256(abi.encodePacked(
            batchId,
            msg.sender,
            to,
            quantity,
            block.timestamp
        ));

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

    function acknowledgeDrugTransfer(
        bytes32 transferId,
        bytes32 employeeId,
        bytes calldata receiverSignature
    ) external nonReentrant {
        PendingTransfer storage transfer = pendingTransfers[transferId];

        require(transfer.to == msg.sender, "Only recipient can acknowledge");
        require(!transfer.toSigned, "Already signed");
        require(transfer.proposedAt > 0, "Transfer not found");
        require(block.timestamp - transfer.proposedAt <= 86400, "Transfer expired");

        bytes32 messageHash = keccak256(abi.encodePacked(
            transfer.batchId,
            msg.sender,
            transfer.quantity,
            transfer.from,
            block.timestamp
        ));

        address signer = messageHash.toEthSignedMessageHash().recover(receiverSignature);
        require(signer == msg.sender, "Invalid receiver signature");

        transfer.toSigned = true;

        _safeTransferFrom(
            transfer.from,
            transfer.to,
            transfer.batchId,
            transfer.quantity,
            ""
        );

        BatchMetadata storage batch = batches[transfer.batchId];
        batch.remainingQuantity -= transfer.quantity;

        if (!batchHolderExists[transfer.batchId][transfer.to]) {
            batchHolderExists[transfer.batchId][transfer.to] = true;
        }

        transfer.isCompleted = true;

        emit TransferAcknowledged(transferId, msg.sender, employeeId, block.timestamp);
        emit TransferCompleted(transferId, transfer.batchId, transfer.from, transfer.to, transfer.quantity, block.timestamp);
    }

    function getBatch(uint256 batchId) external view returns (BatchMetadata memory) {
        return batches[batchId];
    }

    function getPendingTransfer(bytes32 transferId) external view returns (PendingTransfer memory) {
        return pendingTransfers[transferId];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
