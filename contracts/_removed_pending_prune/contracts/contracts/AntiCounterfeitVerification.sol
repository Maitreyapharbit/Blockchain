// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Deprecated - AntiCounterfeitVerification
/// @notice Deprecated; functionality migrated to `AntiCounterfeiting.sol`.
contract DeprecatedAntiCounterfeitVerification {
}
    enum VerificationType { QR_SCAN, HOLOGRAM_CHECK, SERIAL_VERIFICATION }
    enum ReportStatus { PENDING, INVESTIGATING, CONFIRMED, FALSE_ALARM }

    struct SecurityFeature {
        string batchId;
        string qrCodeHash;
        string hologramId;
        string serialNumber;
        string securityPattern;
        address manufacturer;
        uint256 createdAt;
        bool isActive;
    }

    struct VerificationRecord {
        string batchId;
        VerificationType verificationType;
        bool isValid;
        address verifier;
        uint256 verifiedAt;
        string details;
    }

    struct CounterfeitReport {
        string reportId;
        string batchId;
        address reporter;
        string reportType;
        string description;
        string[] evidenceUrls;
        uint256 reportedAt;
        ReportStatus status;
        address investigator;
        string investigatorNotes;
    }

    mapping(string => SecurityFeature) public securityFeatures;
    mapping(string => VerificationRecord[]) public verificationHistory;
    mapping(string => CounterfeitReport) public counterfeitReports;
    mapping(address => bool) public authorizedVerifiers;
    mapping(string => bool) public flaggedBatches;

    string[] public batchIds;
    string[] public reportIds;
    uint256 public totalVerifications;
    uint256 public totalReports;

    event SecurityFeatureCreated(
        string indexed batchId,
        string qrCodeHash,
        string hologramId,
        string serialNumber,
        address indexed manufacturer
    );

    event VerificationPerformed(
        string indexed batchId,
        VerificationType verificationType,
        bool isValid,
        address indexed verifier
    );

    event CounterfeitReported(
        string indexed reportId,
        string indexed batchId,
        address indexed reporter,
        string reportType
    );

    event ReportStatusUpdated(
        string indexed reportId,
        ReportStatus newStatus,
        address indexed investigator
    );

    event BatchFlagged(string indexed batchId, string reason);
    event BatchUnflagged(string indexed batchId);

    modifier onlyAuthorized() {
        require(
            authorizedVerifiers[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }

    modifier securityFeatureExists(string memory batchId) {
        require(securityFeatures[batchId].createdAt > 0, "Security feature not found");
        _;
    }

    constructor() {
        authorizedVerifiers[msg.sender] = true;
    }

    function authorizeVerifier(address verifier) external onlyOwner {
        authorizedVerifiers[verifier] = true;
    }

    function revokeVerifier(address verifier) external onlyOwner {
        authorizedVerifiers[verifier] = false;
    }

    function createSecurityFeature(
        string memory batchId,
        string memory qrCodeHash,
        string memory hologramId,
        string memory serialNumber,
        string memory securityPattern
    ) external onlyAuthorized {
        require(securityFeatures[batchId].createdAt == 0, "Security feature already exists");
        require(bytes(qrCodeHash).length > 0, "QR code hash required");
        require(bytes(hologramId).length > 0, "Hologram ID required");
        require(bytes(serialNumber).length > 0, "Serial number required");

        securityFeatures[batchId] = SecurityFeature({
            batchId: batchId,
            qrCodeHash: qrCodeHash,
            hologramId: hologramId,
            serialNumber: serialNumber,
            securityPattern: securityPattern,
            manufacturer: msg.sender,
            createdAt: block.timestamp,
            isActive: true
        });

        batchIds.push(batchId);
        emit SecurityFeatureCreated(batchId, qrCodeHash, hologramId, serialNumber, msg.sender);
    }

    function verifyAuthenticity(
        string memory batchId,
        VerificationType verificationType,
        string memory providedData,
        string memory details
    ) external onlyAuthorized securityFeatureExists(batchId) returns (bool) {
        SecurityFeature memory feature = securityFeatures[batchId];
        require(feature.isActive, "Security feature inactive");

        bool isValid = false;
        
        if (verificationType == VerificationType.QR_SCAN) {
            isValid = keccak256(abi.encodePacked(providedData)) == keccak256(abi.encodePacked(feature.qrCodeHash));
        } else if (verificationType == VerificationType.HOLOGRAM_CHECK) {
            isValid = keccak256(abi.encodePacked(providedData)) == keccak256(abi.encodePacked(feature.hologramId));
        } else if (verificationType == VerificationType.SERIAL_VERIFICATION) {
            isValid = keccak256(abi.encodePacked(providedData)) == keccak256(abi.encodePacked(feature.serialNumber));
        }

        verificationHistory[batchId].push(VerificationRecord({
            batchId: batchId,
            verificationType: verificationType,
            isValid: isValid,
            verifier: msg.sender,
            verifiedAt: block.timestamp,
            details: details
        }));

        totalVerifications++;

        if (!isValid) {
            flaggedBatches[batchId] = true;
            emit BatchFlagged(batchId, "Failed verification");
        }

        emit VerificationPerformed(batchId, verificationType, isValid, msg.sender);
        return isValid;
    }

    function reportSuspiciousActivity(
        string memory reportId,
        string memory batchId,
        string memory reportType,
        string memory description,
        string[] memory evidenceUrls
    ) external {
        require(bytes(reportId).length > 0, "Report ID required");
        require(counterfeitReports[reportId].reportedAt == 0, "Report ID already exists");
        require(bytes(description).length > 0, "Description required");

        counterfeitReports[reportId] = CounterfeitReport({
            reportId: reportId,
            batchId: batchId,
            reporter: msg.sender,
            reportType: reportType,
            description: description,
            evidenceUrls: evidenceUrls,
            reportedAt: block.timestamp,
            status: ReportStatus.PENDING,
            investigator: address(0),
            investigatorNotes: ""
        });

        reportIds.push(reportId);
        totalReports++;

        flaggedBatches[batchId] = true;
        emit CounterfeitReported(reportId, batchId, msg.sender, reportType);
        emit BatchFlagged(batchId, "Suspicious activity reported");
    }

    function updateReportStatus(
        string memory reportId,
        ReportStatus newStatus,
        string memory investigatorNotes
    ) external onlyAuthorized {
        require(counterfeitReports[reportId].reportedAt > 0, "Report not found");
        
        CounterfeitReport storage report = counterfeitReports[reportId];
        report.status = newStatus;
        report.investigator = msg.sender;
        report.investigatorNotes = investigatorNotes;

        emit ReportStatusUpdated(reportId, newStatus, msg.sender);
    }

    function flagBatch(string memory batchId, string memory reason) external onlyAuthorized {
        flaggedBatches[batchId] = true;
        emit BatchFlagged(batchId, reason);
    }

    function unflagBatch(string memory batchId) external onlyAuthorized {
        flaggedBatches[batchId] = false;
        emit BatchUnflagged(batchId);
    }

    function getSecurityFeature(string memory batchId) external view returns (
        string memory,
        string memory,
        string memory,
        string memory,
        string memory,
        address,
        uint256,
        bool
    ) {
        SecurityFeature memory feature = securityFeatures[batchId];
        require(feature.createdAt > 0, "Security feature not found");
        
        return (
            feature.batchId,
            feature.qrCodeHash,
            feature.hologramId,
            feature.serialNumber,
            feature.securityPattern,
            feature.manufacturer,
            feature.createdAt,
            feature.isActive
        );
    }

    function getVerificationHistory(string memory batchId) external view returns (
        VerificationRecord[] memory
    ) {
        return verificationHistory[batchId];
    }

    function getCounterfeitReport(string memory reportId) external view returns (
        string memory,
        string memory,
        address,
        string memory,
        string memory,
        string[] memory,
        uint256,
        ReportStatus,
        address,
        string memory
    ) {
        CounterfeitReport memory report = counterfeitReports[reportId];
        require(report.reportedAt > 0, "Report not found");
        
        return (
            report.reportId,
            report.batchId,
            report.reporter,
            report.reportType,
            report.description,
            report.evidenceUrls,
            report.reportedAt,
            report.status,
            report.investigator,
            report.investigatorNotes
        );
    }

    function isBatchFlagged(string memory batchId) external view returns (bool) {
        return flaggedBatches[batchId];
    }

    function getFlaggedBatches() external view returns (string[] memory) {
        string[] memory flagged = new string[](batchIds.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < batchIds.length; i++) {
            if (flaggedBatches[batchIds[i]]) {
                flagged[count] = batchIds[i];
                count++;
            }
        }
        
        // Resize array to actual count
        string[] memory result = new string[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = flagged[i];
        }
        
        return result;
    }

    function getAllBatchIds() external view returns (string[] memory) {
        return batchIds;
    }

    function getAllReportIds() external view returns (string[] memory) {
        return reportIds;
    }
}