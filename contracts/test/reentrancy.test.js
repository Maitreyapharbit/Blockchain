const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Reentrancy protections", function () {
  it("should prevent reentrancy during mint (malicious minter)", async function () {
    const [deployer] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy("https://example.com/");
    await token.deployed();

    const MaliciousMinter = await ethers.getContractFactory("MaliciousMinter");
    const malicious = await MaliciousMinter.deploy(token.address);
    await malicious.deployed();

    // grant manufacturer role to malicious contract
    const MANUFACTURER_ROLE = await token.MANUFACTURER_ROLE();
    await token.grantRole(MANUFACTURER_ROLE, malicious.address);

    // Attempt to mint via malicious contract which will try to reenter in onERC1155Received
    await expect(
      malicious.mintAndReenter(ethers.utils.formatBytes32String("DRUG"), 1, 1, 2, ethers.utils.formatBytes32String("BATCH"), ethers.utils.formatBytes32String("EMP"), Math.floor(Date.now() / 1000))
    ).to.be.reverted;

    // Ensure no batch was created
    const batchId = 1;
    const batch = await token.batches(batchId);
    expect(batch.totalQuantity).to.equal(0);
  });
});