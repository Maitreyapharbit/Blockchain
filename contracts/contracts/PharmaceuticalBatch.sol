// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract PharmaceuticalBatch is AccessControl {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    
    uint256 private _batchIds;

    struct Batch {
        uint256 id;
        address manufacturer;
        string drugName;
        uint256 quantity;
        uint256 manufacturingDate;
        uint256 expiryDate;
        bool isValid;
    }

    mapping(uint256 => Batch) public batches;
    mapping(address => bool) public authorizedAddresses;

    event BatchCreated(uint256 indexed batchId, address indexed manufacturer, string drugName);
    event BatchValidated(uint256 indexed batchId, address indexed validator);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier onlyAuthorized() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
            hasRole(MANUFACTURER_ROLE, msg.sender) ||
            hasRole(DISTRIBUTOR_ROLE, msg.sender),
            "Not authorized"
        );
        _;
    }

    function createBatch(
        string memory drugName,
        uint256 quantity,
        uint256 manufacturingDate,
        uint256 expiryDate
    ) external onlyRole(MANUFACTURER_ROLE) returns (uint256) {
        require(bytes(drugName).length > 0, "Drug name cannot be empty");
        require(quantity > 0, "Quantity must be greater than 0");
        require(expiryDate > manufacturingDate, "Invalid dates");

        _batchIds += 1;
        uint256 newBatchId = _batchIds;

        batches[newBatchId] = Batch({
            id: newBatchId,
            manufacturer: msg.sender,
            drugName: drugName,
            quantity: quantity,
            manufacturingDate: manufacturingDate,
            expiryDate: expiryDate,
            isValid: true
        });

        emit BatchCreated(newBatchId, msg.sender, drugName);
        return newBatchId;
    }

    function validateBatch(uint256 batchId) external onlyRole(DISTRIBUTOR_ROLE) {
        require(batches[batchId].id != 0, "Batch does not exist");
        require(batches[batchId].isValid, "Batch is not valid");
        
        emit BatchValidated(batchId, msg.sender);
    }

    function getBatch(uint256 batchId) external view onlyAuthorized returns (
        uint256 id,
        address manufacturer,
        string memory drugName,
        uint256 quantity,
        uint256 manufacturingDate,
        uint256 expiryDate,
        bool isValid
    ) {
        Batch storage batch = batches[batchId];
        require(batch.id != 0, "Batch does not exist");
        return (
            batch.id,
            batch.manufacturer,
            batch.drugName,
            batch.quantity,
            batch.manufacturingDate,
            batch.expiryDate,
            batch.isValid
        );
    }

    function grantManufacturerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MANUFACTURER_ROLE, account);
        emit RoleGranted(MANUFACTURER_ROLE, account, msg.sender);
    }

    function grantDistributorRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(DISTRIBUTOR_ROLE, account);
        emit RoleGranted(DISTRIBUTOR_ROLE, account, msg.sender);
    }

    function revokeManufacturerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(MANUFACTURER_ROLE, account);
    }

    function revokeDistributorRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(DISTRIBUTOR_ROLE, account);
    }
}