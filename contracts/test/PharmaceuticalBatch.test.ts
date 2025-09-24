import { expect } from 'chai';
import { ethers } from 'hardhat';
import { PharmaceuticalBatch } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('PharmaceuticalBatch Access Control', function () {
  let PharmaceuticalBatch;
  let pharmaceuticalBatch;
  let owner;
  let manufacturer;
  let distributor;
  let other;

  beforeEach(async function () {
    [owner, manufacturer, distributor, other] = await ethers.getSigners();
    
    PharmaceuticalBatch = await ethers.getContractFactory('PharmaceuticalBatch');
    pharmaceuticalBatch = await PharmaceuticalBatch.deploy();
    await pharmaceuticalBatch.waitForDeployment();
  });

  describe('Role Management', function () {
    it('Should grant manufacturer role', async function () {
      await pharmaceuticalBatch.grantManufacturerRole(manufacturer.address);
      
      const MANUFACTURER_ROLE = await pharmaceuticalBatch.MANUFACTURER_ROLE();
      expect(await pharmaceuticalBatch.hasRole(MANUFACTURER_ROLE, manufacturer.address)).to.be.true;
    });

    it('Should grant distributor role', async function () {
      await pharmaceuticalBatch.grantDistributorRole(distributor.address);
      
      const DISTRIBUTOR_ROLE = await pharmaceuticalBatch.DISTRIBUTOR_ROLE();
      expect(await pharmaceuticalBatch.hasRole(DISTRIBUTOR_ROLE, distributor.address)).to.be.true;
    });

    it('Should prevent non-admin from granting roles', async function () {
      await expect(
        pharmaceuticalBatch.connect(other).grantManufacturerRole(manufacturer.address)
      ).to.be.revertedWith('AccessControl: account 0x... is missing role 0x...');
    });
  });

  describe('Batch Operations', function () {
    beforeEach(async function () {
      await pharmaceuticalBatch.grantManufacturerRole(manufacturer.address);
      await pharmaceuticalBatch.grantDistributorRole(distributor.address);
    });

    it('Should allow manufacturer to create batch', async function () {
      const tx = await pharmaceuticalBatch.connect(manufacturer).createBatch(
        "Test Drug",
        100,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + 31536000 // +1 year
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => 
        log.topics[0] === pharmaceuticalBatch.interface.getEvent('BatchCreated').topicHash
      );
      expect(event).to.not.be.undefined;
    });

    it('Should prevent non-manufacturer from creating batch', async function () {
      await expect(
        pharmaceuticalBatch.connect(other).createBatch(
          "Test Drug",
          100,
          Math.floor(Date.now() / 1000),
          Math.floor(Date.now() / 1000) + 31536000
        )
      ).to.be.revertedWith('AccessControl: account 0x... is missing role 0x...');
    });

    it('Should allow distributor to validate batch', async function () {
      // First create a batch
      const tx = await pharmaceuticalBatch.connect(manufacturer).createBatch(
        "Test Drug",
        100,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + 31536000
      );
      const receipt = await tx.wait();
      
      // Get batch ID from event
      const event = receipt.logs.find(log => 
        log.topics[0] === pharmaceuticalBatch.interface.getEvent('BatchCreated').topicHash
      );
      const batchId = pharmaceuticalBatch.interface.parseLog(event).args.batchId;

      // Validate batch
      await expect(
        pharmaceuticalBatch.connect(distributor).validateBatch(batchId)
      ).to.emit(pharmaceuticalBatch, 'BatchValidated');
    });
  });
});