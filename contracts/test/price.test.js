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
  });
});