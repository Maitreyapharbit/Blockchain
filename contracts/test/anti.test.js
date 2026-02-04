const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AntiCounterfeiting contract", function () {
  let anti;
  let owner, manufacturer, verifier;

  before(async function () {
    [owner, manufacturer, verifier] = await ethers.getSigners();
    const Anti = await ethers.getContractFactory("AntiCounterfeiting");
    anti = await Anti.deploy();
    await anti.deployed();

    const MANUFACTURER_ROLE = await anti.MANUFACTURER_ROLE();
    const VERIFIER_ROLE = await anti.VERIFIER_ROLE();
    await anti.grantRole(MANUFACTURER_ROLE, manufacturer.address);
    await anti.grantRole(VERIFIER_ROLE, verifier.address);
  });

  it("adds and verifies security features", async function () {
    const batchId = 1;
    const featureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("QR-ABC-123"));
    await anti.connect(manufacturer).addSecurityFeature(batchId, 0, featureHash);
    const ok = await anti.verifySecurityFeature(batchId, 0, featureHash);
    expect(ok).to.equal(true);
  });

  it("reports suspicious activity and flags batch", async function () {
    const batchId = 2;
    const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("evidence-1"));
    await anti.connect(manufacturer).addSecurityFeature(batchId, 0, evidenceHash);
    await anti.connect(manufacturer).reportSuspiciousActivity(batchId, evidenceHash);
    const flagged = await anti.isBatchFlagged(batchId);
    expect(flagged).to.equal(true);
  });
});