import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import Web3 from 'web3';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// Database Models
interface RecallAttributes {
  id: string;
  recall_id: string;
  severity_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  initiated_by: string;
  initiated_at: Date;
  status: 'ACTIVE' | 'RESOLVED' | 'CANCELLED';
  resolution_notes?: string;
  resolved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

interface RecallBatchAttributes {
  id: string;
  recall_id: string;
  batch_id: string;
  product_name: string;
  lot_number: string;
  expiry_date: Date;
  quantity_affected: number;
  created_at: Date;
}

interface DistributionTrackingAttributes {
  id: string;
  batch_id: string;
  distributor_name: string;
  distributor_address: string;
  quantity_shipped: number;
  shipped_date: Date;
  received_date?: Date;
  status: 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED';
  blockchain_tx_hash?: string;
  created_at: Date;
  updated_at: Date;
}

// Sequelize Models
class Recall extends Model<RecallAttributes, Optional<RecallAttributes, 'id' | 'created_at' | 'updated_at'>> implements RecallAttributes {
  public id!: string;
  public recall_id!: string;
  public severity_level!: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  public reason!: string;
  public initiated_by!: string;
  public initiated_at!: Date;
  public status!: 'ACTIVE' | 'RESOLVED' | 'CANCELLED';
  public resolution_notes?: string;
  public resolved_at?: Date;
  public created_at!: Date;
  public updated_at!: Date;
}

class RecallBatch extends Model<RecallBatchAttributes, Optional<RecallBatchAttributes, 'id' | 'created_at'>> implements RecallBatchAttributes {
  public id!: string;
  public recall_id!: string;
  public batch_id!: string;
  public product_name!: string;
  public lot_number!: string;
  public expiry_date!: Date;
  public quantity_affected!: number;
  public created_at!: Date;
}

class DistributionTracking extends Model<DistributionTrackingAttributes, Optional<DistributionTrackingAttributes, 'id' | 'created_at' | 'updated_at'>> implements DistributionTrackingAttributes {
  public id!: string;
  public batch_id!: string;
  public distributor_name!: string;
  public distributor_address!: string;
  public quantity_shipped!: number;
  public shipped_date!: Date;
  public received_date?: Date;
  public status!: 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED';
  public blockchain_tx_hash?: string;
  public created_at!: Date;
  public updated_at!: Date;
}

// Service Interface
export interface RecallServiceInterface {
  initiateRecall(batchIds: string[], severity: string, reason: string, initiatedBy: string): Promise<any>;
  trackAffectedDistribution(batchId: string): Promise<any>;
  notifyStakeholders(recallId: string): Promise<void>;
  getRecallStatus(recallId: string): Promise<any>;
  getAllRecalls(): Promise<any[]>;
  updateRecallStatus(recallId: string, status: string, resolutionNotes?: string): Promise<any>;
  addBatchToRecall(recallId: string, batchId: string, productName: string, lotNumber: string, expiryDate: Date, quantity: number): Promise<any>;
}

export class RecallService implements RecallServiceInterface {
  private web3: Web3;
  private recallContract: any;
  private sequelize: Sequelize;

  constructor(web3: Web3, recallContract: any, sequelize: Sequelize) {
    this.web3 = web3;
    this.recallContract = recallContract;
    this.sequelize = sequelize;
    this.initializeModels();
  }

