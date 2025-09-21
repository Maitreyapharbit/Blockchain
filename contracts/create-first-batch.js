const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Creating your first pharmaceutical batch (block)...\n");

  // Get the first account (manufacturer)
  const [manufacturer, distributor, pharmacy] = await ethers.getSigners();
  
  console.log("👤 Manufacturer Account:", manufacturer.address);
  console.log("👤 Distributor Account:", distributor.address);
  console.log("👤 Pharmacy Account:", pharmacy.address);
  console.log("");

  // Deploy PharmaceuticalBatch contract
  console.log("📋 Deploying PharmaceuticalBatch contract...");
  const PharmaceuticalBatch = await ethers.getContractFactory("PharmaceuticalBatch");
  const batchContract = await PharmaceuticalBatch.deploy(manufacturer.address);
  await batchContract.waitForDeployment();
  
  const contractAddress = await batchContract.getAddress();
  console.log("✅ PharmaceuticalBatch deployed to:", contractAddress);
  console.log("");

  // Create your first pharmaceutical batch
  console.log("💊 Creating your first pharmaceutical batch...");
  
  const batchData = {
    drugName: "Aspirin 100mg",
    quantity: 1000
  };

  console.log("📦 Batch Details:");
  console.log("   Drug Name:", batchData.drugName);
  console.log("   Quantity:", batchData.quantity);
  console.log("   Manufacturer:", manufacturer.address);
  console.log("");

  // Create the batch on blockchain
  const tx = await batchContract.createBatch(
    batchData.drugName,
    batchData.quantity
  );

  console.log("⏳ Transaction submitted:", tx.hash);
  console.log("⏳ Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
  console.log("✅ Gas used:", receipt.gasUsed.toString());
  console.log("");

  // Get the created batch details
  console.log("🔍 Retrieving batch details from blockchain...");
  const batchId = 0; // First batch will have ID 0
  const batch = await batchContract.getBatch(batchId);
  
  console.log("📋 Batch Information from Blockchain:");
  console.log("   Batch ID:", batchId);
  console.log("   Drug Name:", batch[0]);
  console.log("   Quantity:", batch[1].toString());
  console.log("   Manufacturer:", batch[2]);
  console.log("   Created At:", new Date(Number(batch[3]) * 1000).toLocaleString());
  console.log("");

  // Check current block number
  const currentBlock = await ethers.provider.getBlockNumber();
  console.log("🔗 Current Block Number:", currentBlock);
  console.log("");

  console.log("🎉 SUCCESS! Your first pharmaceutical batch has been created!");
  console.log("🎉 This batch is now permanently recorded on the blockchain!");
  console.log("");
  console.log("📊 Summary:");
  console.log("   ✅ Contract deployed to:", contractAddress);
  console.log("   ✅ Batch created with ID:", batchId);
  console.log("   ✅ Transaction hash:", tx.hash);
  console.log("   ✅ Block number:", receipt.blockNumber);
  console.log("   ✅ Gas used:", receipt.gasUsed.toString());
  console.log("");
  console.log("🔗 You can view this batch on the blockchain using:");
  console.log("   Contract Address:", contractAddress);
  console.log("   Batch ID:", batchId);
  console.log("");
  console.log("🌐 Frontend URL: http://localhost:3001");
  console.log("🔧 Backend API: http://localhost:3000");
  console.log("⛓️  Blockchain: http://localhost:8545");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error creating batch:", error);
    process.exit(1);
  });
