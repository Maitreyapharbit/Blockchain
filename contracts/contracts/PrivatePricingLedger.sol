// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PrivatePricingLedger
 * @dev Tessera-compatible private contract for sensitive pricing data
 * @notice Prices stored only in Tessera enclave, hashes recorded on public blockchain
 * @dev This contract is designed for Hyperledger Besu with Tessera private transactions
 */
contract PrivatePricingLedger is AccessControl, ReentrancyGuard {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    // Only hash stored on public blockchain
    struct PriceCheckpoint {
        bytes32 batchId;
        bytes32 priceHash;              // Hash of (batchId, price, timestamp)
        address recordedBy;
        uint256 recordedAt;
        string stage;                   // "MANUFACTURER", "WHOLESALER", "PHARMACY", "INSURANCE"
        address[] authorizedViewers;    // Who can see the plaintext price
    }

    // Markup detection record
    struct MarkupDetection {
        bytes32 batchId;
        bytes32 previousHash;
        bytes32 currentHash;
        uint256 markupPercentage;       // Calculated from plaintext only
        bool isSuspicious;              // > 200% markup
        uint256 detectedAt;
    }

    // Storage - only hashes, no plaintext
    mapping(bytes32 => PriceCheckpoint[]) public priceHistory;
    mapping(bytes32 => MarkupDetection[]) public markupHistory;
    mapping(bytes32 => bool) public batchHasPrivateData;

    bytes32[] private allBatchIds;

    // Events - only emit hashes, not prices
    event PriceCheckpointRecorded(
        bytes32 indexed batchId,
        bytes32 priceHash,
        string stage,
        address indexed recordedBy,
        address[] authorizedViewers,
        uint256 timestamp
    );

    event MarkupDetected(
        bytes32 indexed batchId,
        uint256 markupPercentage,
        bool isSuspicious,
        uint256 timestamp
    );

    event AuditorAccessGranted(
        bytes32 indexed batchId,
        address indexed regulator,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Record a price checkpoint (PRIVATE TRANSACTION via Tessera)
     * @notice This function should be called as a Tessera private transaction
     * @param batchId Batch identifier
     * @param priceHash Hash of (batchId, price, timestamp, stage)
     * @param stage Supply chain stage
     * @param authorizedViewers Parties who can see plaintext price
     */
    function recordPriceCheckpoint(
        bytes32 batchId,
        bytes32 priceHash,
        string memory stage,
        address[] memory authorizedViewers
    ) external onlyRole(MANUFACTURER_ROLE) nonReentrant {
        require(batchId != bytes32(0), "Invalid batch ID");
        require(priceHash != bytes32(0), "Invalid price hash");
        require(bytes(stage).length > 0, "Stage required");

        // Record only the hash on public blockchain
        PriceCheckpoint memory checkpoint = PriceCheckpoint({
            batchId: batchId,
            priceHash: priceHash,
            recordedBy: msg.sender,
            recordedAt: block.timestamp,
            stage: stage,
            authorizedViewers: authorizedViewers
        });

        priceHistory[batchId].push(checkpoint);

        // Track batches with private data
        if (!batchHasPrivateData[batchId]) {
            allBatchIds.push(batchId);
            batchHasPrivateData[batchId] = true;
        }

        emit PriceCheckpointRecorded(
            batchId,
            priceHash,
            stage,
            msg.sender,
            authorizedViewers,
            block.timestamp
        );
    }

    /**
     * @dev Verify a price without revealing it
     * @notice FDA regulator calls this with plaintext; contract verifies hash matches
     * @param batchId Batch to verify
     * @param plaintext Price, timestamp, stage concatenated
     * @return isValid True if hash matches stored hash
     */
    function verifyPrice(bytes32 batchId, bytes memory plaintext)
        external
        view
        returns (bool isValid)
    {
        require(batchId != bytes32(0), "Invalid batch ID");
        require(plaintext.length > 0, "Plaintext required");

        // Calculate hash of provided data
        bytes32 calculatedHash = keccak256(plaintext);

        // Find matching checkpoint
        PriceCheckpoint[] memory checkpoints = priceHistory[batchId];
        for (uint256 i = 0; i < checkpoints.length; i++) {
            if (checkpoints[i].priceHash == calculatedHash) {
                // Verify regulator is authorized to view
                bool isAuthorized = false;
                for (uint256 j = 0; j < checkpoints[i].authorizedViewers.length; j++) {
                    if (checkpoints[i].authorizedViewers[j] == msg.sender) {
                        isAuthorized = true;
                        break;
                    }
                }

                return isAuthorized;
            }
        }

        return false;
    }

    /**
     * @dev Detect price markup between two checkpoints
     * @notice This is called off-chain with plaintext prices, results recorded here
     * @param batchId Batch being tracked
     * @param previousHash Hash from previous checkpoint
     * @param currentHash Hash from current checkpoint
     * @param markupPercentage Calculated markup % (only disclosed if > 200%)
     */
    function detectMarkup(
        bytes32 batchId,
        bytes32 previousHash,
        bytes32 currentHash,
        uint256 markupPercentage
    ) external onlyRole(REGULATOR_ROLE) nonReentrant {
        require(batchId != bytes32(0), "Invalid batch ID");

        bool isSuspicious = markupPercentage > 200;

        MarkupDetection memory detection = MarkupDetection({
            batchId: batchId,
            previousHash: previousHash,
            currentHash: currentHash,
            markupPercentage: markupPercentage,
            isSuspicious: isSuspicious,
            detectedAt: block.timestamp
        });

        markupHistory[batchId].push(detection);

        emit MarkupDetected(batchId, markupPercentage, isSuspicious, block.timestamp);
    }

    /**
     * @dev Grant regulator access to price data for a batch
     * @param batchId Batch to access
     * @param regulator Regulator's address
     */
    function grantAuditorAccess(bytes32 batchId, address regulator)
        external
        onlyRole(MANUFACTURER_ROLE)
    {
        require(batchId != bytes32(0), "Invalid batch ID");
        require(regulator != address(0), "Invalid regulator address");

        // Add regulator to authorized viewers in latest checkpoint
        PriceCheckpoint[] storage checkpoints = priceHistory[batchId];
        if (checkpoints.length > 0) {
            PriceCheckpoint storage latest = checkpoints[checkpoints.length - 1];
            latest.authorizedViewers.push(regulator);
        }

        emit AuditorAccessGranted(batchId, regulator, block.timestamp);
    }

    /**
     * @dev Get price history for a batch (only hashes)
     */
    function getPriceHistory(bytes32 batchId)
        external
        view
        returns (PriceCheckpoint[] memory)
    {
        return priceHistory[batchId];
    }

    /**
     * @dev Get markup history for a batch
     */
    function getMarkupHistory(bytes32 batchId)
        external
        view
        returns (MarkupDetection[] memory)
    {
        return markupHistory[batchId];
    }

    /**
     * @dev Get all batches with private price data
     */
    function getAllBatchesWithPrices()
        external
        view
        returns (bytes32[] memory)
    {
        return allBatchIds;
    }

    /**
     * @dev Check if regulator is authorized to view a batch's price
     */
    function isAuditorAuthorized(bytes32 batchId, address regulator)
        external
        view
        returns (bool)
    {
        PriceCheckpoint[] memory checkpoints = priceHistory[batchId];
        if (checkpoints.length == 0) return false;

        PriceCheckpoint memory latest = checkpoints[checkpoints.length - 1];
        for (uint256 i = 0; i < latest.authorizedViewers.length; i++) {
            if (latest.authorizedViewers[i] == regulator) {
                return true;
            }
        }

        return false;
    }

    /**
     * @dev Get count of price checkpoints for a batch
     */
    function getPriceCheckpointCount(bytes32 batchId)
        external
        view
        returns (uint256)
    {
        return priceHistory[batchId].length;
    }
}
