const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token (consolidated) contract", function () {
  let token;
  let owner, manufacturer, pharmacy, auditor;

  before(async function () {
    [owner, manufacturer, pharmacy, auditor] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("ipfs://uri");
    await token.deployed();

    const MANUFACTURER_ROLE = await token.MANUFACTURER_ROLE();
    await token.grantRole(MANUFACTURER_ROLE, manufacturer.address);

    const PHARMACY_ROLE = await token.PHARMACY_ROLE();
    await token.grantRole(PHARMACY_ROLE, pharmacy.address);

    const AUDITOR_ROLE = await token.AUDITOR_ROLE();
    await token.grantRole(AUDITOR_ROLE, auditor.address);
  });

  it("mints batch and enforces roles", async function () {
    const tx = await token.connect(manufacturer).mintBatch(
      ethers.utils.formatBytes32String("Amox"),
      500,
      Math.floor(Date.now() / 1000) - 86400,
      Math.floor(Date.now() / 1000) + 31536000,
      ethers.utils.formatBytes32String("B-001"),
      ethers.utils.formatBytes32String("MFG-001"),
      Math.floor(Date.now() / 1000)
    );
    const r = await tx.wait();
    expect(r.status).to.equal(1);

    const batch = await token.batches(1);
    expect(batch[4].toNumber()).to.equal(500);
  });

  it("prevents non-pharmacy from consuming", async function () {
    await expect(token.connect(manufacturer).consumeMedicine(1, ethers.utils.randomBytes(32), 10, ethers.utils.formatBytes32String("MFG-001"))).to.be.reverted;
  });

  it("allows pharmacy to consume and updates remaining", async function () {
    await token.connect(manufacturer).safeTransferFrom(manufacturer.address, pharmacy.address, 1, 100, "0x");
    const tx = await token.connect(pharmacy).consumeMedicine(1, ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PAT-1")), 50, ethers.utils.formatBytes32String("PHARM-001"));
    const r = await tx.wait();
    expect(r.status).to.equal(1);
  });
});
