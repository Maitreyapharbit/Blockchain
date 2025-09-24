import { ethers } from "hardhat";

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    console.log("Deploying PharmaceuticalBatch contract...");
    const PharmaceuticalBatch = await ethers.getContractFactory("PharmaceuticalBatch");
    console.log("Contract factory created, deploying...");
    
    const pharmaceuticalBatch = await PharmaceuticalBatch.deploy();
    console.log("Waiting for deployment transaction...");
    
    await pharmaceuticalBatch.waitForDeployment();
    const contractAddress = await pharmaceuticalBatch.getAddress();
    
    console.log("PharmaceuticalBatch deployed to:", contractAddress);
    console.log("Default admin role granted to:", deployer.address);
  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }

  // You can add initial manufacturers and distributors here if needed
  // const MANUFACTURER_ROLE = await pharmaceuticalBatch.MANUFACTURER_ROLE();
  // await pharmaceuticalBatch.grantManufacturerRole("MANUFACTURER_ADDRESS");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });