// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract RecallManagement is AccessControl, Pausable {
    bytes32 public constant RECALL_MANAGER_ROLE = keccak256("RECALL_MANAGER_ROLE");
    
    enum RecallSeverity { Low, Medium, High, Critical }
    enum RecallStatus { Initiated, InProgress, Completed, Cancelled }
    
    struct Recall {
        uint256 recallId;
        address initiator;
        uint256[] batchIds;
        RecallSeverity severity;
        string reason;
        RecallStatus status;
        uint256 initiatedAt;
        uint256 completedAt;
        string additionalInfo;
    }
    
    mapping(uint256 => Recall) public recalls;
    uint256 private _recallCounter;
    
    event RecallInitiated(
        uint256 indexed recallId,
        address indexed initiator,
        uint256[] batchIds,
        RecallSeverity severity,
        string reason
    );
    
    event RecallStatusUpdated(
        uint256 indexed recallId,
        RecallStatus newStatus,
        uint256 timestamp
    );
    
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(RECALL_MANAGER_ROLE, msg.sender);
    }
    
    function initiateRecall(
        uint256[] memory batchIds,
        RecallSeverity severity,
        string memory reason,
        string memory additionalInfo
    ) public onlyRole(RECALL_MANAGER_ROLE) whenNotPaused returns (uint256) {
        require(batchIds.length > 0, "Must specify at least one batch");
        require(bytes(reason).length > 0, "Must provide a reason");
        
        uint256 recallId = _recallCounter++;
        
        recalls[recallId] = Recall({
            recallId: recallId,
            initiator: msg.sender,
            batchIds: batchIds,
            severity: severity,
            reason: reason,
            status: RecallStatus.Initiated,
            initiatedAt: block.timestamp,
            completedAt: 0,
            additionalInfo: additionalInfo
        });
        
        emit RecallInitiated(recallId, msg.sender, batchIds, severity, reason);
        return recallId;
    }
    
    function updateRecallStatus(uint256 recallId, RecallStatus newStatus) 
        public 
        onlyRole(RECALL_MANAGER_ROLE) 
        whenNotPaused 
    {
        require(recalls[recallId].recallId == recallId, "Recall does not exist");
        require(newStatus != RecallStatus.Initiated, "Cannot revert to initiated status");
        
        recalls[recallId].status = newStatus;
        if (newStatus == RecallStatus.Completed) {
            recalls[recallId].completedAt = block.timestamp;
        }
        
        emit RecallStatusUpdated(recallId, newStatus, block.timestamp);
    }
    
    function getRecall(uint256 recallId) 
        public 
        view 
        returns (
            address initiator,
            uint256[] memory batchIds,
            RecallSeverity severity,
            string memory reason,
            RecallStatus status,
            uint256 initiatedAt,
            uint256 completedAt,
            string memory additionalInfo
        ) 
    {
        Recall storage recall = recalls[recallId];
        require(recall.recallId == recallId, "Recall does not exist");
        
        return (
            recall.initiator,
            recall.batchIds,
            recall.severity,
            recall.reason,
            recall.status,
            recall.initiatedAt,
            recall.completedAt,
            recall.additionalInfo
        );
    }
    
    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}