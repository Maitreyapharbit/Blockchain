// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title Tracking
/// @notice FDA 21 CFR Part 11 signature, signer identity, and attributable action registry.
/// @dev Consolidates SignatureSuite, AttributableActions, IoTComplianceTracker, IdentityVerification.
contract Tracking is AccessControl, ReentrancyGuard {
    using ECDSA for bytes32;

    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    enum SignatureIntent { BATCH_VERIFICATION, PRICE_APPROVAL, TRANSFER_AUTHORIZATION, RECALL_APPROVAL, IDENTITY_VERIFICATION, CUSTODY_TRANSFER, COMPLIANCE_ATTESTATION }

    struct SignerIdentity {
        address walletAddress;
        bytes32 employeeId;
        bytes32 organizationId;
        bytes32 jobTitle;
        bool isVerified;
        uint256 verifiedAt;
        address verifier;
        uint256 rolesExpireAt;
    }

    struct CFRSignature {
        bytes32 documentHash;
        address signer;
        bytes32 signerEmployeeId;
        SignatureIntent intent;
        bytes32 intentStatement;
        bytes32 signatureHash;
        uint256 signedAt;
        uint256 expiresAt;
    }

    mapping(address => SignerIdentity) public signerIdentities;
    mapping(bytes32 => CFRSignature[]) public signatureRecords; // documentHash => signatures

    event SignerVerified(address indexed signer, bytes32 employeeId, bytes32 organizationId, address verifier, uint256 timestamp);
    event SignatureCreated(bytes32 indexed documentHash, address indexed signer, SignatureIntent intent, bytes32 intentStatement, uint256 timestamp);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function registerAndVerifySignerIdentity(
        address signerAddress,
        bytes32 employeeId,
        bytes32 organizationId,
        bytes32 jobTitle,
        uint256 expiryDate
    ) external onlyRole(AUDITOR_ROLE) nonReentrant {
        require(signerAddress != address(0), "Invalid address");
        require(expiryDate > block.timestamp, "Expiry date must be in future");
        require(employeeId != bytes32(0), "Employee ID required");

        SignerIdentity storage identity = signerIdentities[signerAddress];
        identity.walletAddress = signerAddress;
        identity.employeeId = employeeId;
        identity.organizationId = organizationId;
        identity.jobTitle = jobTitle;
        identity.isVerified = true;
        identity.verifiedAt = block.timestamp;
        identity.verifier = msg.sender;
        identity.rolesExpireAt = expiryDate;

        emit SignerVerified(signerAddress, employeeId, organizationId, msg.sender, block.timestamp);
    }

    function isSignerAuthorized(address signer) public view returns (bool) {
        SignerIdentity memory identity = signerIdentities[signer];
        return identity.isVerified && identity.rolesExpireAt > block.timestamp;
    }

    function createSignature(
        bytes32 documentHash,
        SignatureIntent intent,
        bytes32 intentStatement,
        bytes32 signingReason,
        bytes calldata signature,
        uint256 expiryDays
    ) external nonReentrant {
        require(isSignerAuthorized(msg.sender), "Signer not authorized");
        require(intentStatement != bytes32(0), "Intent statement required");
        require(signature.length > 0, "Signature required");

        bytes32 messageHash = keccak256(abi.encodePacked(documentHash, intentStatement, signingReason));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        require(recoveredSigner == msg.sender, "Signature verification failed");

        uint256 expiresAt = expiryDays > 0 ? block.timestamp + (expiryDays * 1 days) : 0;

        CFRSignature memory sig = CFRSignature({
            documentHash: documentHash,
            signer: msg.sender,
            signerEmployeeId: signerIdentities[msg.sender].employeeId,
            intent: intent,
            intentStatement: intentStatement,
            signatureHash: keccak256(signature),
            signedAt: block.timestamp,
            expiresAt: expiresAt
        });

        signatureRecords[documentHash].push(sig);

        emit SignatureCreated(documentHash, msg.sender, intent, intentStatement, block.timestamp);
    }

    function getSignerIdentity(address signer) external view returns (SignerIdentity memory) {
        return signerIdentities[signer];
    }

    function getDocumentSignatures(bytes32 documentHash) external view returns (CFRSignature[] memory) {
        return signatureRecords[documentHash];
    }
}
