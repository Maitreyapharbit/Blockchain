// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title SignatureSuite
 * @dev FDA 21 CFR Part 11 Compliant Signature Suite
 * @notice Each signature must explicitly document the intent (what is being signed and why)
 */
contract SignatureSuite is AccessControl, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes;

    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    // Signature intent types (21 CFR Part 11 requirement)
    enum SignatureIntent {
        BATCH_VERIFICATION,      // "I am verifying this batch"
        PRICE_APPROVAL,          // "I am approving this price"
        TRANSFER_AUTHORIZATION,  // "I am authorizing this transfer"
        RECALL_APPROVAL,         // "I am approving this recall"
        IDENTITY_VERIFICATION,   // "I am verifying this entity's identity"
        CUSTODY_TRANSFER,        // "I am accepting custody of this batch"
        COMPLIANCE_ATTESTATION   // "I am attesting this meets compliance standards"
    }

    // FDA-compliant signature record
    struct CFRPartElevenSignature {
        bytes32 documentHash;              // Hash of document being signed
        address signer;                    // Who signed
        string signerRole;                 // Employee ID or role (required by 21 CFR 11.100)
        SignatureIntent intent;            // Explicit intent statement
        string intentStatement;            // Human-readable intent (e.g., "I am verifying batch 12345")
        bytes signature;                   // The actual signature bytes
        uint256 signedAt;                  // Block timestamp
        string signingReason;              // Business reason (auditable)
        bool isLegallyBinding;             // Whether this counts as signing the original
        uint256 expiresAt;                 // Signature validity period (0 = permanent)
    }

    // Signature record storage
    mapping(bytes32 => CFRPartElevenSignature[]) public signatureRecords;  // documentHash => signatures
    mapping(address => CFRPartElevenSignature[]) public signerHistory;     // signer => all signatures

    // Employee/Signer verification (before they can sign)
    struct SignerIdentity {
        address walletAddress;
        string employeeId;                 // FDA requirement: tie signature to employee
        string organizationId;             // FDA requirement: tie signature to organization
        string jobTitle;                   // FDA requirement: authorization context
        bool isVerified;                   // KYC/AML verification status
        uint256 verifiedAt;
        address verifier;                  // Who verified this person
        uint256 rolesExpireAt;             // When authorization expires
    }

    mapping(address => SignerIdentity) public signerIdentities;

    // Batch signing requirements (multi-sig workflow)
    struct SigningRequirement {
        bytes32 documentHash;
        SignatureIntent intent;
        address[] requiredSigners;         // Who must sign
        mapping(address => bool) hasSigned;
        uint256 requiredSignatures;        // How many needed
        uint256 signaturesCollected;
        bool isComplete;
        uint256 createdAt;
        uint256 expiresAt;
    }

    mapping(bytes32 => SigningRequirement) public signingRequirements;

    // Events (audit trail)
    event SignatureCreated(
        bytes32 indexed documentHash,
        address indexed signer,
        SignatureIntent intent,
        string intentStatement,
        uint256 timestamp
    );

    event SignerVerified(
        address indexed signer,
        string employeeId,
        string organizationId,
        address verifier,
        uint256 timestamp
    );

    event SigningRequirementCreated(
        bytes32 indexed documentHash,
        SignatureIntent intent,
        uint256 requiredSignatures,
        uint256 timestamp
    );

    event SigningRequirementMet(
        bytes32 indexed documentHash,
        address[] signers,
        uint256 timestamp
    );

    event SignatureVerified(
        bytes32 indexed documentHash,
        address signer,
        bool isValid,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ============================================================================
    // SIGNER IDENTITY MANAGEMENT (FDA Requirement: Know Your Signer)
    // ============================================================================

    /**
     * @notice Register and verify a signer's identity
     * @dev This is a critical gate - FDA auditors will verify this process
     * @param signerAddress The wallet address of the employee
     * @param employeeId FDA-mandated: unique employee identifier
     * @param organizationId FDA-mandated: which company/division
     * @param jobTitle FDA-mandated: authorization context (e.g., "QA Manager")
     * @param expiryDate When their authority to sign expires
     */
    function registerAndVerifySignerIdentity(
        address signerAddress,
        string calldata employeeId,
        string calldata organizationId,
        string calldata jobTitle,
        uint256 expiryDate
    ) external onlyRole(AUDITOR_ROLE) nonReentrant {
        require(signerAddress != address(0), "Invalid address");
        require(expiryDate > block.timestamp, "Expiry date must be in future");
        require(bytes(employeeId).length > 0, "Employee ID required");
        require(bytes(organizationId).length > 0, "Organization ID required");

        SignerIdentity storage identity = signerIdentities[signerAddress];
        identity.walletAddress = signerAddress;
        identity.employeeId = employeeId;
        identity.organizationId = organizationId;
        identity.jobTitle = jobTitle;
        identity.isVerified = true;
        identity.verifiedAt = block.timestamp;
        identity.verifier = msg.sender;
        identity.rolesExpireAt = expiryDate;

        emit SignerVerified(
            signerAddress,
            employeeId,
            organizationId,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Check if a signer is authorized and their credentials are current
     */
    function isSignerAuthorized(address signer) public view returns (bool) {
        SignerIdentity memory identity = signerIdentities[signer];
        return identity.isVerified && identity.rolesExpireAt > block.timestamp;
    }

    // ============================================================================
    // SIGNATURE CREATION (21 CFR Part 11: Document Intent)
    // ============================================================================

    /**
     * @notice Create a signature with explicit intent statement
     * @dev This satisfies 21 CFR Part 11.100(b) requirement for signature meaning
     * @param documentHash Hash of the document being signed
     * @param intent What is being done (enum)
     * @param intentStatement Human-readable statement (e.g., "I verify batch #XYZ meets QA standards")
     * @param signingReason Business reason for signing
     * @param signature The actual signature bytes from the signer
     * @param expiryDays How many days until this signature expires (0 = permanent)
     */
    function createSignature(
        bytes32 documentHash,
        SignatureIntent intent,
        string calldata intentStatement,
        string calldata signingReason,
        bytes calldata signature,
        uint256 expiryDays
    ) external nonReentrant {
        // Verify signer is authorized
        require(isSignerAuthorized(msg.sender), "Signer not authorized");
        require(bytes(intentStatement).length > 0, "Intent statement required");
        require(signature.length > 0, "Signature required");

        // Verify the signature matches the document
        bytes32 messageHash = keccak256(
            abi.encodePacked(documentHash, intentStatement, signingReason)
        );
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        require(recoveredSigner == msg.sender, "Signature verification failed");

        uint256 expiresAt = expiryDays > 0 
            ? block.timestamp + (expiryDays * 1 days)
            : 0; // 0 = permanent

        CFRPartElevenSignature memory sig = CFRPartElevenSignature({
            documentHash: documentHash,
            signer: msg.sender,
            signerRole: signerIdentities[msg.sender].employeeId,
            intent: intent,
            intentStatement: intentStatement,
            signature: signature,
            signedAt: block.timestamp,
            signingReason: signingReason,
            isLegallyBinding: true,
            expiresAt: expiresAt
        });

        signatureRecords[documentHash].push(sig);
        signerHistory[msg.sender].push(sig);

        emit SignatureCreated(
            documentHash,
            msg.sender,
            intent,
            intentStatement,
            block.timestamp
        );
    }

    /**
     * @notice Verify a signature is valid and current
     */
    function verifySignature(
        bytes32 documentHash,
        address signer,
        uint256 signatureIndex
    ) external returns (bool) {
        require(signatureIndex < signatureRecords[documentHash].length, "Invalid index");
        
        CFRPartElevenSignature storage sig = signatureRecords[documentHash][signatureIndex];
        require(sig.signer == signer, "Signer mismatch");

        // Check signature hasn't expired
        bool isValid = sig.expiresAt == 0 || sig.expiresAt > block.timestamp;
        
        // Check signer is still authorized
        isValid = isValid && isSignerAuthorized(signer);

        emit SignatureVerified(documentHash, signer, isValid, block.timestamp);
        return isValid;
    }

    // ============================================================================
    // MULTI-SIG WORKFLOWS
    // ============================================================================

    /**
     * @notice Create a signing requirement (e.g., "batch needs approval from 3 QA managers")
     */
    function createSigningRequirement(
        bytes32 documentHash,
        SignatureIntent intent,
        address[] calldata requiredSigners,
        uint256 requiredSignatureCount
    ) external onlyRole(AUDITOR_ROLE) {
        require(requiredSigners.length >= requiredSignatureCount, "Invalid requirement");
        require(requiredSignatureCount > 0, "At least 1 signature required");

        SigningRequirement storage req = signingRequirements[documentHash];
        req.documentHash = documentHash;
        req.intent = intent;
        req.requiredSigners = requiredSigners;
        req.requiredSignatures = requiredSignatureCount;
        req.signaturesCollected = 0;
        req.isComplete = false;
        req.createdAt = block.timestamp;
        req.expiresAt = block.timestamp + (7 days); // 7-day window

        emit SigningRequirementCreated(
            documentHash,
            intent,
            requiredSignatureCount,
            block.timestamp
        );
    }

    /**
     * @notice Collect signatures for a multi-sig requirement
     */
    function collectSignature(
        bytes32 documentHash,
        string calldata intentStatement,
        string calldata signingReason,
        bytes calldata signature
    ) external nonReentrant {
        SigningRequirement storage req = signingRequirements[documentHash];
        require(!req.isComplete, "Signing already complete");
        require(block.timestamp <= req.expiresAt, "Signing window expired");
        require(isSignerAuthorized(msg.sender), "Signer not authorized");

        // Verify signer is in the required list
        bool isRequired = false;
        for (uint i = 0; i < req.requiredSigners.length; i++) {
            if (req.requiredSigners[i] == msg.sender) {
                isRequired = true;
                break;
            }
        }
        require(isRequired, "Not a required signer");
        require(!req.hasSigned[msg.sender], "Already signed");

        // Create the signature record
        this.createSignature(
            documentHash,
            req.intent,
            intentStatement,
            signingReason,
            signature,
            0 // Permanent
        );

        req.hasSigned[msg.sender] = true;
        req.signaturesCollected++;

        if (req.signaturesCollected >= req.requiredSignatures) {
            req.isComplete = true;
            emit SigningRequirementMet(documentHash, req.requiredSigners, block.timestamp);
        }
    }

    // ============================================================================
    // AUDIT QUERIES
    // ============================================================================

    /**
     * @notice Get all signatures on a document (audit trail)
     */
    function getDocumentSignatures(bytes32 documentHash)
        external
        view
        returns (CFRPartElevenSignature[] memory)
    {
        return signatureRecords[documentHash];
    }

    /**
     * @notice Get all signatures by an employee (employment audit trail)
     */
    function getSignerHistory(address signer)
        external
        view
        returns (CFRPartElevenSignature[] memory)
    {
        return signerHistory[signer];
    }

    /**
     * @notice Get signer identity for FDA verification
     */
    function getSignerIdentity(address signer)
        external
        view
        returns (SignerIdentity memory)
    {
        return signerIdentities[signer];
    }

    /**
     * @notice Check if multi-sig requirement is complete
     */
    function isSigningComplete(bytes32 documentHash) external view returns (bool) {
        return signingRequirements[documentHash].isComplete;
    }
}
