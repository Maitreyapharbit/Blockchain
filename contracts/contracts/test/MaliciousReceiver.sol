// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

interface IToken {
    function acknowledgeDrugTransfer(bytes32 transferId, bytes32 employeeId, bytes calldata receiverSignature) external;
}

contract MaliciousReceiver is IERC1155Receiver {
    IToken public token;
    bytes32 public lastTransferId;
    bytes32 public lastEmployeeId;
    bytes public lastSignature;
    bool public doReenter = true;

    constructor(address tokenAddress) {
        token = IToken(tokenAddress);
    }

    function setReenter(bool v) external {
        doReenter = v;
    }

    function callAcknowledge(bytes32 transferId, bytes32 employeeId, bytes calldata receiverSignature) external {
        token.acknowledgeDrugTransfer(transferId, employeeId, receiverSignature);
    }

    function onERC1155Received(address, address, uint256, uint256, bytes calldata data) external returns (bytes4) {
        // Attempt reentrancy during token transfer
        if (doReenter) {
            // This will try to reenter acknowledgeDrugTransfer and should be prevented by nonReentrant
            // We ignore any revert here so transaction reverts if reentry reverts
            token.acknowledgeDrugTransfer(lastTransferId, lastEmployeeId, lastSignature);
        }
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function supportsInterface(bytes4) external pure returns (bool) {
        return true;
    }

    // Helpers for test to store signature and ids
    function setCallParams(bytes32 transferId, bytes32 employeeId, bytes calldata receiverSignature) external {
        lastTransferId = transferId;
        lastEmployeeId = employeeId;
        lastSignature = receiverSignature;
    }
}
