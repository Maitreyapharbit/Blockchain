const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Tracking contract", function () {
  it("registers/verifies signer and records signatures", async function () {
    const [owner, auditor, signer] = await ethers.getSigners();
    const Tracking = await ethers.getContractFactory("Tracking");
    const tracking = await Tracking.deploy();
    await tracking.deployed();

    const AUDITOR_ROLE = await tracking.AUDITOR_ROLE();
    await tracking.grantRole(AUDITOR_ROLE, auditor.address);

    const expiry = Math.floor(Date.now() / 1000) + 3600;
    await tracking.connect(auditor).registerAndVerifySignerIdentity(signer.address, ethers.utils.formatBytes32String("E-1"), ethers.utils.formatBytes32String("ORG"), ethers.utils.formatBytes32String("JOB"), expiry);

    expect(await tracking.isSignerAuthorized(signer.address)).to.equal(true);

    const documentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("DOC-1"));
    const intentStatement = ethers.utils.formatBytes32String("Approve price");
    const signingReason = ethers.utils.formatBytes32String("Reason");

    const messageHash = ethers.utils.solidityKeccak256(["bytes32","bytes32","bytes32"], [documentHash, intentStatement, signingReason]);
    const signature = await signer.signMessage(ethers.utils.arrayify(messageHash));

    await tracking.connect(signer).createSignature(documentHash, 1, intentStatement, signingReason, signature, 0);

    const sigs = await tracking.getDocumentSignatures(documentHash);
    expect(sigs.length).to.equal(1);
    expect(sigs[0].signer).to.equal(signer.address);
  });
});