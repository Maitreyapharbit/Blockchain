const { ethers } = require('ethers');
const logger = require('../utils/logger');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contracts = {};
    this.isInitialized = false;
  }

  async initialize() {
    try {
      this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');

      // Initialize wallet
      if (process.env.PRIVATE_KEY) {
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        logger.info(`Blockchain wallet initialized: ${this.wallet.address}`);
      }

      // Load contract addresses from deployment
      await this.loadContracts();

      this.isInitialized = true;
      logger.info('Blockchain service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  /**
   * Load contract instances
   */
  async loadContracts() {
    try {
      // Load deployment info
      const deploymentPath = require('path').join(__dirname, '../deployments/pharma-contracts.json');
      const deployment = require(deploymentPath);

      // Contract ABIs
      const pharmaceuticalBatchABI = JSON.parse(deployment.contracts.PharmaceuticalBatch.abi);
      const batchNFTABI = JSON.parse(deployment.contracts.BatchNFT.abi);
      const complianceManagerABI = JSON.parse(deployment.contracts.ComplianceManager.abi);

      // Initialize contracts
      this.contracts.pharmaceuticalBatch = new ethers.Contract(
        deployment.contracts.PharmaceuticalBatch.address,
        pharmaceuticalBatchABI,
        this.wallet || this.provider
      );

      this.contracts.batchNFT = new ethers.Contract(
        deployment.contracts.BatchNFT.address,
        batchNFTABI,
        this.wallet || this.provider
      );

      this.contracts.complianceManager = new ethers.Contract(
        deployment.contracts.ComplianceManager.address,
        complianceManagerABI,
        this.wallet || this.provider
      );

      logger.info('Contracts loaded successfully');
    } catch (error) {
      logger.error('Failed to load contracts:', error);
      throw error;
    }
  }

  /**
   * Get contract instance
   * @param {string} contractName - Name of the contract
   * @returns {ethers.Contract} Contract instance
   */
  getContract(contractName) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    const contract = this.contracts[contractName];
    if (!contract) {
      throw new Error(`Contract ${contractName} not found`);
    }

    return contract;
  }

  /**
   * Get wallet address
   * @returns {string} Wallet address
   */
  getWalletAddress() {
    return this.wallet?.address || null;
  }

  /**
   * Get network information
   * @returns {Object} Network information
   */
  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.provider.getGasPrice();

      return {
        name: network.name,
        chainId: network.chainId.toString(),
        blockNumber,
        gasPrice: ethers.formatUnits(gasPrice, 'gwei')
      };
    } catch (error) {
      logger.error('Failed to get network info:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   * @param {string} address - Account address
   * @returns {string} Balance in ETH
   */
  async getBalance(address) {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      logger.error('Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Estimate gas for transaction
   * @param {Object} transaction - Transaction object
   * @returns {Object} Gas estimate
   */
  async estimateGas(transaction) {
    try {
      const gasEstimate = await this.provider.estimateGas(transaction);
      return {
        gasLimit: gasEstimate.toString(),
        gasPrice: (await this.provider.getGasPrice()).toString()
      };
    } catch (error) {
      logger.error('Failed to estimate gas:', error);
      throw error;
    }
  }

  /**
   * Wait for transaction confirmation
   * @param {string} txHash - Transaction hash
   * @param {number} confirmations - Number of confirmations to wait for
   * @returns {Object} Transaction receipt
   */
  async waitForTransaction(txHash, confirmations = 1) {
    try {
      const receipt = await this.provider.waitForTransaction(txHash, confirmations);

      if (receipt.status === 0) {
        throw new Error('Transaction failed');
      }

      logger.blockchain(txHash, 'waitForTransaction', 'success', receipt.gasUsed.toString());
      return receipt;
    } catch (error) {
      logger.blockchain(txHash, 'waitForTransaction', 'failed', null, error);
      throw error;
    }
  }

  /**
   * Create batch
   * @param {Object} batchData - Batch data
   * @returns {Object} Transaction result
   */
  async createBatch(batchData) {
    try {
      const contract = this.getContract('pharmaceuticalBatch');

      const tx = await contract.createBatch(
        batchData.drugName,
        batchData.drugCode,
        batchData.manufacturer,
        Math.floor(new Date(batchData.manufactureDate).getTime() / 1000),
        Math.floor(new Date(batchData.expiryDate).getTime() / 1000),
        batchData.quantity,
        batchData.serialNumbers || '',
        Object.keys(batchData.metadata || {}),
        Object.values(batchData.metadata || {})
      );

      const receipt = await this.waitForTransaction(tx.hash);

      // Extract batch ID from events
      const event = receipt.logs.find((log) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'BatchCreated';
        } catch {
          return false;
        }
      });

      const batchId = event ? contract.interface.parseLog(event).args.batchId.toString() : null;

      logger.blockchain(tx.hash, 'createBatch', 'success', receipt.gasUsed.toString());

      return {
        txHash: tx.hash,
        batchId,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      logger.blockchain(null, 'createBatch', 'failed', null, error);
      throw error;
    }
  }

  /**
   * Transfer batch
   * @param {number} batchId - Batch ID
   * @param {Object} transferData - Transfer data
   * @returns {Object} Transaction result
   */
  async transferBatch(batchId, transferData) {
    try {
      const contract = this.getContract('pharmaceuticalBatch');

      const tx = await contract.transferBatch(
        batchId,
        transferData.to,
        transferData.reason,
        transferData.location,
        transferData.notes || ''
      );

      const receipt = await this.waitForTransaction(tx.hash);

      logger.blockchain(tx.hash, 'transferBatch', 'success', receipt.gasUsed.toString());

      return {
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      logger.blockchain(null, 'transferBatch', 'failed', null, error);
      throw error;
    }
  }

  /**
   * Update batch status
   * @param {number} batchId - Batch ID
   * @param {number} status - New status
   * @param {string} reason - Reason for status change
   * @returns {Object} Transaction result
   */
  async updateBatchStatus(batchId, status, reason) {
    try {
      const contract = this.getContract('pharmaceuticalBatch');

      const tx = await contract.updateBatchStatus(batchId, status, reason);
      const receipt = await this.waitForTransaction(tx.hash);

      logger.blockchain(tx.hash, 'updateBatchStatus', 'success', receipt.gasUsed.toString());

      return {
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      logger.blockchain(null, 'updateBatchStatus', 'failed', null, error);
      throw error;
    }
  }

  /**
   * Get batch information
   * @param {number} batchId - Batch ID
   * @returns {Object} Batch information
   */
  async getBatch(batchId) {
    try {
      const contract = this.getContract('pharmaceuticalBatch');
      const batch = await contract.getBatch(batchId);

      return {
        batchId: batch.batchId.toString(),
        drugName: batch.drugName,
        drugCode: batch.drugCode,
        manufacturer: batch.manufacturer,
        manufactureDate: new Date(Number(batch.manufactureDate) * 1000).toISOString(),
        expiryDate: new Date(Number(batch.expiryDate) * 1000).toISOString(),
        quantity: batch.quantity.toString(),
        status: Number(batch.status),
        currentOwner: batch.currentOwner,
        serialNumbers: batch.serialNumbers,
        createdAt: new Date(Number(batch.createdAt) * 1000).toISOString(),
        updatedAt: new Date(Number(batch.updatedAt) * 1000).toISOString()
      };
    } catch (error) {
      logger.error('Failed to get batch:', error);
      throw error;
    }
  }

  /**
   * Add compliance check
   * @param {Object} complianceData - Compliance data
   * @returns {Object} Transaction result
   */
  async addComplianceCheck(complianceData) {
    try {
      const contract = this.getContract('complianceManager');

      const tx = await contract.addComplianceCheck(
        complianceData.batchId,
        complianceData.checkType,
        complianceData.notes,
        complianceData.findings || '',
        complianceData.correctiveActions || '',
        complianceData.evidenceHashes || [],
        Object.keys(complianceData.additionalData || {}),
        Object.values(complianceData.additionalData || {})
      );

      const receipt = await this.waitForTransaction(tx.hash);

      logger.blockchain(tx.hash, 'addComplianceCheck', 'success', receipt.gasUsed.toString());

      return {
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      logger.blockchain(null, 'addComplianceCheck', 'failed', null, error);
      throw error;
    }
  }

  /**
   * Update compliance status
   * @param {number} recordId - Record ID
   * @param {Object} statusData - Status data
   * @returns {Object} Transaction result
   */
  async updateComplianceStatus(recordId, statusData) {
    try {
      const contract = this.getContract('complianceManager');

      const tx = await contract.updateComplianceStatus(
        recordId,
        statusData.status,
        statusData.passed,
        statusData.updatedNotes || ''
      );

      const receipt = await this.waitForTransaction(tx.hash);

      logger.blockchain(tx.hash, 'updateComplianceStatus', 'success', receipt.gasUsed.toString());

      return {
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      logger.blockchain(null, 'updateComplianceStatus', 'failed', null, error);
      throw error;
    }
  }

  /**
   * Mint batch NFT
   * @param {Object} nftData - NFT data
   * @returns {Object} Transaction result
   */
  async mintBatchNFT(nftData) {
    try {
      const contract = this.getContract('batchNFT');

      const tx = await contract.mintBatchNFT(
        nftData.to,
        nftData.batchId,
        nftData.tokenURI,
        nftData.metadata,
        Object.keys(nftData.attributes || {}),
        Object.values(nftData.attributes || {})
      );

      const receipt = await this.waitForTransaction(tx.hash);

      logger.blockchain(tx.hash, 'mintBatchNFT', 'success', receipt.gasUsed.toString());

      return {
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      logger.blockchain(null, 'mintBatchNFT', 'failed', null, error);
      throw error;
    }
  }

  /**
   * Get total batches count
   * @returns {number} Total batches
   */
  async getTotalBatches() {
    try {
      const contract = this.getContract('pharmaceuticalBatch');
      const total = await contract.getTotalBatches();
      return Number(total);
    } catch (error) {
      logger.error('Failed to get total batches:', error);
      throw error;
    }
  }

  /**
   * Get compliance records count
   * @returns {number} Total compliance records
   */
  async getTotalComplianceRecords() {
    try {
      const contract = this.getContract('complianceManager');
      const total = await contract.getTotalRecords();
      return Number(total);
    } catch (error) {
      logger.error('Failed to get total compliance records:', error);
      throw error;
    }
  }

  /**
   * Get total NFTs count
   * @returns {number} Total NFTs
   */
  async getTotalNFTs() {
    try {
      const contract = this.getContract('batchNFT');
      const total = await contract.totalSupply();
      return Number(total);
    } catch (error) {
      logger.error('Failed to get total NFTs:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new BlockchainService();
