// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract RecallManagement is Ownable, ReentrancyGuard {
    enum SeverityLevel { LOW, MEDIUM, HIGH, CRITICAL }
    enum RecallStatus { ACTIVE, RESOLVED, CANCELLED }

    struct Recall {
        string recallId;
        SeverityLevel severity;
        string reason;
        address initiatedBy;
        uint256 initiatedAt;
        RecallStatus status;
        string[] batchIds;
        mapping(string => bool) affectedBatches;
    }

    struct DistributionRecord {
        string batchId;
        address distributor;
        uint256 quantity;
        uint256 shippedAt;
        bool isRecalled;
    }

    mapping(string => Recall) public recalls;
    mapping(string => DistributionRecord) public distributionRecords;
    mapping(address => bool) public authorizedStakeholders;
    
    string[] public recallIds;
    uint256 public totalRecalls;

    event RecallInitiated(
        string indexed recallId,
        SeverityLevel severity,
        string reason,
        address indexed initiatedBy,
        string[] batchIds
    );

    event BatchAddedToRecall(
        string indexed recallId,
        string indexed batchId
    );

    event RecallStatusUpdated(
        string indexed recallId,
        RecallStatus newStatus
    );

    event DistributionRecorded(
        string indexed batchId,
        address indexed distributor,
        uint256 quantity
    );

    event StakeholderAuthorized(address indexed stakeholder);
    event StakeholderRevoked(address indexed stakeholder);

    modifier onlyAuthorized() {
        require(
            authorizedStakeholders[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }

    modifier recallExists(string memory recallId) {
        require(recalls[recallId].initiatedAt > 0, "Recall does not exist");
        _;
    }

    constructor() {
        authorizedStakeholders[msg.sender] = true;
    }

    function authorizeStakeholder(address stakeholder) external onlyOwner {
        authorizedStakeholders[stakeholder] = true;
        emit StakeholderAuthorized(stakeholder);
    }

    function revokeStakeholder(address stakeholder) external onlyOwner {
        authorizedStakeholders[stakeholder] = false;
        emit StakeholderRevoked(stakeholder);
    }

    function initiateRecall(
        string memory recallId,
        SeverityLevel severity,
        string memory reason,
        string[] memory batchIds
    ) external onlyAuthorized nonReentrant {
        require(recalls[recallId].initiatedAt == 0, "Recall ID already exists");
        require(batchIds.length > 0, "At least one batch required");

        Recall storage recall = recalls[recallId];
        recall.recallId = recallId;
        recall.severity = severity;
        recall.reason = reason;
        recall.initiatedBy = msg.sender;
        recall.initiatedAt = block.timestamp;
        recall.status = RecallStatus.ACTIVE;

        for (uint256 i = 0; i < batchIds.length; i++) {
            recall.batchIds.push(batchIds[i]);
            recall.affectedBatches[batchIds[i]] = true;
            emit BatchAddedToRecall(recallId, batchIds[i]);
        }

        recallIds.push(recallId);
        totalRecalls++;

        emit RecallInitiated(recallId, severity, reason, msg.sender, batchIds);
    }

    function addBatchToRecall(
        string memory recallId,
        string memory batchId
    ) external onlyAuthorized recallExists(recallId) {
        Recall storage recall = recalls[recallId];
        require(recall.status == RecallStatus.ACTIVE, "Recall not active");
        require(!recall.affectedBatches[batchId], "Batch already in recall");

        recall.batchIds.push(batchId);
        recall.affectedBatches[batchId] = true;
        emit BatchAddedToRecall(recallId, batchId);
    }

    function updateRecallStatus(
        string memory recallId,
        RecallStatus newStatus
    ) external onlyAuthorized recallExists(recallId) {
        Recall storage recall = recalls[recallId];
        recall.status = newStatus;
        emit RecallStatusUpdated(recallId, newStatus);
    }

    function recordDistribution(
        string memory batchId,
        address distributor,
        uint256 quantity
    ) external onlyAuthorized {
        require(quantity > 0, "Quantity must be positive");
        
        distributionRecords[batchId] = DistributionRecord({
            batchId: batchId,
            distributor: distributor,
            quantity: quantity,
            shippedAt: block.timestamp,
            isRecalled: false
        });

        emit DistributionRecorded(batchId, distributor, quantity);
    }

    function markBatchAsRecalled(string memory batchId) external onlyAuthorized {
        require(distributionRecords[batchId].shippedAt > 0, "Distribution record not found");
        distributionRecords[batchId].isRecalled = true;
    }

    function getRecall(string memory recallId) external view returns (
        string memory,
        SeverityLevel,
        string memory,
        address,
        uint256,
        RecallStatus,
        string[] memory
    ) {
        Recall storage recall = recalls[recallId];
        require(recall.initiatedAt > 0, "Recall does not exist");
        
        return (
            recall.recallId,
            recall.severity,
            recall.reason,
            recall.initiatedBy,
            recall.initiatedAt,
            recall.status,
            recall.batchIds
        );
    }

    function isBatchInRecall(string memory batchId) external view returns (bool) {
        for (uint256 i = 0; i < recallIds.length; i++) {
            if (recalls[recallIds[i]].affectedBatches[batchId] && 
                recalls[recallIds[i]].status == RecallStatus.ACTIVE) {
                return true;
            }
        }
        return false;
    }

    function getDistributionRecord(string memory batchId) external view returns (
        string memory,
        address,
        uint256,
        uint256,
        bool
    ) {
        DistributionRecord memory record = distributionRecords[batchId];
        require(record.shippedAt > 0, "Distribution record not found");
        
        return (
            record.batchId,
            record.distributor,
            record.quantity,
            record.shippedAt,
            record.isRecalled
        );
    }

    function getAllRecalls() external view returns (string[] memory) {
        return recallIds;
    }
}