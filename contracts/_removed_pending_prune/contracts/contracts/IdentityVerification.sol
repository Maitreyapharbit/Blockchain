// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Deprecated - IdentityVerification
/// @notice Identity verification moved to `Tracking.sol`. This file is a minimal DEPRECATED stub.
contract DeprecatedIdentityVerification {
    // Replaced by `Tracking.sol`.
} 

    // FDA-compliant identity record
    struct EntityIdentity {
        address walletAddress;
        string legalEntityName;            // e.g., "Pfizer Inc."
        string businessRegistration;       // e.g., "DEA123456789"
        string businessType;               // "MANUFACTURER", "DISTRIBUTOR", "PHARMACY"
        
        // Verification trail (auditable)
        VerificationLevel verificationLevel;
        address[] verifiers;               // Chain of verifiers
        uint256[] verificationDates;       // When verified at each level
        string[] verificationDocuments;    // Hash of supporting docs
        
        // Current status
        bool isApproved;
        uint256 approvedAt;
        address approvedBy;
        uint256 approvalExpiresAt;         // Must be re-verified annually
        
        // Compliance flags
        bool isUnderSanctions;             // OFAC/sanctions check
        bool isBanned;                     // Debarred from FDA contracts
        string banReason;
    }

    // Verification requirement checklist
    struct VerificationChecklist {
        bool businessLicenseValid;
        bool operatingLicenseValid;
        bool noSanctionsFlagFromOFAC;
        bool noPriorCounterfeitingHistory;
        bool noOutstandingFDAComplaintRecords;
        bool businessInsuranceActive;
        bool principalsIdentified;
        bool coldChainCapabilityVerified;
        bool pharmEducationCertified;
    }

    // Storage
    mapping(address => EntityIdentity) public entities;
    mapping(address => VerificationChecklist) public verificationStatus;
    mapping(string => address) public businessRegistrationToAddress; // DEA123 => 0x...

    // Verification request workflow
    struct VerificationRequest {
        address applicantAddress;
        string legalEntityName;
        string businessRegistration;
        string businessType;
        string documentHash;               // Hash of application documents
        uint256 requestedAt;
        VerificationLevel targetLevel;
        address assignedVerifier;
        bool isApproved;
        string approvalNotes;
    }

    mapping(bytes32 => VerificationRequest) public verificationRequests;
    bytes32[] public openRequests;

    // Sanctions list (would be pulled from OFAC in production)
    mapping(string => bool) public sanctionsBlocklist;

    // Events
    event VerificationRequested(
        address indexed applicant,
        string legalEntityName,
        string businessRegistration,
        VerificationLevel targetLevel,
        uint256 timestamp
    );

    event VerificationStepCompleted(
        address indexed entity,
        VerificationLevel level,
        address verifier,
        string documentHash,
        uint256 timestamp
    );

    event EntityApproved(
        address indexed entity,
        string businessType,
        address approver,
        uint256 approvalExpiresAt,
        uint256 timestamp
    );

    event EntityBanned(
        address indexed entity,
        string reason,
        address issuer,
        uint256 timestamp
    );

    event SanctionsCheckPerformed(
        address indexed entity,
        bool isBlocked,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ============================================================================
    // VERIFICATION WORKFLOW
    // ============================================================================

    /**
     * @notice Submit identity verification request
     * @dev This is step 1: entity applies for a role
     * @param legalEntityName e.g., "CVS Pharmacy Inc."
     * @param businessRegistration e.g., DEA or state license number
     * @param businessType e.g., "PHARMACY"
     * @param documentHashIPFS Hash of supporting documents (DEA license, articles of incorporation)
     */
    function requestIdentityVerification(
        string calldata legalEntityName,
        string calldata businessRegistration,
        string calldata businessType,
        string calldata documentHashIPFS
    ) external nonReentrant {
        require(entities[msg.sender].walletAddress == address(0), "Already registered");
        require(bytes(legalEntityName).length > 0, "Name required");
        require(bytes(businessRegistration).length > 0, "Registration required");
        require(bytes(businessType).length > 0, "Type required");

        // Check if this registration is already used
        require(
            businessRegistrationToAddress[businessRegistration] == address(0),
            "Registration already used"
        );

        bytes32 requestId = keccak256(
            abi.encodePacked(msg.sender, block.timestamp)
        );

        VerificationRequest storage req = verificationRequests[requestId];
        req.applicantAddress = msg.sender;
        req.legalEntityName = legalEntityName;
        req.businessRegistration = businessRegistration;
        req.businessType = businessType;
        req.documentHash = documentHashIPFS;
        req.requestedAt = block.timestamp;
        req.targetLevel = VerificationLevel.ENHANCED;
        req.isApproved = false;

        openRequests.push(requestId);

        emit VerificationRequested(
            msg.sender,
            legalEntityName,
            businessRegistration,
            VerificationLevel.ENHANCED,
            block.timestamp
        );
    }

    /**
     * @notice Verifier completes one verification step
     * @dev FDA auditor will verify this multi-step process was followed
     */
    function completeVerificationStep(
        address entityAddress,
        VerificationLevel stepLevel,
        string calldata documentHashProof,
        string calldata notes
    ) external onlyRole(VERIFIER_ROLE) nonReentrant {
        require(entityAddress != address(0), "Invalid entity");

        EntityIdentity storage entity = entities[entityAddress];
        
        // First verification (entity doesn't exist yet)
        if (entity.walletAddress == address(0)) {
            entity.walletAddress = entityAddress;
            entity.verificationLevel = stepLevel;
            entity.verifiers.push(msg.sender);
            entity.verificationDates.push(block.timestamp);
            entity.verificationDocuments.push(documentHashProof);
        } else {
            // Subsequent verifications
            require(
                stepLevel > entity.verificationLevel,
                "Can only increase verification level"
            );
            entity.verificationLevel = stepLevel;
            entity.verifiers.push(msg.sender);
            entity.verificationDates.push(block.timestamp);
            entity.verificationDocuments.push(documentHashProof);
        }

        emit VerificationStepCompleted(
            entityAddress,
            stepLevel,
            msg.sender,
            documentHashProof,
            block.timestamp
        );
    }

    /**
     * @notice FDA compliance officer approves entity for role assignment
     * @dev This is the final gate: no role until this is called
     */
    function approveForRoleAssignment(
        address entityAddress,
        string calldata businessType,
        uint256 approvalValidityDays
    ) external onlyRole(COMPLIANCE_ROLE) nonReentrant {
        require(entityAddress != address(0), "Invalid address");
        require(approvalValidityDays > 0, "Validity required");

        EntityIdentity storage entity = entities[entityAddress];
        require(
            entity.verificationLevel >= VerificationLevel.ENHANCED,
            "Insufficient verification level"
        );
        require(!entity.isUnderSanctions, "Entity under sanctions");
        require(!entity.isBanned, "Entity is banned");

        entity.businessType = businessType;
        entity.isApproved = true;
        entity.approvedAt = block.timestamp;
        entity.approvedBy = msg.sender;
        entity.approvalExpiresAt = block.timestamp + (approvalValidityDays * 1 days);

        emit EntityApproved(
            entityAddress,
            businessType,
            msg.sender,
            entity.approvalExpiresAt,
            block.timestamp
        );
    }

    /**
     * @notice Perform OFAC sanctions check (would call external oracle in production)
     */
    function performSanctionsCheck(
        address entityAddress,
        string calldata businessName
    ) external onlyRole(VERIFIER_ROLE) {
        // In production, call OFAC API
        bool isBlocked = sanctionsBlocklist[businessName];

        EntityIdentity storage entity = entities[entityAddress];
        entity.isUnderSanctions = isBlocked;

        emit SanctionsCheckPerformed(entityAddress, isBlocked, block.timestamp);
    }

    /**
     * @notice Ban an entity (e.g., due to counterfeiting history)
     */
    function banEntity(
        address entityAddress,
        string calldata reason
    ) external onlyRole(COMPLIANCE_ROLE) {
        require(entityAddress != address(0), "Invalid address");

        EntityIdentity storage entity = entities[entityAddress];
        entity.isBanned = true;
        entity.banReason = reason;

        emit EntityBanned(entityAddress, reason, msg.sender, block.timestamp);
    }

    // ============================================================================
    // ROLE ASSIGNMENT (Only after identity verification completes)
    // ============================================================================

    /**
     * @notice Check if entity is approved for a role
     * @dev Returns false if: unverified, banned, sanctions, or approval expired
     */
    function isApprovedForRole(address entityAddress) external view returns (bool) {
        EntityIdentity memory entity = entities[entityAddress];
        
        return entity.isApproved &&
               !entity.isBanned &&
               !entity.isUnderSanctions &&
               entity.approvalExpiresAt > block.timestamp;
    }

    /**
     * @notice Get identity details (FDA will audit this)
     */
    function getEntityIdentity(address entityAddress)
        external
        view
        returns (EntityIdentity memory)
    {
        return entities[entityAddress];
    }

    /**
     * @notice Get full verification history for a single entity
     */
    function getVerificationHistory(address entityAddress)
        external
        view
        returns (
            VerificationLevel level,
            address[] memory verifiers,
            uint256[] memory dates,
            string[] memory documents
        )
    {
        EntityIdentity memory entity = entities[entityAddress];
        return (
            entity.verificationLevel,
            entity.verifiers,
            entity.verificationDates,
            entity.verificationDocuments
        );
    }

    /**
     * @notice Get pending verification requests (for verifier dashboard)
     */
    function getPendingRequests() external view returns (bytes32[] memory) {
        return openRequests;
    }

    /**
     * @notice Get specific verification request
     */
    function getVerificationRequest(bytes32 requestId)
        external
        view
        returns (VerificationRequest memory)
    {
        return verificationRequests[requestId];
    }

    // ============================================================================
    // ADMIN
    // ============================================================================

    /**
     * @notice Add to sanctions blocklist
     */
    function addToSanctionsList(string calldata entityName)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        sanctionsBlocklist[entityName] = true;
    }

    /**
     * @notice Register a verifier
     */
    function registerVerifier(address verifier)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _grantRole(VERIFIER_ROLE, verifier);
    }

    /**
     * @notice Register a compliance officer
     */
    function registerComplianceOfficer(address officer)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _grantRole(COMPLIANCE_ROLE, officer);
    }
}
