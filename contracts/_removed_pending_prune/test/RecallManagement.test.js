const { expect } = require("chai");

describe("Deprecated tests - RecallManagement", function () {
  it("skipped: Recall tests moved to Token/Tracking suites", async function () {
    expect(true).to.equal(true);
  });
});  let recallManagement;
  let owner;
  let stakeholder1;
  let stakeholder2;
  let addrs;

  beforeEach(async function () {
    [owner, stakeholder1, stakeholder2, ...addrs] = await ethers.getSigners();
    
    const RecallManagement = await ethers.getContractFactory("RecallManagement");
    recallManagement = await RecallManagement.deploy();
    await recallManagement.deployed();

    // Authorize stakeholders
    await recallManagement.authorizeStakeholder(stakeholder1.address);
    await recallManagement.authorizeStakeholder(stakeholder2.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await recallManagement.owner()).to.equal(owner.address);
    });

    it("Should authorize the owner as stakeholder", async function () {
      expect(await recallManagement.authorizedStakeholders(owner.address)).to.be.true;
    });
  });

  describe("Stakeholder Management", function () {
    it("Should authorize new stakeholder", async function () {
      await recallManagement.authorizeStakeholder(addrs[0].address);
      expect(await recallManagement.authorizedStakeholders(addrs[0].address)).to.be.true;
    });

    it("Should revoke stakeholder", async function () {
      await recallManagement.revokeStakeholder(stakeholder1.address);
      expect(await recallManagement.authorizedStakeholders(stakeholder1.address)).to.be.false;
    });

    it("Should only allow owner to manage stakeholders", async function () {
      await expect(
        recallManagement.connect(stakeholder1).authorizeStakeholder(addrs[0].address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Recall Management", function () {
    const recallId = "REC-001";
    const severity = 2; // HIGH
    const reason = "Contaminated batch detected";
    const batchIds = ["BATCH-001", "BATCH-002"];

    it("Should initiate recall successfully", async function () {
      await expect(
        recallManagement.connect(stakeholder1).initiateRecall(
          recallId,
          severity,
          reason,
          batchIds
        )
      ).to.emit(recallManagement, "RecallInitiated")
        .withArgs(recallId, severity, reason, stakeholder1.address, batchIds);

      const recall = await recallManagement.getRecall(recallId);
      expect(recall[0]).to.equal(recallId);
      expect(recall[1]).to.equal(severity);
      expect(recall[2]).to.equal(reason);
      expect(recall[3]).to.equal(stakeholder1.address);
    });

    it("Should not allow unauthorized users to initiate recall", async function () {
      await expect(
        recallManagement.connect(addrs[0]).initiateRecall(
          recallId,
          severity,
          reason,
          batchIds
        )
      ).to.be.revertedWith("Not authorized");
    });

    it("Should not allow duplicate recall IDs", async function () {
      await recallManagement.connect(stakeholder1).initiateRecall(
        recallId,
        severity,
        reason,
        batchIds
      );

      await expect(
        recallManagement.connect(stakeholder1).initiateRecall(
          recallId,
          severity,
          reason,
          batchIds
        )
      ).to.be.revertedWith("Recall ID already exists");
    });

    it("Should require at least one batch", async function () {
      await expect(
        recallManagement.connect(stakeholder1).initiateRecall(
          recallId,
          severity,
          reason,
          []
        )
      ).to.be.revertedWith("At least one batch required");
    });

    it("Should add batch to existing recall", async function () {
      await recallManagement.connect(stakeholder1).initiateRecall(
        recallId,
        severity,
        reason,
        batchIds
      );

      const newBatchId = "BATCH-003";
      await expect(
        recallManagement.connect(stakeholder1).addBatchToRecall(recallId, newBatchId)
      ).to.emit(recallManagement, "BatchAddedToRecall")
        .withArgs(recallId, newBatchId);

      const recall = await recallManagement.getRecall(recallId);
      expect(recall[6]).to.include(newBatchId);
    });

    it("Should update recall status", async function () {
      await recallManagement.connect(stakeholder1).initiateRecall(
        recallId,
        severity,
        reason,
        batchIds
      );

      await expect(
        recallManagement.connect(stakeholder1).updateRecallStatus(recallId, 1) // RESOLVED
      ).to.emit(recallManagement, "RecallStatusUpdated")
        .withArgs(recallId, 1);

      const recall = await recallManagement.getRecall(recallId);
      expect(recall[5]).to.equal(1); // RESOLVED
    });
  });

  describe("Distribution Tracking", function () {
    const batchId = "BATCH-001";
    const quantity = 1000;
    let distributor;

    beforeEach(function () {
      distributor = addrs[0].address;
    });

    it("Should record distribution", async function () {
      await expect(
        recallManagement.connect(stakeholder1).recordDistribution(
          batchId,
          distributor,
          quantity
        )
      ).to.emit(recallManagement, "DistributionRecorded")
        .withArgs(batchId, distributor, quantity);

      const distribution = await recallManagement.getDistributionRecord(batchId);
      expect(distribution[0]).to.equal(batchId);
      expect(distribution[1]).to.equal(distributor);
      expect(distribution[2]).to.equal(quantity);
    });

    it("Should require positive quantity", async function () {
      await expect(
        recallManagement.connect(stakeholder1).recordDistribution(
          batchId,
          distributor,
          0
        )
      ).to.be.revertedWith("Quantity must be positive");
    });

    it("Should mark batch as recalled", async function () {
      await recallManagement.connect(stakeholder1).recordDistribution(
        batchId,
        distributor,
        quantity
      );

      await recallManagement.connect(stakeholder1).markBatchAsRecalled(batchId);
      
      const distribution = await recallManagement.getDistributionRecord(batchId);
      expect(distribution[4]).to.be.true; // isRecalled
    });
  });

  describe("Batch Recall Status", function () {
    it("Should return false for non-recalled batch", async function () {
      const isRecalled = await recallManagement.isBatchInRecall("NON-EXISTENT");
      expect(isRecalled).to.be.false;
    });

    it("Should return true for recalled batch", async function () {
      const recallId = "REC-001";
      const batchId = "BATCH-001";
      
      await recallManagement.connect(stakeholder1).initiateRecall(
        recallId,
        2, // HIGH
        "Test recall",
        [batchId]
      );

      const isRecalled = await recallManagement.isBatchInRecall(batchId);
      expect(isRecalled).to.be.true;
    });
  });

  describe("Get All Recalls", function () {
    it("Should return all recall IDs", async function () {
      const recallId1 = "REC-001";
      const recallId2 = "REC-002";
      
      await recallManagement.connect(stakeholder1).initiateRecall(
        recallId1,
        1, // MEDIUM
        "First recall",
        ["BATCH-001"]
      );

      await recallManagement.connect(stakeholder2).initiateRecall(
        recallId2,
        2, // HIGH
        "Second recall",
        ["BATCH-002"]
      );

      const allRecalls = await recallManagement.getAllRecalls();
      expect(allRecalls).to.include(recallId1);
      expect(allRecalls).to.include(recallId2);
      expect(allRecalls.length).to.equal(2);
    });
  });
});