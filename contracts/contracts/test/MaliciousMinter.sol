// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

interface ITokenMint {
    function mintBatch(bytes32 drugName,uint256 quantity,uint256 manufacturingDate,uint256 expiryDate,bytes32 batchNumber,bytes32 employeeId,uint256 hardwareTimestamp) external returns (uint256);
}

contract MaliciousMinter is IERC1155Receiver {
    ITokenMint public token;
    bool public doReenter = true;

    constructor(address tokenAddress) {
        token = ITokenMint(tokenAddress);
    }

    function setReenter(bool v) external {
        doReenter = v;
    }

    function mintAndReenter(bytes32 drugName,uint256 quantity,uint256 manufacturingDate,uint256 expiryDate,bytes32 batchNumber,bytes32 employeeId,uint256 hardwareTimestamp) external returns (uint256) {
        return token.mintBatch(drugName, quantity, manufacturingDate, expiryDate, batchNumber, employeeId, hardwareTimestamp);
    }

    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external returns (bytes4) {
        if (doReenter) {
            // Try to reenter mintBatch - should fail due to nonReentrant
            token.mintBatch(0x0, 1, 1, 2, 0x0, 0x0, block.timestamp);
        }
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function supportsInterface(bytes4) external pure returns (bool) {
        return true;
    }
}
