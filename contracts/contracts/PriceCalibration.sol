// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract PriceCalibration is AccessControl {
    bytes32 public constant PRICE_ROLE = keccak256("PRICE_ROLE");

    struct PriceCheckpoint {
        bytes32 batchId;
        uint256 price; // price in smallest currency unit
        bytes32 notesHash; // IPFS or off-chain notes hash
        uint256 timestamp;
    }

    // For gas efficiency, keep only cumulative hash on-chain and emit events per checkpoint
    mapping(bytes32 => bytes32) public cumulativeCheckpointHash; // batchId => cumulative hash
    mapping(bytes32 => uint256) public checkpointCount;

    // Private pricing: store price hashes with authorized viewers mapping
    mapping(bytes32 => mapping(address => bool)) public privatePriceAccess; // batchId => viewer => allowed
    mapping(bytes32 => bytes32[]) public privatePriceHashes; // store minimal hashes (short-lived)

    event PriceCheckpointAdded(bytes32 indexed batchId, uint256 price, bytes32 notesHash, uint256 timestamp, bytes32 cumulativeHash);
    event PrivatePriceHashAdded(bytes32 indexed batchId, bytes32 priceHash, address indexed addedBy, uint256 timestamp);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PRICE_ROLE, msg.sender);
    }

    function addPriceCheckpoint(bytes32 batchId, uint256 price, bytes32 notesHash) external onlyRole(PRICE_ROLE) {
        bytes32 checkpointHash = keccak256(abi.encodePacked(batchId, price, notesHash, block.timestamp));

        // update cumulativeHash = keccak256(prev, checkpointHash)
        bytes32 prev = cumulativeCheckpointHash[batchId];
        bytes32 newCum = keccak256(abi.encodePacked(prev, checkpointHash));
        cumulativeCheckpointHash[batchId] = newCum;
        checkpointCount[batchId] += 1;

        emit PriceCheckpointAdded(batchId, price, notesHash, block.timestamp, newCum);
    }

    function addPrivatePriceHash(bytes32 batchId, bytes32 priceHash) external onlyRole(PRICE_ROLE) {
        privatePriceHashes[batchId].push(priceHash);
        emit PrivatePriceHashAdded(batchId, priceHash, msg.sender, block.timestamp);
    }

    function grantPrivateAccess(bytes32 batchId, address viewer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        privatePriceAccess[batchId][viewer] = true;
    }

    function revokePrivateAccess(bytes32 batchId, address viewer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        privatePriceAccess[batchId][viewer] = false;
    }

    function canViewPrivatePrice(bytes32 batchId, address viewer) external view returns (bool) {
        return privatePriceAccess[batchId][viewer];
    }
}
