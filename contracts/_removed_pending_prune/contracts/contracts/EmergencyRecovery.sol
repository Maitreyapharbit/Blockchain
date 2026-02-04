// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Deprecated - EmergencyRecovery
/// @notice Emergency recovery is handled off-chain or in Governance modules. This file is a DEPRECATED stub.
contract DeprecatedEmergencyRecovery {
} 

    // Recovery request structure
    struct RecoveryRequest {
        address originalAddress;           // The compromised wallet
        address proposedNewAddress;        // The replacement wallet
        uint256 requestedAt;
        RecoveryState state;
        string reason;                     // Why recovery needed
        uint256 approvalDeadline;          // Voting window
        
        // Voting record
        uint256 approvalsNeeded;           // N of M (e.g., 3 of 5)
        mapping(address => bool) approvals;
        address[] approvers;
        uint256 approvalCount;
        
        // Batch history preservation
        bytes32 batchHistoryHash;          // Hash of all batch records
        bool historyVerified;              // Did signers verify batch integrity?
        
        // Execution record
        uint256 executedAt;
        address executedBy;
        string executionNotes;
    }

    // Storage
    mapping(bytes32 => RecoveryRequest) public recoveryRequests;
    bytes32[] public allRequests;
    
    mapping(address => bytes32) public activeRecovery; // address => current recovery request
    
    // Emergency council (must be >= 5 members, typically geographically distributed)
    address[] public emergencyCouncil;
    mapping(address => bool) public isCouncilMember;
    uint256 public councilThreshold = 3; // 3 of 5

    // Batch history records (preserved across key recovery)
    struct BatchHistoryRecord {
        bytes32 batchId;
        address originalOwner;
        bytes32 batchDataHash;
        uint256 recordedAt;
    }
    
    mapping(address => BatchHistoryRecord[]) public ownerBatchHistory;

    // Events
    event RecoveryRequested(
        bytes32 indexed requestId,
        address indexed compromised,
        address indexed proposed,
        string reason,
        uint256 deadline,
        uint256 timestamp
    );

    event RecoveryApproved(
        bytes32 indexed requestId,
        address indexed approver,
        uint256 approvalsNeeded,
        uint256 approvalsReceived,
        uint256 timestamp
    );

    event RecoveryExecuted(
        bytes32 indexed requestId,
        address indexed originalAddress,
        address indexed newAddress,
        bytes32 batchHistoryHash,
        uint256 timestamp
    );

    event RecoveryCancelled(
        bytes32 indexed requestId,
        string reason,
        uint256 timestamp
    );

    event CouncilMemberAdded(
        address indexed member,
        uint256 timestamp
    );

    event CouncilMemberRemoved(
        address indexed member,
        uint256 timestamp
    );

    event ThresholdUpdated(
        uint256 newThreshold,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ============================================================================
    // EMERGENCY COUNCIL SETUP
    // ============================================================================

    /**
     * @notice Add member to emergency recovery council
     * @dev Council must be geographically distributed (different countries/regions)
     * @dev Should have 5+ members to ensure 3-of-5 quorum is achievable
     */
    function addCouncilMember(address member)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(member != address(0), "Invalid address");
        require(!isCouncilMember[member], "Already council member");

        emergencyCouncil.push(member);
        isCouncilMember[member] = true;
        _grantRole(EMERGENCY_COUNCIL_MEMBER, member);

        emit CouncilMemberAdded(member, block.timestamp);
    }

    /**
     * @notice Remove council member
     */
    function removeCouncilMember(address member)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(isCouncilMember[member], "Not council member");
        require(emergencyCouncil.length > 1, "Cannot remove last member");

        isCouncilMember[member] = false;
        _revokeRole(EMERGENCY_COUNCIL_MEMBER, member);

        // Remove from array
        for (uint i = 0; i < emergencyCouncil.length; i++) {
            if (emergencyCouncil[i] == member) {
                emergencyCouncil[i] = emergencyCouncil[emergencyCouncil.length - 1];
                emergencyCouncil.pop();
                break;
            }
        }

        emit CouncilMemberRemoved(member, block.timestamp);
    }

    /**
     * @notice Update threshold (e.g., 3 of 5 or 4 of 7)
     */
    function setThreshold(uint256 newThreshold)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(newThreshold > 0, "Threshold must be > 0");
        require(newThreshold <= emergencyCouncil.length, "Threshold too high");

        councilThreshold = newThreshold;
        emit ThresholdUpdated(newThreshold, block.timestamp);
    }

    // ============================================================================
    // KEY RECOVERY WORKFLOW
    // ============================================================================

    /**
     * @notice Step 1: Affected party requests key recovery
     * @dev This initiates a 7-day voting period
     * @param proposedNewAddress The new wallet to receive the MANUFACTURER_ROLE
     * @param reason Why the key is compromised (e.g., "Private key exposed in GitHub")
     */
    function requestKeyRecovery(
        address proposedNewAddress,
        string calldata reason
    ) external nonReentrant {
        require(proposedNewAddress != address(0), "Invalid new address");
        require(proposedNewAddress != msg.sender, "Cannot be same address");
        require(bytes(reason).length > 0, "Reason required");

        // Check if there's already an active recovery for this address
        require(activeRecovery[msg.sender] == bytes32(0), "Recovery already in progress");

        bytes32 requestId = keccak256(
            abi.encodePacked(msg.sender, proposedNewAddress, block.timestamp)
        );

        RecoveryRequest storage req = recoveryRequests[requestId];
        req.originalAddress = msg.sender;
        req.proposedNewAddress = proposedNewAddress;
        req.requestedAt = block.timestamp;
        req.state = RecoveryState.VOTING;
        req.reason = reason;
        req.approvalDeadline = block.timestamp + (7 days); // 7-day voting window
        req.approvalsNeeded = councilThreshold;
        req.approvalCount = 0;

        activeRecovery[msg.sender] = requestId;
        allRequests.push(requestId);

        // Preserve batch history at request time
        req.batchHistoryHash = keccak256(
            abi.encode(ownerBatchHistory[msg.sender])
        );

        emit RecoveryRequested(
            requestId,
            msg.sender,
            proposedNewAddress,
            reason,
            req.approvalDeadline,
            block.timestamp
        );
    }

    /**
     * @notice Step 2: Emergency council members vote to approve recovery
     * @dev Each council member can vote once
     */
    function approveRecovery(bytes32 requestId, bool includesHistoryVerification)
        external
        onlyRole(EMERGENCY_COUNCIL_MEMBER)
        nonReentrant
    {
        RecoveryRequest storage req = recoveryRequests[requestId];
        require(req.originalAddress != address(0), "Invalid request");
        require(req.state == RecoveryState.VOTING, "Not in voting state");
        require(block.timestamp <= req.approvalDeadline, "Voting period expired");
        require(!req.approvals[msg.sender], "Already voted");

        req.approvals[msg.sender] = true;
        req.approvers.push(msg.sender);
        req.approvalCount++;

        if (includesHistoryVerification) {
            req.historyVerified = true;
        }

        emit RecoveryApproved(
            requestId,
            msg.sender,
            req.approvalsNeeded,
            req.approvalCount,
            block.timestamp
        );

        // If threshold reached, mark as approved
        if (req.approvalCount >= req.approvalsNeeded) {
            req.state = RecoveryState.APPROVED;
        }
    }

    /**
     * @notice Step 3: Execute recovery (transfer MANUFACTURER_ROLE from old to new address)
     * @dev Only callable after multisig approval
     * @dev Requires: original address OR admin
     */
    function executeRecovery(bytes32 requestId)
        external
        nonReentrant
    {
        RecoveryRequest storage req = recoveryRequests[requestId];
        require(req.state == RecoveryState.APPROVED, "Not approved");
        require(
            msg.sender == req.originalAddress || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not authorized"
        );

        // Mark as executed
        req.state = RecoveryState.EXECUTED;
        req.executedAt = block.timestamp;
        req.executedBy = msg.sender;

        // Transfer batch history to new address
        ownerBatchHistory[req.proposedNewAddress] = ownerBatchHistory[req.originalAddress];
        delete ownerBatchHistory[req.originalAddress];

        // Clear the active recovery
        delete activeRecovery[req.originalAddress];

        emit RecoveryExecuted(
            requestId,
            req.originalAddress,
            req.proposedNewAddress,
            req.batchHistoryHash,
            block.timestamp
        );

        // NOTE: The actual role transfer (MANUFACTURER_ROLE) must be done in PharmaToken.sol
        // This contract only handles the recovery request and batch history preservation
        // PharmaToken must call this contract to verify recovery before transferring roles
    }

    /**
     * @notice Cancel a recovery request (if recovered privately or issue resolved)
     */
    function cancelRecovery(bytes32 requestId, string calldata reason)
        external
        nonReentrant
    {
        RecoveryRequest storage req = recoveryRequests[requestId];
        require(
            msg.sender == req.originalAddress || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not authorized"
        );

        req.state = RecoveryState.CANCELLED;
        delete activeRecovery[req.originalAddress];

        emit RecoveryCancelled(requestId, reason, block.timestamp);
    }

    // ============================================================================
    // BATCH HISTORY PRESERVATION
    // ============================================================================

    /**
     * @notice Record batch history (called by PharmaToken when batch is minted)
     */
    function recordBatchHistory(
        address manufacturer,
        bytes32 batchId,
        bytes32 batchDataHash
    ) external onlyRole(ROLE_ADMIN) {
        ownerBatchHistory[manufacturer].push(
            BatchHistoryRecord({
                batchId: batchId,
                originalOwner: manufacturer,
                batchDataHash: batchDataHash,
                recordedAt: block.timestamp
            })
        );
    }

    /**
     * @notice Get batch history for an address (survives key recovery)
     */
    function getBatchHistory(address addr)
        external
        view
        returns (BatchHistoryRecord[] memory)
    {
        return ownerBatchHistory[addr];
    }

    /**
     * @notice Verify batch history integrity (audit trail)
     */
    function verifyBatchHistoryHash(address addr, bytes32 expectedHash)
        external
        view
        returns (bool)
    {
        bytes32 actualHash = keccak256(abi.encode(ownerBatchHistory[addr]));
        return actualHash == expectedHash;
    }

    // ============================================================================
    // QUERY & AUDIT
    // ============================================================================

    /**
     * @notice Get recovery request details
     */
    function getRecoveryRequest(bytes32 requestId)
        external
        view
        returns (
            address originalAddress,
            address proposedNewAddress,
            RecoveryState state,
            uint256 approvalCount,
            uint256 approvalDeadline,
            bytes32 batchHistoryHash,
            bool historyVerified
        )
    {
        RecoveryRequest storage req = recoveryRequests[requestId];
        return (
            req.originalAddress,
            req.proposedNewAddress,
            req.state,
            req.approvalCount,
            req.approvalDeadline,
            req.batchHistoryHash,
            req.historyVerified
        );
    }

    /**
     * @notice Get all approvers for a recovery request
     */
    function getApprovers(bytes32 requestId)
        external
        view
        returns (address[] memory)
    {
        return recoveryRequests[requestId].approvers;
    }

    /**
     * @notice Get emergency council members
     */
    function getCouncil() external view returns (address[] memory) {
        return emergencyCouncil;
    }

    /**
     * @notice Check if address has active recovery in progress
     */
    function hasActiveRecovery(address addr) external view returns (bool) {
        return activeRecovery[addr] != bytes32(0);
    }

    /**
     * @notice Get active recovery request ID for an address
     */
    function getActiveRecoveryRequest(address addr)
        external
        view
        returns (bytes32)
    {
        return activeRecovery[addr];
    }
}
