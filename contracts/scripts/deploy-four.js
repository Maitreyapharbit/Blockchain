const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying from ${deployer.address} on network ${hre.network.name}`);

  const Token = await hre.ethers.getContractFactory("Token");
  const token = await Token.deploy("ipfs://uri");
  await token.deployed();
  console.log("Token deployed to:", token.address);

  const Tracking = await hre.ethers.getContractFactory("Tracking");
  const tracking = await Tracking.deploy();
  await tracking.deployed();
  console.log("Tracking deployed to:", tracking.address);

  const Anti = await hre.ethers.getContractFactory("AntiCounterfeiting");
  const anti = await Anti.deploy();
  await anti.deployed();
  console.log("AntiCounterfeiting deployed to:", anti.address);

  const Price = await hre.ethers.getContractFactory("PriceCalibration");
  const price = await Price.deploy();
  await price.deployed();
  console.log("PriceCalibration deployed to:", price.address);

  const out = {
    Token: token.address,
    Tracking: tracking.address,
    AntiCounterfeiting: anti.address,
    PriceCalibration: price.address,
    network: hre.network.name,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync("./deployed-four.json", JSON.stringify(out, null, 2));
  console.log("Wrote deployed-four.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});