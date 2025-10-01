// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract AntiCounterfeit is AccessControl, Pausable {
    using ECDSA for bytes32;

    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");

    enum VerificationStatus { Unknown, Authentic, Suspicious, Counterfeit }
    enum SecurityFeatureType { QRCode, Hologram, RFIDTag, SerialNumber }

    struct SecurityFeature {
        SecurityFeatureType featureType;
        bytes32 featureHash;
        uint256 timestamp;
        bool isValid;
    }

    struct Report {
        address reporter;
        uint256 batchId;
        string evidence;
        uint256 timestamp;
        VerificationStatus status;
        bool isResolved;
    }

    mapping(uint256 => mapping(SecurityFeatureType => SecurityFeature)) public securityFeatures;
    mapping(uint256 => Report[]) public reports;
    mapping(uint256 => VerificationStatus) public batchStatus;
    mapping(bytes32 => bool) public usedHashes;

    event SecurityFeatureAdded(
        uint256 indexed batchId,
        SecurityFeatureType featureType,
        bytes32 featureHash
    );

    event SuspiciousActivityReported(
        uint256 indexed batchId,
        address indexed reporter,
        uint256 timestamp
    );

    event BatchStatusUpdated(
        uint256 indexed batchId,
        VerificationStatus status
    );

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MANUFACTURER_ROLE, msg.sender);
        _setupRole(VERIFIER_ROLE, msg.sender);
    }

    function addSecurityFeature(
        uint256 batchId,
        SecurityFeatureType featureType,
        bytes32 featureHash
    ) public onlyRole(MANUFACTURER_ROLE) whenNotPaused {
        require(!usedHashes[featureHash], "Security feature hash already used");
        require(!securityFeatures[batchId][featureType].isValid, "Feature already exists for batch");

        securityFeatures[batchId][featureType] = SecurityFeature({
            featureType: featureType,
            featureHash: featureHash,
            timestamp: block.timestamp,
            isValid: true
        });

        usedHashes[featureHash] = true;
        
        if (batchStatus[batchId] == VerificationStatus.Unknown) {
            batchStatus[batchId] = VerificationStatus.Authentic;
        }

        emit SecurityFeatureAdded(batchId, featureType, featureHash);
    }

    function verifySecurityFeature(
        uint256 batchId,
        SecurityFeatureType featureType,
        bytes32 featureHash
    ) public view returns (bool) {
        SecurityFeature memory feature = securityFeatures[batchId][featureType];
        return feature.isValid && feature.featureHash == featureHash;
    }

    function reportSuspiciousActivity(
        uint256 batchId,
        string memory evidence
    ) public whenNotPaused {
        require(batchStatus[batchId] != VerificationStatus.Unknown, "Batch not registered");

        reports[batchId].push(Report({
            reporter: msg.sender,
            batchId: batchId,
            evidence: evidence,
            timestamp: block.timestamp,
            status: VerificationStatus.Suspicious,
            isResolved: false
        }));

        if (batchStatus[batchId] == VerificationStatus.Authentic) {
            batchStatus[batchId] = VerificationStatus.Suspicious;
            emit BatchStatusUpdated(batchId, VerificationStatus.Suspicious);
        }

        emit SuspiciousActivityReported(batchId, msg.sender, block.timestamp);
    }

    function updateBatchStatus(
        uint256 batchId,
        VerificationStatus newStatus
    ) public onlyRole(VERIFIER_ROLE) whenNotPaused {
        require(newStatus != VerificationStatus.Unknown, "Cannot set Unknown status");
        batchStatus[batchId] = newStatus;
        emit BatchStatusUpdated(batchId, newStatus);
    }

    function getBatchReports(uint256 batchId) 
        public 
        view 
        returns (
            address[] memory reporters,
            string[] memory evidences,
            uint256[] memory timestamps,
            VerificationStatus[] memory statuses,
            bool[] memory resolutions
        ) 
    {
        Report[] storage batchReports = reports[batchId];
        uint256 length = batchReports.length;

        reporters = new address[](length);
        evidences = new string[](length);
        timestamps = new uint256[](length);
        statuses = new VerificationStatus[](length);
        resolutions = new bool[](length);

        for (uint256 i = 0; i < length; i++) {
            Report storage report = batchReports[i];
            reporters[i] = report.reporter;
            evidences[i] = report.evidence;
            timestamps[i] = report.timestamp;
            statuses[i] = report.status;
            resolutions[i] = report.isResolved;
        }

        return (reporters, evidences, timestamps, statuses, resolutions);
    }

    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}