// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Deprecated - PharmaToken
/// @notice Replaced by `Token.sol`. Minimal DEPRECATED stub retained for history and migration.
contract DeprecatedPharmaToken {
    // Intentionally left blank. Use `Token.sol` for current functionality.
} 
        address indexed manufacturer,
        uint256 quantity,
        bytes32 batchMetadataHash,
        string employeeId,
        uint256 hardwareTimestamp,
        uint256 recordTimestamp
    );

    event TransferProposed(
        bytes32 indexed transferId,
        uint256 indexed batchId,
        address indexed from,
        address to,
        uint256 quantity,
        string employeeId,
        uint256 measurementTime
    );

    event TransferAcknowledged(
        bytes32 indexed transferId,
        address indexed recipient,
        string employeeId,
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

    event DrugConsumed(
        uint256 indexed batchId,
        bytes32 hashedPatientId,
        uint256 quantity,
        address indexed pharmacy,
        string employeeId,
        uint256 timestamp
    );

    event BatchCompromised(
        uint256 indexed batchId,
        string reason,
        address indexed reporter,
        string employeeId,
        uint256 timestamp
    );

    event BatchRecalled(
        uint256 indexed batchId,
        uint256 timestamp
    );

    // Constructor
    constructor(string memory uri) ERC1155(uri) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Mint a new drug batch - ONLY MANUFACTURER_ROLE
     * @param drugName Name of the drug
     * @param quantity Total units in batch
     * @param manufacturingDate ISO 8601 timestamp of manufacturing
     * @param expiryDate ISO 8601 timestamp of expiry
     * @param batchNumber Unique batch identifier
     * @param employeeId Employee ID of technician (ALCOA+ Attributability)
     * @param hardwareTimestamp IoT hardware timestamp (ALCOA+ Contemporaneous)
     * @return newBatchId The newly created batch ID
     */
    function mintBatch(
        string memory drugName,
        uint256 quantity,
        uint256 manufacturingDate,
        uint256 expiryDate,
        string memory batchNumber,
        string memory employeeId,
        uint256 hardwareTimestamp
    ) external onlyRole(MANUFACTURER_ROLE) returns (uint256) {
        require(quantity > 0, "Quantity must be positive");
        require(expiryDate > manufacturingDate, "Invalid date range");
        require(bytes(employeeId).length > 0, "Employee ID required");
        require(hardwareTimestamp <= block.timestamp, "Future timestamp not allowed");

        _batchIdCounter++;
        uint256 batchId = _batchIdCounter;

        // Create immutable metadata hash (ALCOA+ Original - cannot be edited)
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
            batchNumber: batchNumber
        });

        // Mint ERC-1155 tokens to manufacturer
        _mint(msg.sender, batchId, quantity, "");
        batchHolders[batchId].push(msg.sender);

        emit BatchMinted(
            batchId,
            msg.sender,
            quantity,
            metadataHash,
            employeeId,
            hardwareTimestamp,
            block.timestamp
        );

        return batchId;
    }

    /**
     * @dev Propose a drug transfer (Step 1 of dual-signature workflow)
     * @param batchId Batch to transfer
     * @param to Recipient address
     * @param quantity Units to transfer
     * @param measurementTime IoT sensor measurement time
     * @param employeeId Employee ID of sender
     * @param senderSignature Sender's EIP-712 signature
     * @return transferId The pending transfer ID
     */
    function proposeDrugTransfer(
        uint256 batchId,
        address to,
        uint256 quantity,
        uint256 measurementTime,
        string memory employeeId,
        bytes calldata senderSignature
    ) external nonReentrant returns (bytes32) {
        BatchMetadata storage batch = batches[batchId];
        
        require(batch.status == BatchStatus.ACTIVE, "Batch not active");
        require(balanceOf(msg.sender, batchId) >= quantity, "Insufficient balance");
        require(to != address(0), "Invalid recipient");
        require(quantity > 0, "Quantity must be positive");
        require(bytes(employeeId).length > 0, "Employee ID required");

        // Verify sender signature (EIP-712 style)
        bytes32 messageHash = keccak256(abi.encodePacked(
            batchId,
            to,
            quantity,
            measurementTime,
            msg.sender,
            block.timestamp
        ));

        address signer = messageHash.toEthSignedMessageHash().recover(senderSignature);
        require(signer == msg.sender, "Invalid sender signature");

        // Create transfer ID
        bytes32 transferId = keccak256(abi.encodePacked(
            batchId,
            msg.sender,
            to,
            quantity,
            block.timestamp
        ));

        // Record pending transfer
        pendingTransfers[transferId] = PendingTransfer({
            batchId: batchId,
            from: msg.sender,
            to: to,
            quantity: quantity,
            measurementTime: measurementTime,
            proposedAt: block.timestamp,
            fromSigned: true,
            toSigned: false,
            fromSignature: senderSignature,
            toSignature: "",
            isCompleted: false
        });

        pendingTransferIds.push(transferId);

        emit TransferProposed(
            transferId,
            batchId,
            msg.sender,
            to,
            quantity,
            employeeId,
            measurementTime
        );

        return transferId;
    }

    /**
     * @dev Acknowledge transfer (Step 2 of dual-signature workflow)
     * @param transferId Pending transfer ID
     * @param employeeId Employee ID of recipient
     * @param receiverSignature Recipient's EIP-712 signature
     */
    function acknowledgeDrugTransfer(
        bytes32 transferId,
        string memory employeeId,
        bytes calldata receiverSignature
    ) external nonReentrant {
        PendingTransfer storage transfer = pendingTransfers[transferId];

        require(transfer.to == msg.sender, "Only recipient can acknowledge");
        require(!transfer.toSigned, "Already signed");
        require(transfer.proposedAt > 0, "Transfer not found");
        require(block.timestamp - transfer.proposedAt <= 86400, "Transfer expired"); // 24 hours
        require(bytes(employeeId).length > 0, "Employee ID required");

        // Verify receiver signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            transfer.batchId,
            msg.sender,
            transfer.quantity,
            transfer.from,
            block.timestamp
        ));

        address signer = messageHash.toEthSignedMessageHash().recover(receiverSignature);
        require(signer == msg.sender, "Invalid receiver signature");

        // Update transfer state
        transfer.toSigned = true;
        transfer.toSignature = receiverSignature;

        // Execute the actual token transfer
        _safeTransferFrom(
            transfer.from,
            transfer.to,
            transfer.batchId,
            transfer.quantity,
            ""
        );

        // Update batch metadata
        BatchMetadata storage batch = batches[transfer.batchId];
        batch.remainingQuantity -= transfer.quantity;

        // Record in transfer history
        transferHistory[transfer.batchId].push(TransferRecord({
            from: transfer.from,
            to: transfer.to,
            quantity: transfer.quantity,
            timestamp: block.timestamp,
            transactionHash: transferId,
            measurementTime: transfer.measurementTime,
            recordTime: block.timestamp,
            employeeId: employeeId,
            isHistorical: block.timestamp - transfer.measurementTime > 3600
        }));

        // Track new holder
        if (!_isHolder(transfer.batchId, transfer.to)) {
            batchHolders[transfer.batchId].push(transfer.to);
        }

        transfer.isCompleted = true;

        emit TransferAcknowledged(transferId, msg.sender, employeeId, block.timestamp);
        emit TransferCompleted(
            transferId,
            transfer.batchId,
            transfer.from,
            transfer.to,
            transfer.quantity,
            block.timestamp
        );
    }

    /**
     * @dev Consume medicine (Pharmacy burns token) - IRREVERSIBLE
     * @param batchId Batch being consumed
     * @param hashedPatientId Hash of patient ID (GDPR compliant - no PII)
     * @param quantity Units consumed
     * @param employeeId Pharmacy employee ID
     */
    function consumeMedicine(
        uint256 batchId,
        bytes32 hashedPatientId,
        uint256 quantity,
        string memory employeeId
    ) external onlyRole(PHARMACY_ROLE) nonReentrant {
        BatchMetadata storage batch = batches[batchId];

        require(batch.status == BatchStatus.ACTIVE, "Batch not available");
        require(balanceOf(msg.sender, batchId) >= quantity, "Insufficient balance");
        require(quantity > 0, "Quantity must be positive");
        require(bytes(employeeId).length > 0, "Employee ID required");

        // Update batch quantity
        batch.remainingQuantity -= quantity;

        // BURN TOKEN - IRREVERSIBLE (prevents counterfeiting)
        _burn(msg.sender, batchId, quantity);

        // Mark as fully consumed if no units remain
        if (batch.remainingQuantity == 0) {
            batch.status = BatchStatus.CONSUMED;
        }

        emit DrugConsumed(
            batchId,
            hashedPatientId,
            quantity,
            msg.sender,
            employeeId,
            block.timestamp
        );
    }

    /**
     * @dev Flag batch as compromised (AUDITOR_ROLE only)
     * @param batchId Batch to flag
     * @param reason Reason for compromise
     * @param employeeId Auditor employee ID
     */
    function flagBatchCompromised(
        uint256 batchId,
        string calldata reason,
        string memory employeeId
    ) external onlyRole(AUDITOR_ROLE) {
        BatchMetadata storage batch = batches[batchId];
        require(batch.status == BatchStatus.ACTIVE, "Batch already flagged");
        require(bytes(employeeId).length > 0, "Employee ID required");

        batch.status = BatchStatus.COMPROMISED;

        emit BatchCompromised(batchId, reason, msg.sender, employeeId, block.timestamp);
    }

    /**
     * @dev Initiate recall of batch (prevents all future transfers)
     * @param batchId Batch to recall
     */
    function recallBatch(uint256 batchId) external onlyRole(AUDITOR_ROLE) {
        BatchMetadata storage batch = batches[batchId];
        require(
            batch.status == BatchStatus.ACTIVE || batch.status == BatchStatus.COMPROMISED,
            "Batch already recalled"
        );

        batch.status = BatchStatus.RECALLED;
        emit BatchRecalled(batchId, block.timestamp);
    }

    /**
     * @dev Prevent transfers of compromised/recalled batches
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        // Only allow minting (from == address(0)) and burning (to == address(0))
        // Prevent transfers of compromised/recalled batches
        if (from != address(0) && to != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                require(
                    batches[ids[i]].status == BatchStatus.ACTIVE,
                    "Cannot transfer compromised/recalled batch"
                );
            }
        }
    }

    /**
     * @dev Get all holders of a batch (for recalls)
     */
    function getBatchHolders(uint256 batchId)
        external
        view
        returns (address[] memory)
    {
        return batchHolders[batchId];
    }

    /**
     * @dev Get transfer history for a batch
     */
    function getTransferHistory(uint256 batchId)
        external
        view
        returns (TransferRecord[] memory)
    {
        return transferHistory[batchId];
    }

    /**
     * @dev Get pending transfers for a user
     */
    function getPendingTransfers(address user)
        external
        view
        returns (bytes32[] memory)
    {
        bytes32[] memory userTransfers = new bytes32[](pendingTransferIds.length);
        uint256 count = 0;

        for (uint256 i = 0; i < pendingTransferIds.length; i++) {
            PendingTransfer memory t = pendingTransfers[pendingTransferIds[i]];
            if (
                (t.to == user && !t.toSigned && !t.isCompleted) ||
                (t.from == user && !t.isCompleted)
            ) {
                userTransfers[count] = pendingTransferIds[i];
                count++;
            }
        }

        // Trim array to actual size
        bytes32[] memory result = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = userTransfers[i];
        }

        return result;
    }

    /**
     * @dev Get batch metadata
     */
    function getBatch(uint256 batchId)
        external
        view
        returns (BatchMetadata memory)
    {
        return batches[batchId];
    }

    /**
     * @dev Helper function to check if address is a holder of a batch
     */
    function _isHolder(uint256 batchId, address account)
        internal
        view
        returns (bool)
    {
        for (uint256 i = 0; i < batchHolders[batchId].length; i++) {
            if (batchHolders[batchId][i] == account) return true;
        }
        return false;
    }

    /**
     * @dev Support for interface checking
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
