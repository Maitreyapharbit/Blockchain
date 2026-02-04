const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PriceCalibration", function () {
  let price;
  let owner;

  before(async function () {
    [owner] = await ethers.getSigners();
    const Price = await ethers.getContractFactory("PriceCalibration");
    price = await Price.deploy();
    await price.deployed();
  });

  it("adds price checkpoint and updates cumulative hash", async function () {
    const batchId = ethers.utils.formatBytes32String("B-001");
    await price.addPriceCheckpoint(batchId, 1000, ethers.utils.formatBytes32String("notes1"));
    const count = await price.checkpointCount(batchId);
    expect(count).to.equal(1);
    const cum = await price.cumulativeCheckpointHash(batchId);
    expect(cum).to.not.equal(ethers.constants.HashZero);

    // add another checkpoint and verify cumulative hash changes and count increments
    const prevCum = cum;
    await price.addPriceCheckpoint(batchId, 2000, ethers.utils.formatBytes32String("notes2"));
    const count2 = await price.checkpointCount(batchId);
    expect(count2).to.equal(2);
    const newCum = await price.cumulativeCheckpointHash(batchId);
    expect(newCum).to.not.equal(prevCum);
  });

  it("private price hashes and access control", async function () {
    const batchId = ethers.utils.formatBytes32String("B-002");
    const priceHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("price-secret"));

    await price.addPrivatePriceHash(batchId, priceHash);
    const arr = await price.privatePriceHashes(batchId, 0);
    expect(arr).to.equal(priceHash);

    const viewer = (await ethers.getSigners())[2];
    expect(await price.canViewPrivatePrice(batchId, viewer.address)).to.equal(false);

    await price.grantPrivateAccess(batchId, viewer.address);
    expect(await price.canViewPrivatePrice(batchId, viewer.address)).to.equal(true);

    await price.revokePrivateAccess(batchId, viewer.address);
    expect(await price.canViewPrivatePrice(batchId, viewer.address)).to.equal(false);
  });
});