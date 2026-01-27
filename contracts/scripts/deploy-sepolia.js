/**
 * Deploy to Sepolia Testnet
 * This script deploys the audit-ready contracts to Ethereum Sepolia
 * 
 * Requirements:
 * 1. .env file with:
 *    - SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_API_KEY
 *    - SEPOLIA_PRIVATE_KEY=0x...
 *    - ETHERSCAN_API_KEY=... (optional, for verification)
 */

const hre = require("hardhat");
const { ethers } = require("ethers");
const fs = require("fs");
require("dotenv").config();

const CONTRACTS_TO_DEPLOY = [
  "SignatureSuite",
  "IdentityVerification",
  "EmergencyRecovery",
  "PharmaToken",
];

async function main() {
  console.log("🚀 Deploying to Sepolia Testnet");
  console.log("═══════════════════════════════════════════════════════════");

  // Verify environment
  if (!process.env.SEPOLIA_PRIVATE_KEY) {
    console.error("❌ SEPOLIA_PRIVATE_KEY not set in .env");
    process.exit(1);
  }

  const network = await hre.ethers.provider.getNetwork();
  console.log(`\n📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  if (network.chainId !== 11155111) {
    console.error("❌ Not connected to Sepolia. Check SEPOLIA_RPC_URL in .env");
    process.exit(1);
  }

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log(`\n👤 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.error("❌ Deployer has zero balance. Get Sepolia ETH from faucet:");
    console.error("   https://www.alchemy.com/faucets/ethereum-sepolia");
    process.exit(1);
  }

  const deploymentLog = {
    network: network.name,
    chainId: network.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {},
  };

  // ============================================================================
  // Deploy Supporting Contracts
  // ============================================================================

  // 1. Deploy SignatureSuite (needed by PharmaToken)
  console.log("\n1️⃣  Deploying SignatureSuite...");
  const SignatureSuite = await hre.ethers.getContractFactory("SignatureSuite");
  const signatureSuite = await SignatureSuite.deploy();
  await signatureSuite.waitForDeployment();
  const signatureSuiteAddr = await signatureSuite.getAddress();
  console.log(`   ✓ SignatureSuite: ${signatureSuiteAddr}`);
  deploymentLog.contracts.SignatureSuite = signatureSuiteAddr;

  // 2. Deploy IdentityVerification (needed before assigning roles)
  console.log("\n2️⃣  Deploying IdentityVerification...");
  const IdentityVerification = await hre.ethers.getContractFactory("IdentityVerification");
  const identityVerification = await IdentityVerification.deploy();
  await identityVerification.waitForDeployment();
  const identityVerificationAddr = await identityVerification.getAddress();
  console.log(`   ✓ IdentityVerification: ${identityVerificationAddr}`);
  deploymentLog.contracts.IdentityVerification = identityVerificationAddr;

  // 3. Deploy EmergencyRecovery (for key recovery)
  console.log("\n3️⃣  Deploying EmergencyRecovery...");
  const EmergencyRecovery = await hre.ethers.getContractFactory("EmergencyRecovery");
  const emergencyRecovery = await EmergencyRecovery.deploy();
  await emergencyRecovery.waitForDeployment();
  const emergencyRecoveryAddr = await emergencyRecovery.getAddress();
  console.log(`   ✓ EmergencyRecovery: ${emergencyRecoveryAddr}`);
  deploymentLog.contracts.EmergencyRecovery = emergencyRecoveryAddr;

  // 4. Deploy PharmaToken (main contract)
  console.log("\n4️⃣  Deploying PharmaToken...");
  const PharmaToken = await hre.ethers.getContractFactory("PharmaToken");
  const pharmaToken = await PharmaToken.deploy(
    "ipfs://", // baseURI for token metadata
    emergencyRecoveryAddr
  );
  await pharmaToken.waitForDeployment();
  const pharmaTokenAddr = await pharmaToken.getAddress();
  console.log(`   ✓ PharmaToken: ${pharmaTokenAddr}`);
  deploymentLog.contracts.PharmaToken = pharmaTokenAddr;

  // 5. Deploy AttributableActions
  console.log("\n5️⃣  Deploying AttributableActions...");
  const AttributableActions = await hre.ethers.getContractFactory("AttributableActions");
  const attributableActions = await AttributableActions.deploy();
  await attributableActions.waitForDeployment();
  const attributableActionsAddr = await attributableActions.getAddress();
  console.log(`   ✓ AttributableActions: ${attributableActionsAddr}`);
  deploymentLog.contracts.AttributableActions = attributableActionsAddr;

  // 6. Deploy IoTComplianceTracker
  console.log("\n6️⃣  Deploying IoTComplianceTracker...");
  const IoTComplianceTracker = await hre.ethers.getContractFactory("IoTComplianceTracker");
  const iotComplianceTracker = await IoTComplianceTracker.deploy();
  await iotComplianceTracker.waitForDeployment();
  const iotComplianceTrackerAddr = await iotComplianceTracker.getAddress();
  console.log(`   ✓ IoTComplianceTracker: ${iotComplianceTrackerAddr}`);
  deploymentLog.contracts.IoTComplianceTracker = iotComplianceTrackerAddr;

  // 7. Deploy PrivatePricingLedger
  console.log("\n7️⃣  Deploying PrivatePricingLedger...");
  const PrivatePricingLedger = await hre.ethers.getContractFactory("PrivatePricingLedger");
  const privatePricingLedger = await PrivatePricingLedger.deploy();
  await privatePricingLedger.waitForDeployment();
  const privatePricingLedgerAddr = await privatePricingLedger.getAddress();
  console.log(`   ✓ PrivatePricingLedger: ${privatePricingLedgerAddr}`);
  deploymentLog.contracts.PrivatePricingLedger = privatePricingLedgerAddr;

  // ============================================================================
  // Setup Roles & Permissions
  // ============================================================================

  console.log("\n⚙️  Setting up roles and permissions...");

  // Register verifier on IdentityVerification
  console.log("   Registering verifier...");
  let tx = await identityVerification.registerVerifier(deployer.address);
  await tx.wait();

  // Register compliance officer
  console.log("   Registering compliance officer...");
  tx = await identityVerification.registerComplianceOfficer(deployer.address);
  await tx.wait();

  // Setup emergency council on EmergencyRecovery
  console.log("   Setting up emergency recovery council...");
  // In production, would add 5+ geographically distributed council members
  // For testnet, using deployer
  tx = await emergencyRecovery.addCouncilMember(deployer.address);
  await tx.wait();

  // ============================================================================
  // Post-Deployment Configuration
  // ============================================================================

  console.log("\n🔧 Post-deployment configuration...");

  // Register deployer as an employee (for signatures)
  console.log("   Registering deployer employee...");
  tx = await attributableActions.registerActor(
    deployer.address,
    "DEPLOY-ADMIN-00001",
    "Deployment Administrator"
  );
  await tx.wait();

  // Set IoT compliance thresholds
  console.log("   Setting IoT compliance thresholds...");
  tx = await iotComplianceTracker.setComplianceThreshold(
    "TEMPERATURE",
    -5 * 100,  // -5°C (stored as cents)
    45 * 100   // 45°C
  );
  await tx.wait();

  // ============================================================================
  // Verification
  // ============================================================================

  console.log("\n✅ Verifying deployments...");

  const verifications = {
    SignatureSuite: await hre.ethers.provider.getCode(signatureSuiteAddr),
    IdentityVerification: await hre.ethers.provider.getCode(identityVerificationAddr),
    EmergencyRecovery: await hre.ethers.provider.getCode(emergencyRecoveryAddr),
    PharmaToken: await hre.ethers.provider.getCode(pharmaTokenAddr),
    AttributableActions: await hre.ethers.provider.getCode(attributableActionsAddr),
    IoTComplianceTracker: await hre.ethers.provider.getCode(iotComplianceTrackerAddr),
    PrivatePricingLedger: await hre.ethers.provider.getCode(privatePricingLedgerAddr),
  };

  for (const [name, code] of Object.entries(verifications)) {
    if (code === "0x") {
      console.error(`   ❌ ${name} not deployed`);
      process.exit(1);
    }
    console.log(`   ✓ ${name}`);
  }

  // ============================================================================
  // Save Deployment Info
  // ============================================================================

  const deploymentFile = `sepolia-deployment-${Date.now()}.json`;
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentLog, null, 2));

  console.log(`\n📄 Deployment info saved to: ${deploymentFile}`);

  // ============================================================================
  // Next Steps
  // ============================================================================

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("═══════════════════════════════════════════════════════════");

  console.log("\n📋 Contract Addresses:");
  console.log(`   SignatureSuite:        ${signatureSuiteAddr}`);
  console.log(`   IdentityVerification:  ${identityVerificationAddr}`);
  console.log(`   EmergencyRecovery:     ${emergencyRecoveryAddr}`);
  console.log(`   PharmaToken:           ${pharmaTokenAddr}`);
  console.log(`   AttributableActions:   ${attributableActionsAddr}`);
  console.log(`   IoTComplianceTracker:  ${iotComplianceTrackerAddr}`);
  console.log(`   PrivatePricingLedger:  ${privatePricingLedgerAddr}`);

  console.log("\n🔗 Explore on Sepolia Etherscan:");
  console.log(`   https://sepolia.etherscan.io/address/${pharmaTokenAddr}`);

  console.log("\n📝 Next Steps:");
  console.log("   1. Verify contracts on Etherscan (optional):");
  console.log("      npx hardhat verify --network sepolia <ADDRESS> <CONSTRUCTOR_ARGS>");
  console.log("   2. Register entities with IdentityVerification");
  console.log("   3. Run tests against Sepolia deployment");
  console.log("   4. Submit to FDA pre-submission meeting");

  console.log("\n💡 To integrate with your frontend:");
  console.log("   import addresses from './sepolia-deployment-<TIMESTAMP>.json'");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
