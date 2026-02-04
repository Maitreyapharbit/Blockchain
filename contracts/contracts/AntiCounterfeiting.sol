// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract AntiCounterfeiting is AccessControl, Pausable {
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
        bytes32 evidenceHash;
        uint256 timestamp;
        VerificationStatus status;
        bool isResolved;
    }

    mapping(uint256 => mapping(SecurityFeatureType => SecurityFeature)) public securityFeatures;
    mapping(uint256 => Report[]) public reports; // limited use; consider events-only
    mapping(uint256 => VerificationStatus) public batchStatus;
    mapping(bytes32 => bool) public usedHashes;

    event SecurityFeatureAdded(uint256 indexed batchId, SecurityFeatureType featureType, bytes32 featureHash);
    event SuspiciousActivityReported(uint256 indexed batchId, address indexed reporter, uint256 timestamp);
    event BatchStatusUpdated(uint256 indexed batchId, VerificationStatus status);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MANUFACTURER_ROLE, msg.sender);
        _setupRole(VERIFIER_ROLE, msg.sender);
    }

    function addSecurityFeature(uint256 batchId, SecurityFeatureType featureType, bytes32 featureHash) public onlyRole(MANUFACTURER_ROLE) whenNotPaused {
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

    function verifySecurityFeature(uint256 batchId, SecurityFeatureType featureType, bytes32 featureHash) public view returns (bool) {
        SecurityFeature memory feature = securityFeatures[batchId][featureType];
        return feature.isValid && feature.featureHash == featureHash;
    }

    function reportSuspiciousActivity(uint256 batchId, bytes32 evidenceHash) public whenNotPaused {
        if (batchStatus[batchId] == VerificationStatus.Unknown) {
            batchStatus[batchId] = VerificationStatus.Suspicious;
            emit BatchStatusUpdated(batchId, VerificationStatus.Suspicious);
        }

        reports[batchId].push(Report({
            reporter: msg.sender,
            batchId: batchId,
            evidenceHash: evidenceHash,
            timestamp: block.timestamp,
            status: VerificationStatus.Suspicious,
            isResolved: false
        }));

        emit SuspiciousActivityReported(batchId, msg.sender, block.timestamp);
    }

    function updateBatchStatus(uint256 batchId, VerificationStatus newStatus) public onlyRole(VERIFIER_ROLE) whenNotPaused {
        require(newStatus != VerificationStatus.Unknown, "Cannot set Unknown status");
        batchStatus[batchId] = newStatus;
        emit BatchStatusUpdated(batchId, newStatus);
    }

    function isBatchFlagged(uint256 batchId) external view returns (bool) {
        return batchStatus[batchId] != VerificationStatus.Authentic && batchStatus[batchId] != VerificationStatus.Unknown;
    }

    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
