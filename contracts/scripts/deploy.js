const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Deploy RecallManagement contract
  const RecallManagement = await hre.ethers.getContractFactory("RecallManagement");
  const recallManagement = await RecallManagement.deploy();
  await recallManagement.waitForDeployment();
  console.log("RecallManagement deployed to:", await recallManagement.getAddress());

  // Deploy AntiCounterfeitVerification contract
  const AntiCounterfeitVerification = await hre.ethers.getContractFactory("AntiCounterfeitVerification");
  const antiCounterfeitVerification = await AntiCounterfeitVerification.deploy();
  await antiCounterfeitVerification.waitForDeployment();
  console.log("AntiCounterfeitVerification deployed to:", await antiCounterfeitVerification.getAddress());

  // Save contract addresses to a file
  const fs = require("fs");
  const contractAddresses = {
    RecallManagement: await recallManagement.getAddress(),
    AntiCounterfeitVerification: await antiCounterfeitVerification.getAddress(),
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
        address: await recallManagement.getAddress(),
        constructorArguments: [],
      });
      console.log("RecallManagement verified on Etherscan");
    } catch (error) {
      console.log("Error verifying RecallManagement:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: await antiCounterfeitVerification.getAddress(),
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