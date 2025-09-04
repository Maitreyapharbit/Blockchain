const hre = require("hardhat");
const { writeFileSync, mkdirSync } = require("fs");
const { dirname } = require("path");

// Utility function to ensure directory exists
function ensureDir(p) {
  try {
    mkdirSync(p, { recursive: true });
  } catch (e) {
    // Directory already exists or other error, ignore
  }
}

async function main() {
  console.log("🚀 Starting PharmaTracker Contract Deployment");
  console.log("=============================================");

  try {
    // Get the deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("📋 Deploying contracts with account:", deployer.address);

    // Check account balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.utils.formatEther(balance), "ETH");

    if (balance.eq(0)) {
      console.log("⚠️  Warning: Account has no ETH. Make sure Hardhat node is running with funded accounts.");
    }

    // Deploy PharmaTracker contract
    console.log("\n📦 Deploying PharmaTracker contract...");
    const PharmaTracker = await hre.ethers.getContractFactory("PharmaTracker");
    const pharmaTracker = await PharmaTracker.deploy();
    await pharmaTracker.deployed();

    const contractAddress = pharmaTracker.address;
    console.log(`✅ PharmaTracker deployed to: ${contractAddress}`);

    // Prepare deployment data
    const deploymentData = {
      network: hre.network.name,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        PharmaTracker: contractAddress,
      },
      abi: PharmaTracker.interface.format("json"),
    };

    // Save addresses to deployments directory
    const deploymentsDir = `${process.cwd()}/deployments`;
    ensureDir(deploymentsDir);

    const addressesPath = `${deploymentsDir}/addresses.${hre.network.name}.json`;
    writeFileSync(addressesPath, JSON.stringify(deploymentData, null, 2));
    console.log(`💾 Saved addresses to ${addressesPath}`);

    // Also save as local.json for compatibility
    const localPath = `${deploymentsDir}/addresses.local.json`;
    writeFileSync(localPath, JSON.stringify(deploymentData, null, 2));
    console.log(`💾 Saved addresses to ${localPath}`);

    // Copy ABI to frontend and backend directories
    console.log("\n📋 Copying ABI to frontend and backend...");
    const abiSrc = `${process.cwd()}/artifacts/contracts/PharmaTracker.sol/PharmaTracker.json`;
    const abiDest = `${process.cwd()}/frontend/src/contracts/PharmaTracker.json`;
    const backendAbiDest = `${process.cwd()}/backend/contracts/PharmaTracker.json`;

    try {
      // Frontend ABI
      ensureDir(dirname(abiDest));
      const abiContent = require(abiSrc);
      writeFileSync(abiDest, JSON.stringify(abiContent, null, 2));
      console.log(`✅ Copied ABI to frontend: ${abiDest}`);

      // Backend ABI
      ensureDir(dirname(backendAbiDest));
      writeFileSync(backendAbiDest, JSON.stringify(abiContent, null, 2));
      console.log(`✅ Copied ABI to backend: ${backendAbiDest}`);
    } catch (e) {
      console.warn(`⚠️  ABI copy failed: ${e.message}`);
    }

    // Display deployment summary
    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📊 Deployment Summary:");
    console.log("=" * 50);
    console.log(`Network: ${deploymentData.network}`);
    console.log(`Deployer: ${deploymentData.deployer}`);
    console.log(`Timestamp: ${deploymentData.timestamp}`);
    console.log("\nContract Addresses:");
    console.log(`  PharmaTracker: ${contractAddress}`);
    console.log("=" * 50);

    // Test basic functionality
    console.log("\n🧪 Testing basic contract functionality...");
    try {
      // Test owner
      const owner = await pharmaTracker.owner();
      console.log(`✅ Contract owner: ${owner}`);

      // Test authorized manufacturer
      const isAuthorized = await pharmaTracker.isAuthorizedManufacturer(deployer.address);
      console.log(`✅ Deployer is authorized manufacturer: ${isAuthorized}`);

      // Test total drugs (should be 0)
      const totalDrugs = await pharmaTracker.getTotalDrugs();
      console.log(`✅ Total drugs registered: ${totalDrugs}`);

      console.log("✅ Basic functionality test passed!");
    } catch (e) {
      console.warn(`⚠️  Basic functionality test failed: ${e.message}`);
    }

    return deploymentData;
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Execute deployment
main()
  .then(() => {
    console.log("\n✅ Deployment script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment script failed:", error);
    process.exit(1);
  });