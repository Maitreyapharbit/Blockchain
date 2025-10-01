import { Batch, VerificationResult, SecurityFeature } from '../types';

// Blockchain validation utilities for pharmaceutical blockchain system

export interface BlockchainTransaction {
  hash: string;
  blockNumber: number;
  timestamp: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  status: 'success' | 'failed' | 'pending';
}

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  details: string;
  blockchainHash?: string;
  blockNumber?: number;
  timestamp?: string;
  errors: string[];
}

export class BlockchainValidator {
  private static instance: BlockchainValidator;
  private apiEndpoint: string;

  constructor(apiEndpoint: string = process.env.REACT_APP_BLOCKCHAIN_API_URL || 'http://localhost:8545') {
    this.apiEndpoint = apiEndpoint;
  }

  static getInstance(): BlockchainValidator {
    if (!BlockchainValidator.instance) {
      BlockchainValidator.instance = new BlockchainValidator();
    }
    return BlockchainValidator.instance;
  }

  // Validate batch authenticity using blockchain
  async validateBatchAuthenticity(batch: Batch): Promise<ValidationResult> {
    try {
      const errors: string[] = [];
      let confidence = 0;
      let details = '';

      // Check if batch has blockchain hash
      if (!batch.blockchainHash) {
        errors.push('Batch does not have blockchain hash');
        return {
          isValid: false,
          confidence: 0,
          details: 'Batch not registered on blockchain',
          errors,
        };
      }

      // Verify blockchain transaction
      const transaction = await this.getTransactionByHash(batch.blockchainHash);
      if (!transaction) {
        errors.push('Blockchain transaction not found');
        return {
          isValid: false,
          confidence: 0,
          details: 'Transaction not found on blockchain',
          errors,
        };
      }

      // Check transaction status
      if (transaction.status !== 'success') {
        errors.push('Blockchain transaction failed');
        return {
          isValid: false,
          confidence: 0,
          details: 'Transaction failed on blockchain',
          errors,
        };
      }

      confidence += 30;
      details += 'Blockchain transaction verified. ';

      // Verify batch data integrity
      const dataIntegrity = await this.verifyDataIntegrity(batch, transaction);
      if (dataIntegrity.isValid) {
        confidence += 40;
        details += 'Data integrity verified. ';
      } else {
        errors.push(...dataIntegrity.errors);
        confidence -= 20;
        details += 'Data integrity check failed. ';
      }

      // Verify security features
      const securityValidation = await this.validateSecurityFeatures(batch.securityFeatures);
      if (securityValidation.isValid) {
        confidence += 30;
        details += 'Security features validated. ';
      } else {
        errors.push(...securityValidation.errors);
        confidence -= 15;
        details += 'Security feature validation failed. ';
      }

      return {
        isValid: confidence >= 70,
        confidence: Math.max(0, Math.min(100, confidence)),
        details: details.trim(),
        blockchainHash: batch.blockchainHash,
        blockNumber: transaction.blockNumber,
        timestamp: transaction.timestamp,
        errors,
      };
    } catch (error) {
      console.error('Error validating batch authenticity:', error);
      return {
        isValid: false,
        confidence: 0,
        details: 'Validation failed due to system error',
        errors: ['System error during validation'],
      };
    }
  }

