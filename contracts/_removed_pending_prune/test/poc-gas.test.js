const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PoC gas comparison", function () {
  let pharmaToken, tokenPoC;
  let owner, manufacturer;

  before(async function () {
    [owner, manufacturer] = await ethers.getSigners();

    const PharmaToken = await ethers.getContractFactory("PharmaToken");
    pharmaToken = await PharmaToken.deploy("ipfs://uri");
    await pharmaToken.deployed();

    const TokenPoC = await ethers.getContractFactory("TokenPoC");
    tokenPoC = await TokenPoC.deploy("ipfs://uri");
    await tokenPoC.deployed();

    const TrackingPoC = await ethers.getContractFactory("TrackingPoC");
    trackingPoC = await TrackingPoC.deploy();
    await trackingPoC.deployed();

    const MANUFACTURER_ROLE = await tokenPoC.MANUFACTURER_ROLE();
    await tokenPoC.grantRole(MANUFACTURER_ROLE, manufacturer.address);

    const AUDITOR_ROLE = await trackingPoC.AUDITOR_ROLE();
    // Grant manufacturer auditor rights in PoC to register identities
    await trackingPoC.grantRole(AUDITOR_ROLE, manufacturer.address);

    const PT_MANUFACTURER = await pharmaToken.MANUFACTURER_ROLE();
    await pharmaToken.grantRole(PT_MANUFACTURER, manufacturer.address);
  });

  it("mint gas comparison", async function () {
    const hardwareTimestamp = Math.floor(Date.now() / 1000);
    const employeeId = ethers.utils.formatBytes32String("MFG-001");

    // TokenPoC mint
    const tx1 = await tokenPoC.connect(manufacturer).mintBatch(
      ethers.utils.formatBytes32String("Amoxicillin"),
      1000,
      Math.floor(Date.now() / 1000) - 86400,
      Math.floor(Date.now() / 1000) + 31536000,
      ethers.utils.formatBytes32String("BATCH-2024-001"),
      employeeId,
      hardwareTimestamp
    );
    const r1 = await tx1.wait();
    console.log("TokenPoC mint gasUsed:", r1.gasUsed.toString());

    // confirm balance
    const bal = await tokenPoC.balanceOf(manufacturer.address, 1);
    console.log("TokenPoC manufacturer balance for batch 1:", bal.toString());

    // PharmaToken mint
    const tx2 = await pharmaToken.connect(manufacturer).mintBatch(
      "Amoxicillin",
      1000,
      Math.floor(Date.now() / 1000) - 86400,
      Math.floor(Date.now() / 1000) + 31536000,
      "BATCH-2024-001",
      "MFG-001",
      hardwareTimestamp
    );
    const r2 = await tx2.wait();
    console.log("PharmaToken mint gasUsed:", r2.gasUsed.toString());

    expect(r1.status).to.equal(1);
    expect(r2.status).to.equal(1);
  });

  it("propose/acknowledge transfer gas (PoC)", async function () {
    // Message to sign must match TokenPoC.recover logic
    const messageHash = ethers.utils.solidityKeccak256(
      ["uint256", "address", "uint256", "uint256", "address"],
      [1, owner.address, 100, Math.floor(Date.now() / 1000), manufacturer.address]
    );

    const signature = await manufacturer.signMessage(ethers.utils.arrayify(messageHash));

    const tx = await tokenPoC.connect(manufacturer).proposeDrugTransfer(
      1,
      owner.address,
      100,
      Math.floor(Date.now() / 1000),
      ethers.utils.formatBytes32String("MFG-001"),
      signature
    );
    const r = await tx.wait();
    console.log("TokenPoC propose gasUsed:", r.gasUsed.toString());
    expect(r.status).to.equal(1);
  });

  it("register signer and create signature (TrackingPoC)", async function () {
    const expiry = Math.floor(Date.now() / 1000) + 86400;
    const employeeId = ethers.utils.formatBytes32String("MFG-001");
    const orgId = ethers.utils.formatBytes32String("Pfizer");
    const jobTitle = ethers.utils.formatBytes32String("QA");

    // Register signer identity (manufacturer has AUDITOR_ROLE in this PoC)
    const txReg = await trackingPoC.connect(manufacturer).registerAndVerifySignerIdentity(
      manufacturer.address,
      employeeId,
      orgId,
      jobTitle,
      expiry
    );
    await txReg.wait();

    // Create signature: message hash matches createSignature internals
    const documentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("DOC-1"));
    const intentStatement = ethers.utils.formatBytes32String("I verify batch 1");
    const signingReason = ethers.utils.formatBytes32String("QA approval");

    const messageHash = ethers.utils.solidityKeccak256(
      ["bytes32", "bytes32", "bytes32"],
      [documentHash, intentStatement, signingReason]
    );

    const signature = await manufacturer.signMessage(ethers.utils.arrayify(messageHash));

    const tx2 = await trackingPoC.connect(manufacturer).createSignature(
      documentHash,
      1,
      intentStatement,
      signingReason,
      signature,
      0
    );
    const r2 = await tx2.wait();
    console.log("TrackingPoC createSignature gasUsed:", r2.gasUsed.toString());
    expect(r2.status).to.equal(1);
  });
});