  private initializeModels() {
    Recall.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      recall_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      severity_level: {
        type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
        allowNull: false
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      initiated_by: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      initiated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'RESOLVED', 'CANCELLED'),
        defaultValue: 'ACTIVE'
      },
      resolution_notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      resolved_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      sequelize: this.sequelize,
      tableName: 'recalls',
      timestamps: true
    });

    RecallBatch.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      recall_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: Recall,
          key: 'id'
        }
      },
      batch_id: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      product_name: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      lot_number: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      expiry_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      quantity_affected: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      sequelize: this.sequelize,
      tableName: 'recall_batches',
      timestamps: false
    });

    DistributionTracking.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      batch_id: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      distributor_name: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      distributor_address: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      quantity_shipped: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      shipped_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      received_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'),
        defaultValue: 'SHIPPED'
      },
      blockchain_tx_hash: {
        type: DataTypes.STRING(66),
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      sequelize: this.sequelize,
      tableName: 'distribution_tracking',
      timestamps: true
    });

    // Define associations
    Recall.hasMany(RecallBatch, { foreignKey: 'recall_id' });
    RecallBatch.belongsTo(Recall, { foreignKey: 'recall_id' });
  }

  async initiateRecall(
    batchIds: string[],
    severity: string,
    reason: string,
    initiatedBy: string
  ): Promise<any> {
    try {
      const recallId = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Convert severity to contract enum
      const severityMap = {
        'LOW': 0,
        'MEDIUM': 1,
        'HIGH': 2,
        'CRITICAL': 3
      };

      // Create recall in database
      const recall = await Recall.create({
        recall_id: recallId,
        severity_level: severity as any,
        reason,
        initiated_by: initiatedBy
      });

      // Add batches to recall in database
      for (const batchId of batchIds) {
        await RecallBatch.create({
          recall_id: recall.id,
          batch_id: batchId,
          product_name: 'Unknown Product', // This should be fetched from batch data
          lot_number: batchId,
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year from now
          quantity_affected: 0 // This should be calculated from actual data
        });
      }

      // Record recall on blockchain
      const tx = await this.recallContract.methods.initiateRecall(
        recallId,
        severityMap[severity as keyof typeof severityMap],
        reason,
        batchIds
      ).send({ from: initiatedBy });

      logger.info(`Recall initiated: ${recallId}`, { 
        recallId, 
        severity, 
        batchCount: batchIds.length,
        txHash: tx.transactionHash 
      });

      // Notify stakeholders
      await this.notifyStakeholders(recallId);

      return {
        recallId,
        severity,
        reason,
        batchIds,
        status: 'ACTIVE',
        initiatedAt: recall.initiated_at,
        txHash: tx.transactionHash
      };
    } catch (error) {
      logger.error('Error initiating recall:', error);
      throw new Error(`Failed to initiate recall: ${error.message}`);
    }
  }

  async trackAffectedDistribution(batchId: string): Promise<any> {
    try {
      const distributions = await DistributionTracking.findAll({
        where: { batch_id: batchId }
      });

      const recallBatches = await RecallBatch.findAll({
        where: { batch_id: batchId },
        include: [Recall]
      });

      const isRecalled = recallBatches.some(rb => rb.Recall?.status === 'ACTIVE');

      return {
        batchId,
        distributions: distributions.map(d => ({
          distributorName: d.distributor_name,
          distributorAddress: d.distributor_address,
          quantityShipped: d.quantity_shipped,
          shippedDate: d.shipped_date,
          receivedDate: d.received_date,
          status: d.status,
          blockchainTxHash: d.blockchain_tx_hash
        })),
        isRecalled,
        activeRecalls: recallBatches
          .filter(rb => rb.Recall?.status === 'ACTIVE')
          .map(rb => ({
            recallId: rb.Recall?.recall_id,
            severity: rb.Recall?.severity_level,
            reason: rb.Recall?.reason,
            initiatedAt: rb.Recall?.initiated_at
          }))
      };
    } catch (error) {
      logger.error('Error tracking distribution:', error);
      throw new Error(`Failed to track distribution: ${error.message}`);
    }
  }

  async notifyStakeholders(recallId: string): Promise<void> {
    try {
      // In a real implementation, this would send notifications via email, SMS, etc.
      logger.info(`Notifying stakeholders about recall: ${recallId}`);
      
      // For now, just log the notification
      // In production, integrate with notification services like SendGrid, Twilio, etc.
      
      const recall = await Recall.findOne({ where: { recall_id: recallId } });
      if (recall) {
        logger.info(`Recall notification sent for ${recallId}`, {
          severity: recall.severity_level,
          reason: recall.reason,
          initiatedBy: recall.initiated_by
        });
      }
    } catch (error) {
      logger.error('Error notifying stakeholders:', error);
      throw new Error(`Failed to notify stakeholders: ${error.message}`);
    }
  }

  async getRecallStatus(recallId: string): Promise<any> {
    try {
      const recall = await Recall.findOne({
        where: { recall_id: recallId },
        include: [RecallBatch]
      });

      if (!recall) {
        throw new Error('Recall not found');
      }

      // Get blockchain status
      const blockchainRecall = await this.recallContract.methods.getRecall(recallId).call();
      const isBatchInRecall = await this.recallContract.methods.isBatchInRecall(recallId).call();

      return {
        recallId: recall.recall_id,
        severity: recall.severity_level,
        reason: recall.reason,
        status: recall.status,
        initiatedBy: recall.initiated_by,
        initiatedAt: recall.initiated_at,
        resolvedAt: recall.resolved_at,
        resolutionNotes: recall.resolution_notes,
        batches: recall.RecallBatches?.map(rb => ({
          batchId: rb.batch_id,
          productName: rb.product_name,
          lotNumber: rb.lot_number,
          expiryDate: rb.expiry_date,
          quantityAffected: rb.quantity_affected
        })) || [],
        blockchainStatus: {
          recallId: blockchainRecall[0],
          severity: blockchainRecall[1],
          reason: blockchainRecall[2],
          initiatedBy: blockchainRecall[3],
          initiatedAt: blockchainRecall[4],
          status: blockchainRecall[5],
          batchIds: blockchainRecall[6]
        },
        isBatchInRecall
      };
    } catch (error) {
      logger.error('Error getting recall status:', error);
      throw new Error(`Failed to get recall status: ${error.message}`);
    }
  }

  async getAllRecalls(): Promise<any[]> {
    try {
      const recalls = await Recall.findAll({
        include: [RecallBatch],
        order: [['initiated_at', 'DESC']]
      });

      return recalls.map(recall => ({
        recallId: recall.recall_id,
        severity: recall.severity_level,
        reason: recall.reason,
        status: recall.status,
        initiatedBy: recall.initiated_by,
        initiatedAt: recall.initiated_at,
        resolvedAt: recall.resolved_at,
        batchCount: recall.RecallBatches?.length || 0
      }));
    } catch (error) {
      logger.error('Error getting all recalls:', error);
      throw new Error(`Failed to get recalls: ${error.message}`);
    }
  }

  async updateRecallStatus(
    recallId: string,
    status: string,
    resolutionNotes?: string
  ): Promise<any> {
    try {
      const recall = await Recall.findOne({ where: { recall_id: recallId } });
      if (!recall) {
        throw new Error('Recall not found');
      }

      const updateData: any = { status: status as any };
      if (status === 'RESOLVED' || status === 'CANCELLED') {
        updateData.resolved_at = new Date();
        updateData.resolution_notes = resolutionNotes;
      }

      await recall.update(updateData);

      // Update blockchain status
      const statusMap = {
        'ACTIVE': 0,
        'RESOLVED': 1,
        'CANCELLED': 2
      };

      await this.recallContract.methods.updateRecallStatus(
        recallId,
        statusMap[status as keyof typeof statusMap]
      ).send({ from: recall.initiated_by });

      logger.info(`Recall status updated: ${recallId}`, { status, resolutionNotes });

      return {
        recallId,
        status,
        resolvedAt: updateData.resolved_at,
        resolutionNotes: updateData.resolution_notes
      };
    } catch (error) {
      logger.error('Error updating recall status:', error);
      throw new Error(`Failed to update recall status: ${error.message}`);
    }
  }

  async addBatchToRecall(
    recallId: string,
    batchId: string,
    productName: string,
    lotNumber: string,
    expiryDate: Date,
    quantity: number
  ): Promise<any> {
    try {
      const recall = await Recall.findOne({ where: { recall_id: recallId } });
      if (!recall) {
        throw new Error('Recall not found');
      }

      if (recall.status !== 'ACTIVE') {
        throw new Error('Cannot add batch to inactive recall');
      }

      // Add batch to database
      const recallBatch = await RecallBatch.create({
        recall_id: recall.id,
        batch_id: batchId,
        product_name: productName,
        lot_number: lotNumber,
        expiry_date: expiryDate,
        quantity_affected: quantity
      });

      // Add batch to blockchain
      await this.recallContract.methods.addBatchToRecall(recallId, batchId)
        .send({ from: recall.initiated_by });

      logger.info(`Batch added to recall: ${recallId}`, { batchId, productName });

      return {
        recallId,
        batchId,
        productName,
        lotNumber,
        expiryDate,
        quantity
      };
    } catch (error) {
      logger.error('Error adding batch to recall:', error);
      throw new Error(`Failed to add batch to recall: ${error.message}`);
    }
  }
}