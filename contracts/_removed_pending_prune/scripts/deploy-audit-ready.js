const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Audit-Ready Deployment Script
 * @description Deploys all ALCOA+ compliant contracts to 7-node IBFT 2.0
 * @author PharbitChain Security Team
 * @date 2026-01-26
 */

async function main() {
  console.log("This deploy script is deprecated. Use scripts/deploy-four.js to deploy the consolidated contracts: Token, Tracking, AntiCounterfeiting, PriceCalibration.");
  return;


  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts from: ${deployer.address}`);

  const network = hre.network.name;
  console.log(`Network: ${network}`);
  console.log(`Chain ID: ${(await hre.ethers.provider.getNetwork()).chainId}\n`);

  // Track deployed addresses
  const deployedContracts = {};

  try {
    // ==================== 1. Deploy PharmaToken (ERC-1155) ====================
    console.log("1️⃣  Deploying PharmaToken (ERC-1155)...");
    const PharmaToken = await hre.ethers.getContractFactory("PharmaToken");
    const tokenUri = "ipfs://QmPharmaTokenMetadata"; // TODO: Update with real IPFS hash
    const pharmaToken = await PharmaToken.deploy(tokenUri);
    await pharmaToken.waitForDeployment();

    const pharmaTokenAddr = await pharmaToken.getAddress();
    deployedContracts.PharmaToken = pharmaTokenAddr;
    console.log(`   ✓ PharmaToken deployed to: ${pharmaTokenAddr}\n`);

    // ==================== 2. Deploy AttributableActions ====================
    console.log("2️⃣  Deploying AttributableActions (ALCOA+ compliance)...");
    const AttributableActions = await hre.ethers.getContractFactory("AttributableActions");
    const attributableActions = await AttributableActions.deploy();
    await attributableActions.waitForDeployment();

    const attributableActionsAddr = await attributableActions.getAddress();
    deployedContracts.AttributableActions = attributableActionsAddr;
    console.log(`   ✓ AttributableActions deployed to: ${attributableActionsAddr}\n`);

    // ==================== 3. Deploy IoTComplianceTracker ====================
    console.log("3️⃣  Deploying IoTComplianceTracker (Hardware timestamps)...");
    const IoTComplianceTracker = await hre.ethers.getContractFactory("IoTComplianceTracker");
    const iotComplianceTracker = await IoTComplianceTracker.deploy();
    await iotComplianceTracker.waitForDeployment();

    const iotComplianceTrackerAddr = await iotComplianceTracker.getAddress();
    deployedContracts.IoTComplianceTracker = iotComplianceTrackerAddr;
    console.log(`   ✓ IoTComplianceTracker deployed to: ${iotComplianceTrackerAddr}\n`);

    // ==================== 4. Deploy PrivatePricingLedger ====================
    console.log("4️⃣  Deploying PrivatePricingLedger (Tessera-compatible)...");
    const PrivatePricingLedger = await hre.ethers.getContractFactory("PrivatePricingLedger");
    const privatePricingLedger = await PrivatePricingLedger.deploy();
    await privatePricingLedger.waitForDeployment();

    const privatePricingLedgerAddr = await privatePricingLedger.getAddress();
    deployedContracts.PrivatePricingLedger = privatePricingLedgerAddr;
    console.log(`   ✓ PrivatePricingLedger deployed to: ${privatePricingLedgerAddr}\n`);

    // ==================== 5. Configure Roles ====================
    console.log("5️⃣  Configuring role-based access control...");

    // Define roles
    const MANUFACTURER_ROLE = await pharmaToken.MANUFACTURER_ROLE();
    const PHARMACY_ROLE = await pharmaToken.PHARMACY_ROLE();
    const AUDITOR_ROLE = await pharmaToken.AUDITOR_ROLE();
    const DISTRIBUTOR_ROLE = await pharmaToken.DISTRIBUTOR_ROLE();

    // Grant roles to test accounts (replace with actual addresses)
    const manufacturerAddr = process.env.MANUFACTURER_ADDRESS || deployer.address;
    const pharmacyAddr = process.env.PHARMACY_ADDRESS || deployer.address;
    const auditorAddr = process.env.AUDITOR_ADDRESS || deployer.address;

    console.log(`   - Granting MANUFACTURER_ROLE to ${manufacturerAddr}`);
    await pharmaToken.grantRole(MANUFACTURER_ROLE, manufacturerAddr);

    console.log(`   - Granting PHARMACY_ROLE to ${pharmacyAddr}`);
    await pharmaToken.grantRole(PHARMACY_ROLE, pharmacyAddr);

    console.log(`   - Granting AUDITOR_ROLE to ${auditorAddr}`);
    await pharmaToken.grantRole(AUDITOR_ROLE, auditorAddr);

    console.log(`   ✓ Roles configured\n`);

    // ==================== 6. Register Test Employees ====================
    console.log("6️⃣  Registering test employees (ALCOA+ compliance)...");

    const testEmployee = {
      address: deployer.address,
      employeeId: "LAB-TECH-00001",
      department: "Manufacturing QC",
      company: "Pfizer Inc"
    };

    await attributableActions.registerActor(
      testEmployee.address,
      testEmployee.employeeId,
      testEmployee.department,
      testEmployee.company
    );

    console.log(`   ✓ Employee registered: ${testEmployee.employeeId} (${testEmployee.address})\n`);

    // ==================== 7. Authorize IoT Devices ====================
    console.log("7️⃣  Authorizing IoT sensors...");

    const iotDevices = [
      process.env.IOT_DEVICE_1 || "0x0000000000000000000000000000000000000001",
      process.env.IOT_DEVICE_2 || "0x0000000000000000000000000000000000000002",
      process.env.IOT_DEVICE_3 || "0x0000000000000000000000000000000000000003",
    ];

    for (const device of iotDevices) {
      await iotComplianceTracker.authorizeIoTDevice(device);
      console.log(`   ✓ IoT device authorized: ${device}`);
    }
    console.log();

    // ==================== 8. Set Compliance Thresholds ====================
    console.log("8️⃣  Setting pharmaceutical compliance thresholds...");

    // Temperature: 2°C to 8°C for refrigerated goods
    await iotComplianceTracker.setComplianceThreshold(
      "TEMPERATURE",
      20,
      80,
      "Safe pharmaceutical storage: 20-80°C"
    );
    console.log("   ✓ Temperature threshold: 20-80°C");

    // Humidity: 30% to 70%
    await iotComplianceTracker.setComplianceThreshold(
      "HUMIDITY",
      30,
      70,
      "Safe humidity range: 30-70%"
    );
    console.log("   ✓ Humidity threshold: 30-70%");

    // Vibration: < 0.5g
    await iotComplianceTracker.setComplianceThreshold(
      "VIBRATION",
      0,
      50,
      "Maximum vibration: 0.5g"
    );
    console.log("   ✓ Vibration threshold: 0-0.5g\n");

    // ==================== 9. Save Deployment Summary ====================
    console.log("9️⃣  Saving deployment summary...");

    const deploymentSummary = {
      timestamp: new Date().toISOString(),
      network: network,
      chainId: (await hre.ethers.provider.getNetwork()).chainId,
      deployer: deployer.address,
      contracts: deployedContracts,
      roles: {
        MANUFACTURER_ROLE: MANUFACTURER_ROLE,
        PHARMACY_ROLE: PHARMACY_ROLE,
        AUDITOR_ROLE: AUDITOR_ROLE,
        DISTRIBUTOR_ROLE: DISTRIBUTOR_ROLE,
      },
      configuration: {
        complianceThresholds: {
          temperature: { min: 20, max: 80, unit: "CELSIUS" },
          humidity: { min: 30, max: 70, unit: "PERCENTAGE" },
          vibration: { min: 0, max: 50, unit: "G" },
        },
        authorizedIoTDevices: iotDevices,
      },
    };

    const deploymentsDir = path.join(__dirname, "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const fileName = path.join(
      deploymentsDir,
      `deployment-${network}-${Date.now()}.json`
    );
    fs.writeFileSync(fileName, JSON.stringify(deploymentSummary, null, 2));

    console.log(`   ✓ Deployment summary saved to: ${fileName}\n`);

    // ==================== 10. Verify Deployment ====================
    console.log("🔟 Verifying deployment...");

    // Check PharmaToken
    const tokenBalance = await pharmaToken.balanceOf(deployer.address, 0);
    console.log(`   ✓ PharmaToken deployed and verified`);

    // Check AttributableActions
    const actor = await attributableActions.getActor(deployer.address);
    console.log(`   ✓ AttributableActions deployed and verified`);

    // Check IoTComplianceTracker
    const tempThreshold = await iotComplianceTracker.getThreshold("TEMPERATURE");
    console.log(`   ✓ IoTComplianceTracker deployed and verified`);

    // Check PrivatePricingLedger
    const batchCount = await privatePricingLedger.getPriceCheckpointCount(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
    console.log(`   ✓ PrivatePricingLedger deployed and verified\n`);

    // ==================== Final Summary ====================
    console.log("✅ All contracts deployed successfully!");
    console.log("\n=== DEPLOYMENT SUMMARY ===\n");
    console.log(`Network: ${network}`);
    console.log(`Chain ID: ${(await hre.ethers.provider.getNetwork()).chainId}`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`\nContracts:`);
    console.log(`  - PharmaToken: ${pharmaTokenAddr}`);
    console.log(`  - AttributableActions: ${attributableActionsAddr}`);
    console.log(`  - IoTComplianceTracker: ${iotComplianceTrackerAddr}`);
    console.log(`  - PrivatePricingLedger: ${privatePricingLedgerAddr}`);
    console.log(`\nDeployment details saved to: ${fileName}\n`);

    return deploymentSummary;

  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exitCode = 1;
  }
}

main();
