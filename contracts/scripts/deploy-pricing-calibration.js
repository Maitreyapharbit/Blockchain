const hre = require("hardhat");

async function main() {
  console.log("Deploying Pricing and Calibration contracts...");

  // Deploy DrugPricingLedger
  const DrugPricingLedger = await hre.ethers.getContractFactory("DrugPricingLedger");
  const pricingLedger = await DrugPricingLedger.deploy();
  await pricingLedger.deployed();
  console.log("DrugPricingLedger deployed to:", pricingLedger.address);

  // Deploy EquipmentCalibrationLedger
  const EquipmentCalibrationLedger = await hre.ethers.getContractFactory("EquipmentCalibrationLedger");
  const calibrationLedger = await EquipmentCalibrationLedger.deploy();
  await calibrationLedger.deployed();
  console.log("EquipmentCalibrationLedger deployed to:", calibrationLedger.address);

  // Save addresses for reference
  const fs = require('fs');
  const deploymentInfo = {
    network: hre.network.name,
    DrugPricingLedger: pricingLedger.address,
    EquipmentCalibrationLedger: calibrationLedger.address,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    './deployments/pricing-calibration.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to deployments/pricing-calibration.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