  // Get transaction details from blockchain
  private async getTransactionByHash(hash: string): Promise<BlockchainTransaction | null> {
    try {
      // This would typically call a blockchain API or smart contract
      // For now, we'll simulate the response
      const response = await fetch(`${this.apiEndpoint}/transaction/${hash}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }

  // Verify data integrity between batch and blockchain record
  private async verifyDataIntegrity(
    batch: Batch,
    transaction: BlockchainTransaction
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // In a real implementation, this would compare the batch data
      // with the data stored in the blockchain transaction
      const batchDataHash = await this.calculateBatchHash(batch);
      
      // Simulate blockchain data verification
      const isValid = batchDataHash === batch.blockchainHash;
      
      if (!isValid) {
        errors.push('Batch data does not match blockchain record');
      }

      return { isValid, errors };
    } catch (error) {
      errors.push('Error verifying data integrity');
      return { isValid: false, errors };
    }
  }

  // Calculate hash for batch data
  private async calculateBatchHash(batch: Batch): Promise<string> {
    const data = {
      id: batch.id,
      productName: batch.productName,
      batchNumber: batch.batchNumber,
      manufacturingDate: batch.manufacturingDate,
      expiryDate: batch.expiryDate,
      quantity: batch.quantity,
      location: batch.location,
    };

    // Simple hash calculation (in production, use a proper hashing algorithm)
    const dataString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Validate security features
  private async validateSecurityFeatures(
    securityFeatures: SecurityFeature[]
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!securityFeatures || securityFeatures.length === 0) {
      errors.push('No security features found');
      return { isValid: false, errors };
    }

    let validFeatures = 0;
    for (const feature of securityFeatures) {
      if (await this.validateSecurityFeature(feature)) {
        validFeatures++;
      } else {
        errors.push(`Invalid security feature: ${feature.type}`);
      }
    }

    const isValid = validFeatures >= securityFeatures.length * 0.8; // 80% of features must be valid
    return { isValid, errors };
  }

  // Validate individual security feature
  private async validateSecurityFeature(feature: SecurityFeature): Promise<boolean> {
    try {
      switch (feature.type) {
        case 'qr_code':
          return await this.validateQRCode(feature.value);
        case 'hologram':
          return await this.validateHologram(feature.value);
        case 'serial_number':
          return await this.validateSerialNumber(feature.value);
        case 'tamper_evident':
          return await this.validateTamperEvidence(feature.value);
        default:
          return false;
      }
    } catch (error) {
      console.error('Error validating security feature:', error);
      return false;
    }
  }

  // Validate QR code
  private async validateQRCode(qrValue: string): Promise<boolean> {
    // In a real implementation, this would verify the QR code
    // against the blockchain or a secure database
    return qrValue && qrValue.length > 0;
  }

  // Validate hologram
  private async validateHologram(hologramValue: string): Promise<boolean> {
    // In a real implementation, this would verify the hologram
    // using specialized hardware or software
    return hologramValue && hologramValue.length > 0;
  }

  // Validate serial number
  private async validateSerialNumber(serialNumber: string): Promise<boolean> {
    // In a real implementation, this would verify the serial number
    // against a secure database
    return serialNumber && /^[A-Z0-9]{8,12}$/.test(serialNumber);
  }

  // Validate tamper evidence
  private async validateTamperEvidence(tamperValue: string): Promise<boolean> {
    // In a real implementation, this would check for tampering indicators
    return tamperValue === 'intact';
  }

  // Verify batch ownership chain
  async verifyOwnershipChain(batchId: string): Promise<{
    isValid: boolean;
    chain: Array<{
      owner: string;
      timestamp: string;
      transactionHash: string;
    }>;
    errors: string[];
  }> {
    try {
      // This would trace the ownership chain on the blockchain
      const response = await fetch(`${this.apiEndpoint}/batch/${batchId}/ownership-chain`);
      if (!response.ok) {
        return {
          isValid: false,
          chain: [],
          errors: ['Failed to fetch ownership chain'],
        };
      }

      const data = await response.json();
      return {
        isValid: data.chain.length > 0,
        chain: data.chain,
        errors: data.errors || [],
      };
    } catch (error) {
      console.error('Error verifying ownership chain:', error);
      return {
        isValid: false,
        chain: [],
        errors: ['System error during ownership verification'],
      };
    }
  }

  // Get batch verification history from blockchain
  async getVerificationHistory(batchId: string): Promise<VerificationResult[]> {
    try {
      const response = await fetch(`${this.apiEndpoint}/batch/${batchId}/verifications`);
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.verifications || [];
    } catch (error) {
      console.error('Error fetching verification history:', error);
      return [];
    }
  }

  // Register new verification on blockchain
  async registerVerification(verification: VerificationResult): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.apiEndpoint}/verification/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verification),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Failed to register verification',
        };
      }

      const data = await response.json();
      return {
        success: true,
        transactionHash: data.transactionHash,
      };
    } catch (error) {
      console.error('Error registering verification:', error);
      return {
        success: false,
        error: 'System error during verification registration',
      };
    }
  }
}

// Export singleton instance
export const blockchainValidator = BlockchainValidator.getInstance();

// Utility functions
export const formatBlockchainAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTransactionHash = (hash: string): string => {
  if (!hash) return '';
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
};

export const getBlockchainExplorerUrl = (hash: string, network: string = 'mainnet'): string => {
  const explorers = {
    mainnet: 'https://etherscan.io/tx/',
    ropsten: 'https://ropsten.etherscan.io/tx/',
    rinkeby: 'https://rinkeby.etherscan.io/tx/',
    local: 'http://localhost:8080/tx/',
  };
  return `${explorers[network as keyof typeof explorers] || explorers.local}${hash}`;
};

export default blockchainValidator;