const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Deploy Token contract
  const Token = await hre.ethers.getContractFactory("Token");
  const token = await Token.deploy("ipfs://uri");
  await token.deployed();
  console.log("Token deployed to:", token.address);

  // Deploy Tracking contract
  const Tracking = await hre.ethers.getContractFactory("Tracking");
  const tracking = await Tracking.deploy();
  await tracking.deployed();
  console.log("Tracking deployed to:", tracking.address);

  // Deploy AntiCounterfeiting contract
  const AntiCounterfeiting = await hre.ethers.getContractFactory("AntiCounterfeiting");
  const antiCounterfeiting = await AntiCounterfeiting.deploy();
  await antiCounterfeiting.deployed();
  console.log("AntiCounterfeiting deployed to:", antiCounterfeiting.address);

  // Deploy PriceCalibration contract
  const PriceCalibration = await hre.ethers.getContractFactory("PriceCalibration");
  const priceCalibration = await PriceCalibration.deploy();
  await priceCalibration.deployed();
  console.log("PriceCalibration deployed to:", priceCalibration.address);

  // Save contract addresses to a file
  const fs = require("fs");
  const contractAddresses = {
    Token: token.address,
    Tracking: tracking.address,
    AntiCounterfeiting: antiCounterfeiting.address,
    PriceCalibration: priceCalibration.address,
    network: hre.network.name,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    "./deployed-contracts.json",
    JSON.stringify(contractAddresses, null, 2)
  );

  console.log("Contract addresses saved to deployed-contracts.json");

  // Verify contracts on Etherscan (if not on localhost)
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await recallManagement.deployTransaction.wait(6);
    await antiCounterfeitVerification.deployTransaction.wait(6);

    console.log("Verifying contracts on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: recallManagement.address,
        constructorArguments: [],
      });
      console.log("RecallManagement verified on Etherscan");
    } catch (error) {
      console.log("Error verifying RecallManagement:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: antiCounterfeitVerification.address,
        constructorArguments: [],
      });
      console.log("AntiCounterfeitVerification verified on Etherscan");
    } catch (error) {
      console.log("Error verifying AntiCounterfeitVerification:", error.message);
    }
  }

  console.log("Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });