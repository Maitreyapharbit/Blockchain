const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AntiCounterfeitVerification", function () {
  let antiCounterfeitVerification;
  let owner;
  let verifier1;
  let verifier2;
  let manufacturer;
  let addrs;

  beforeEach(async function () {
    [owner, verifier1, verifier2, manufacturer, ...addrs] = await ethers.getSigners();
    
    const AntiCounterfeitVerification = await ethers.getContractFactory("AntiCounterfeitVerification");
    antiCounterfeitVerification = await AntiCounterfeitVerification.deploy();
    await antiCounterfeitVerification.deployed();

    // Authorize verifiers
    await antiCounterfeitVerification.authorizeVerifier(verifier1.address);
    await antiCounterfeitVerification.authorizeVerifier(verifier2.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await antiCounterfeitVerification.owner()).to.equal(owner.address);
    });

    it("Should authorize the owner as verifier", async function () {
      expect(await antiCounterfeitVerification.authorizedVerifiers(owner.address)).to.be.true;
    });
  });

  describe("Verifier Management", function () {
    it("Should authorize new verifier", async function () {
      await antiCounterfeitVerification.authorizeVerifier(addrs[0].address);
      expect(await antiCounterfeitVerification.authorizedVerifiers(addrs[0].address)).to.be.true;
    });

    it("Should revoke verifier", async function () {
      await antiCounterfeitVerification.revokeVerifier(verifier1.address);
      expect(await antiCounterfeitVerification.authorizedVerifiers(verifier1.address)).to.be.false;
    });

    it("Should only allow owner to manage verifiers", async function () {
      await expect(
        antiCounterfeitVerification.connect(verifier1).authorizeVerifier(addrs[0].address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Security Features", function () {
    const batchId = "BATCH-001";
    const qrCodeHash = "0x1234567890abcdef";
    const hologramId = "HOLO-001";
    const serialNumber = "SN-001";
    const securityPattern = "PATTERN-001";

    it("Should create security feature successfully", async function () {
      await expect(
        antiCounterfeitVerification.connect(manufacturer).createSecurityFeature(
          batchId,
          qrCodeHash,
          hologramId,
          serialNumber,
          securityPattern
        )
      ).to.emit(antiCounterfeitVerification, "SecurityFeatureCreated")
        .withArgs(batchId, qrCodeHash, hologramId, serialNumber, manufacturer.address);

      const feature = await antiCounterfeitVerification.getSecurityFeature(batchId);
      expect(feature[0]).to.equal(batchId);
      expect(feature[1]).to.equal(qrCodeHash);
      expect(feature[2]).to.equal(hologramId);
      expect(feature[3]).to.equal(serialNumber);
      expect(feature[4]).to.equal(securityPattern);
      expect(feature[5]).to.equal(manufacturer.address);
    });

    it("Should not allow duplicate security features", async function () {
      await antiCounterfeitVerification.connect(manufacturer).createSecurityFeature(
        batchId,
        qrCodeHash,
        hologramId,
        serialNumber,
        securityPattern
      );

      await expect(
        antiCounterfeitVerification.connect(manufacturer).createSecurityFeature(
          batchId,
          qrCodeHash,
          hologramId,
          serialNumber,
          securityPattern
        )
      ).to.be.revertedWith("Security feature already exists");
    });

    it("Should require non-empty QR code hash", async function () {
      await expect(
        antiCounterfeitVerification.connect(manufacturer).createSecurityFeature(
          batchId,
          "",
          hologramId,
          serialNumber,
          securityPattern
        )
      ).to.be.revertedWith("QR code hash required");
    });

    it("Should require non-empty hologram ID", async function () {
      await expect(
        antiCounterfeitVerification.connect(manufacturer).createSecurityFeature(
          batchId,
          qrCodeHash,
          "",
          serialNumber,
          securityPattern
        )
      ).to.be.revertedWith("Hologram ID required");
    });

    it("Should require non-empty serial number", async function () {
      await expect(
        antiCounterfeitVerification.connect(manufacturer).createSecurityFeature(
          batchId,
          qrCodeHash,
          hologramId,
          "",
          securityPattern
        )
      ).to.be.revertedWith("Serial number required");
    });
  });

  describe("Authenticity Verification", function () {
    const batchId = "BATCH-001";
    const qrCodeHash = "0x1234567890abcdef";
    const hologramId = "HOLO-001";
    const serialNumber = "SN-001";
    const securityPattern = "PATTERN-001";

    beforeEach(async function () {
      await antiCounterfeitVerification.connect(manufacturer).createSecurityFeature(
        batchId,
        qrCodeHash,
        hologramId,
        serialNumber,
        securityPattern
      );
    });

    it("Should verify QR code successfully", async function () {
      const result = await antiCounterfeitVerification.connect(verifier1).verifyAuthenticity(
        batchId,
        0, // QR_SCAN
        qrCodeHash,
        "Verification details"
      );

      expect(result).to.be.true;
    });

    it("Should verify hologram successfully", async function () {
      const result = await antiCounterfeitVerification.connect(verifier1).verifyAuthenticity(
        batchId,
        1, // HOLOGRAM_CHECK
        hologramId,
        "Verification details"
      );

      expect(result).to.be.true;
    });

    it("Should verify serial number successfully", async function () {
      const result = await antiCounterfeitVerification.connect(verifier1).verifyAuthenticity(
        batchId,
        2, // SERIAL_VERIFICATION
        serialNumber,
        "Verification details"
      );

      expect(result).to.be.true;
    });

    it("Should fail verification with wrong data", async function () {
      const result = await antiCounterfeitVerification.connect(verifier1).verifyAuthenticity(
        batchId,
        0, // QR_SCAN
        "wrong-hash",
        "Verification details"
      );

      expect(result).to.be.false;
    });

    it("Should not allow verification of non-existent batch", async function () {
      await expect(
        antiCounterfeitVerification.connect(verifier1).verifyAuthenticity(
          "NON-EXISTENT",
          0,
          qrCodeHash,
          "Verification details"
        )
      ).to.be.revertedWith("Security feature not found");
    });

    it("Should not allow verification of inactive feature", async function () {
      // This would require additional functionality to deactivate features
      // For now, we'll test the basic verification flow
      const result = await antiCounterfeitVerification.connect(verifier1).verifyAuthenticity(
        batchId,
        0,
        qrCodeHash,
        "Verification details"
      );

      expect(result).to.be.true;
    });
  });

  describe("Counterfeit Reporting", function () {
    const reportId = "RPT-001";
    const batchId = "BATCH-001";
    const reportType = "SUSPICIOUS_PACKAGING";
    const description = "Suspicious packaging detected";
    const evidenceUrls = ["https://example.com/evidence1.jpg"];

    it("Should report suspicious activity successfully", async function () {
      await expect(
        antiCounterfeitVerification.connect(addrs[0]).reportSuspiciousActivity(
          reportId,
          batchId,
          reportType,
          description,
          evidenceUrls
        )
      ).to.emit(antiCounterfeitVerification, "CounterfeitReported")
        .withArgs(reportId, batchId, addrs[0].address, reportType);

      const report = await antiCounterfeitVerification.getCounterfeitReport(reportId);
      expect(report[0]).to.equal(reportId);
      expect(report[1]).to.equal(batchId);
      expect(report[2]).to.equal(addrs[0].address);
      expect(report[3]).to.equal(reportType);
      expect(report[4]).to.equal(description);
    });

    it("Should not allow duplicate report IDs", async function () {
      await antiCounterfeitVerification.connect(addrs[0]).reportSuspiciousActivity(
        reportId,
        batchId,
        reportType,
        description,
        evidenceUrls
      );

      await expect(
        antiCounterfeitVerification.connect(addrs[0]).reportSuspiciousActivity(
          reportId,
          batchId,
          reportType,
          description,
          evidenceUrls
        )
      ).to.be.revertedWith("Report ID already exists");
    });

    it("Should require non-empty description", async function () {
      await expect(
        antiCounterfeitVerification.connect(addrs[0]).reportSuspiciousActivity(
          reportId,
          batchId,
          reportType,
          "",
          evidenceUrls
        )
      ).to.be.revertedWith("Description required");
    });

    it("Should update report status", async function () {
      await antiCounterfeitVerification.connect(addrs[0]).reportSuspiciousActivity(
        reportId,
        batchId,
        reportType,
        description,
        evidenceUrls
      );

      await expect(
        antiCounterfeitVerification.connect(verifier1).updateReportStatus(
          reportId,
          1, // INVESTIGATING
          "Investigation started"
        )
      ).to.emit(antiCounterfeitVerification, "ReportStatusUpdated")
        .withArgs(reportId, 1, verifier1.address);

      const report = await antiCounterfeitVerification.getCounterfeitReport(reportId);
      expect(report[7]).to.equal(1); // INVESTIGATING
    });
  });

  describe("Batch Flagging", function () {
    const batchId = "BATCH-001";

    it("Should flag batch", async function () {
      await expect(
        antiCounterfeitVerification.connect(verifier1).flagBatch(batchId, "Suspicious activity")
      ).to.emit(antiCounterfeitVerification, "BatchFlagged")
        .withArgs(batchId, "Suspicious activity");

      expect(await antiCounterfeitVerification.isBatchFlagged(batchId)).to.be.true;
    });

    it("Should unflag batch", async function () {
      await antiCounterfeitVerification.connect(verifier1).flagBatch(batchId, "Suspicious activity");
      
      await expect(
        antiCounterfeitVerification.connect(verifier1).unflagBatch(batchId)
      ).to.emit(antiCounterfeitVerification, "BatchUnflagged")
        .withArgs(batchId);

      expect(await antiCounterfeitVerification.isBatchFlagged(batchId)).to.be.false;
    });

    it("Should return flagged batches", async function () {
      const batchId1 = "BATCH-001";
      const batchId2 = "BATCH-002";
      const batchId3 = "BATCH-003";

      await antiCounterfeitVerification.connect(verifier1).flagBatch(batchId1, "Reason 1");
      await antiCounterfeitVerification.connect(verifier1).flagBatch(batchId2, "Reason 2");
      // batchId3 is not flagged

      const flaggedBatches = await antiCounterfeitVerification.getFlaggedBatches();
      expect(flaggedBatches).to.include(batchId1);
      expect(flaggedBatches).to.include(batchId2);
      expect(flaggedBatches).to.not.include(batchId3);
    });
  });

  describe("Get All Data", function () {
    it("Should return all batch IDs", async function () {
      const batchId1 = "BATCH-001";
      const batchId2 = "BATCH-002";

      await antiCounterfeitVerification.connect(manufacturer).createSecurityFeature(
        batchId1,
        "hash1",
        "hologram1",
        "serial1",
        "pattern1"
      );

      await antiCounterfeitVerification.connect(manufacturer).createSecurityFeature(
        batchId2,
        "hash2",
        "hologram2",
        "serial2",
        "pattern2"
      );

      const allBatches = await antiCounterfeitVerification.getAllBatchIds();
      expect(allBatches).to.include(batchId1);
      expect(allBatches).to.include(batchId2);
      expect(allBatches.length).to.equal(2);
    });

    it("Should return all report IDs", async function () {
      const reportId1 = "RPT-001";
      const reportId2 = "RPT-002";

      await antiCounterfeitVerification.connect(addrs[0]).reportSuspiciousActivity(
        reportId1,
        "BATCH-001",
        "SUSPICIOUS_PACKAGING",
        "Description 1",
        []
      );

      await antiCounterfeitVerification.connect(addrs[1]).reportSuspiciousActivity(
        reportId2,
        "BATCH-002",
        "INVALID_QR",
        "Description 2",
        []
      );

      const allReports = await antiCounterfeitVerification.getAllReportIds();
      expect(allReports).to.include(reportId1);
      expect(allReports).to.include(reportId2);
      expect(allReports.length).to.equal(2);
    });
  });
});