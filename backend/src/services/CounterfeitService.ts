import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import Web3 from 'web3';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// Database Models
interface SecurityFeatureAttributes {
  id: string;
  batch_id: string;
  qr_code_hash: string;
  hologram_id: string;
  serial_number: string;
  security_pattern: string;
  created_at: Date;
  updated_at: Date;
}

interface CounterfeitReportAttributes {
  id: string;
  batch_id: string;
  reporter_name: string;
  reporter_email: string;
  report_type: 'SUSPICIOUS_PACKAGING' | 'INVALID_QR' | 'MISSING_HOLOGRAM' | 'OTHER';
  description: string;
  evidence_urls: string[];
  location?: string;
  reported_at: Date;
  status: 'PENDING' | 'INVESTIGATING' | 'CONFIRMED' | 'FALSE_ALARM';
  investigator_notes?: string;
  resolved_at?: Date;
}

interface VerificationLogAttributes {
  id: string;
  batch_id: string;
  verification_type: 'QR_SCAN' | 'HOLOGRAM_CHECK' | 'SERIAL_VERIFICATION';
  verification_result: boolean;
  verification_details: any;
  verified_by?: string;
  verified_at: Date;
  ip_address?: string;
  user_agent?: string;
}

// Sequelize Models
class SecurityFeature extends Model<SecurityFeatureAttributes, Optional<SecurityFeatureAttributes, 'id' | 'created_at' | 'updated_at'>> implements SecurityFeatureAttributes {
  public id!: string;
  public batch_id!: string;
  public qr_code_hash!: string;
  public hologram_id!: string;
  public serial_number!: string;
  public security_pattern!: string;
  public created_at!: Date;
  public updated_at!: Date;
}

class CounterfeitReport extends Model<CounterfeitReportAttributes, Optional<CounterfeitReportAttributes, 'id' | 'reported_at'>> implements CounterfeitReportAttributes {
  public id!: string;
  public batch_id!: string;
  public reporter_name!: string;
  public reporter_email!: string;
  public report_type!: 'SUSPICIOUS_PACKAGING' | 'INVALID_QR' | 'MISSING_HOLOGRAM' | 'OTHER';
  public description!: string;
  public evidence_urls!: string[];
  public location?: string;
  public reported_at!: Date;
  public status!: 'PENDING' | 'INVESTIGATING' | 'CONFIRMED' | 'FALSE_ALARM';
  public investigator_notes?: string;
  public resolved_at?: Date;
}

class VerificationLog extends Model<VerificationLogAttributes, Optional<VerificationLogAttributes, 'id' | 'verified_at'>> implements VerificationLogAttributes {
  public id!: string;
  public batch_id!: string;
  public verification_type!: 'QR_SCAN' | 'HOLOGRAM_CHECK' | 'SERIAL_VERIFICATION';
  public verification_result!: boolean;
  public verification_details!: any;
  public verified_by?: string;
  public verified_at!: Date;
  public ip_address?: string;
  public user_agent?: string;
}

// Service Interface
export interface CounterfeitServiceInterface {
  verifyAuthenticity(batchId: string, verificationType: string, providedData: string, verifiedBy?: string, ipAddress?: string, userAgent?: string): Promise<boolean>;
  reportSuspiciousActivity(batchId: string, reporterName: string, reporterEmail: string, reportType: string, description: string, evidenceUrls: string[], location?: string): Promise<any>;
  getFlaggedBatches(): Promise<any[]>;
  generateSecurityFeatures(batchId: string, qrCodeHash: string, hologramId: string, serialNumber: string, securityPattern: string): Promise<any>;
  getSecurityFeature(batchId: string): Promise<any>;
  updateReportStatus(reportId: string, status: string, investigatorNotes?: string): Promise<any>;
  getVerificationHistory(batchId: string): Promise<any[]>;
  getAllReports(): Promise<any[]>;
}

export class CounterfeitService implements CounterfeitServiceInterface {
  private web3: Web3;
  private counterfeitContract: any;
  private sequelize: Sequelize;

  constructor(web3: Web3, counterfeitContract: any, sequelize: Sequelize) {
    this.web3 = web3;
    this.counterfeitContract = counterfeitContract;
    this.sequelize = sequelize;
    this.initializeModels();
  }

  private initializeModels() {
    SecurityFeature.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      batch_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      qr_code_hash: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      hologram_id: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      serial_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      security_pattern: {
        type: DataTypes.TEXT,
        allowNull: false
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
      tableName: 'security_features',
      timestamps: true
    });

    CounterfeitReport.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      batch_id: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      reporter_name: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      reporter_email: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      report_type: {
        type: DataTypes.ENUM('SUSPICIOUS_PACKAGING', 'INVALID_QR', 'MISSING_HOLOGRAM', 'OTHER'),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      evidence_urls: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false,
        defaultValue: []
      },
      location: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      reported_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'INVESTIGATING', 'CONFIRMED', 'FALSE_ALARM'),
        defaultValue: 'PENDING'
      },
      investigator_notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      resolved_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      sequelize: this.sequelize,
      tableName: 'counterfeit_reports',
      timestamps: false
    });

    VerificationLog.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      batch_id: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      verification_type: {
        type: DataTypes.ENUM('QR_SCAN', 'HOLOGRAM_CHECK', 'SERIAL_VERIFICATION'),
        allowNull: false
      },
      verification_result: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      verification_details: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      verified_by: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      verified_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      ip_address: {
        type: DataTypes.INET,
        allowNull: true
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    }, {
      sequelize: this.sequelize,
      tableName: 'verification_logs',
      timestamps: false
    });
  }

  async verifyAuthenticity(
    batchId: string,
    verificationType: string,
    providedData: string,
    verifiedBy?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    try {
      // Get security feature from database
      const securityFeature = await SecurityFeature.findOne({
        where: { batch_id: batchId }
      });

      if (!securityFeature) {
        throw new Error('Security feature not found for batch');
      }

      // Convert verification type to contract enum
      const verificationTypeMap = {
        'QR_SCAN': 0,
        'HOLOGRAM_CHECK': 1,
        'SERIAL_VERIFICATION': 2
      };

      // Verify on blockchain
      const isValid = await this.counterfeitContract.methods.verifyAuthenticity(
        batchId,
        verificationTypeMap[verificationType as keyof typeof verificationTypeMap],
        providedData,
        JSON.stringify({ verifiedBy, ipAddress, userAgent })
      ).call();

      // Log verification attempt
      await VerificationLog.create({
        batch_id: batchId,
        verification_type: verificationType as any,
        verification_result: isValid,
        verification_details: {
          providedData,
          expectedData: this.getExpectedData(securityFeature, verificationType),
          verifiedBy,
          ipAddress,
          userAgent
        },
        verified_by: verifiedBy,
        ip_address: ipAddress,
        user_agent: userAgent
      });

      logger.info(`Verification performed: ${batchId}`, {
        verificationType,
        isValid,
        verifiedBy,
        ipAddress
      });

      return isValid;
    } catch (error) {
      logger.error('Error verifying authenticity:', error);
      throw new Error(`Failed to verify authenticity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getExpectedData(securityFeature: SecurityFeature, verificationType: string): string {
    switch (verificationType) {
      case 'QR_SCAN':
        return securityFeature.qr_code_hash;
      case 'HOLOGRAM_CHECK':
        return securityFeature.hologram_id;
      case 'SERIAL_VERIFICATION':
        return securityFeature.serial_number;
      default:
        return '';
    }
  }

  async reportSuspiciousActivity(
    batchId: string,
    reporterName: string,
    reporterEmail: string,
    reportType: string,
    description: string,
    evidenceUrls: string[],
    location?: string
  ): Promise<any> {
    try {
      const reportId = `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create report in database
      const report = await CounterfeitReport.create({
        batch_id: batchId,
        reporter_name: reporterName,
        reporter_email: reporterEmail,
        report_type: reportType as any,
        description,
        evidence_urls: evidenceUrls,
        location,
        status: 'PENDING'
      });

      // Report on blockchain
      await this.counterfeitContract.methods.reportSuspiciousActivity(
        reportId,
        batchId,
        reportType,
        description,
        evidenceUrls
      ).send({ from: reporterEmail }); // In production, use proper wallet address

      logger.info(`Suspicious activity reported: ${reportId}`, {
        batchId,
        reportType,
        reporterName,
        evidenceCount: evidenceUrls.length
      });

      return {
        reportId,
        batchId,
        reportType,
        status: 'PENDING',
        reportedAt: report.reported_at
      };
    } catch (error) {
      logger.error('Error reporting suspicious activity:', error);
      throw new Error(`Failed to report suspicious activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFlaggedBatches(): Promise<any[]> {
    try {
      // Get flagged batches from blockchain
      const flaggedBatchIds = await this.counterfeitContract.methods.getFlaggedBatches().call();

      const results = [];
      for (const batchId of flaggedBatchIds) {
        const securityFeature = await SecurityFeature.findOne({
          where: { batch_id: batchId }
        });

        const verificationLogs = await VerificationLog.findAll({
          where: { batch_id: batchId },
          order: [['verified_at', 'DESC']],
          limit: 5
        });

        const reports = await CounterfeitReport.findAll({
          where: { batch_id: batchId },
          order: [['reported_at', 'DESC']]
        });

        results.push({
          batchId,
          securityFeature: securityFeature ? {
            qrCodeHash: securityFeature.qr_code_hash,
            hologramId: securityFeature.hologram_id,
            serialNumber: securityFeature.serial_number,
            createdAt: securityFeature.created_at
          } : null,
          recentVerifications: verificationLogs.map(log => ({
            type: log.verification_type,
            result: log.verification_result,
            verifiedAt: log.verified_at,
            verifiedBy: log.verified_by
          })),
          reports: reports.map(report => ({
            id: report.id,
            reportType: report.report_type,
            description: report.description,
            status: report.status,
            reportedAt: report.reported_at
          }))
        });
      }

      return results;
    } catch (error) {
      logger.error('Error getting flagged batches:', error);
      throw new Error(`Failed to get flagged batches: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateSecurityFeatures(
    batchId: string,
    qrCodeHash: string,
    hologramId: string,
    serialNumber: string,
    securityPattern: string
  ): Promise<any> {
    try {
      // Check if security feature already exists
      const existing = await SecurityFeature.findOne({
        where: { batch_id: batchId }
      });

      if (existing) {
        throw new Error('Security features already exist for this batch');
      }

      // Create in database
      const securityFeature = await SecurityFeature.create({
        batch_id: batchId,
        qr_code_hash: qrCodeHash,
        hologram_id: hologramId,
        serial_number: serialNumber,
        security_pattern: securityPattern
      });

      // Create on blockchain
      await this.counterfeitContract.methods.createSecurityFeature(
        batchId,
        qrCodeHash,
        hologramId,
        serialNumber,
        securityPattern
      ).send({ from: process.env.MANUFACTURER_ADDRESS }); // In production, use proper wallet

      logger.info(`Security features generated: ${batchId}`, {
        qrCodeHash,
        hologramId,
        serialNumber
      });

      return {
        batchId,
        qrCodeHash,
        hologramId,
        serialNumber,
        securityPattern,
        createdAt: securityFeature.created_at
      };
    } catch (error) {
      logger.error('Error generating security features:', error);
      throw new Error(`Failed to generate security features: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSecurityFeature(batchId: string): Promise<any> {
    try {
      const securityFeature = await SecurityFeature.findOne({
        where: { batch_id: batchId }
      });

      if (!securityFeature) {
        throw new Error('Security feature not found');
      }

      // Get blockchain data
      const blockchainFeature = await this.counterfeitContract.methods.getSecurityFeature(batchId).call();

      return {
        batchId: securityFeature.batch_id,
        qrCodeHash: securityFeature.qr_code_hash,
        hologramId: securityFeature.hologram_id,
        serialNumber: securityFeature.serial_number,
        securityPattern: securityFeature.security_pattern,
        createdAt: securityFeature.created_at,
        blockchainData: {
          batchId: blockchainFeature[0],
          qrCodeHash: blockchainFeature[1],
          hologramId: blockchainFeature[2],
          serialNumber: blockchainFeature[3],
          securityPattern: blockchainFeature[4],
          manufacturer: blockchainFeature[5],
          createdAt: blockchainFeature[6],
          isActive: blockchainFeature[7]
        }
      };
    } catch (error) {
      logger.error('Error getting security feature:', error);
      throw new Error(`Failed to get security feature: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateReportStatus(
    reportId: string,
    status: string,
    investigatorNotes?: string
  ): Promise<any> {
    try {
      const report = await CounterfeitReport.findByPk(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      const updateData: any = { status: status as any };
      if (status === 'CONFIRMED' || status === 'FALSE_ALARM') {
        updateData.resolved_at = new Date();
        updateData.investigator_notes = investigatorNotes;
      }

      await report.update(updateData);

      // Update blockchain status
      const statusMap = {
        'PENDING': 0,
        'INVESTIGATING': 1,
        'CONFIRMED': 2,
        'FALSE_ALARM': 3
      };

      await this.counterfeitContract.methods.updateReportStatus(
        reportId,
        statusMap[status as keyof typeof statusMap],
        investigatorNotes || ''
      ).send({ from: process.env.INVESTIGATOR_ADDRESS }); // In production, use proper wallet

      logger.info(`Report status updated: ${reportId}`, { status, investigatorNotes });

      return {
        reportId,
        status,
        resolvedAt: updateData.resolved_at,
        investigatorNotes: updateData.investigator_notes
      };
    } catch (error) {
      logger.error('Error updating report status:', error);
      throw new Error(`Failed to update report status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getVerificationHistory(batchId: string): Promise<any[]> {
    try {
      const logs = await VerificationLog.findAll({
        where: { batch_id: batchId },
        order: [['verified_at', 'DESC']]
      });

      return logs.map(log => ({
        id: log.id,
        verificationType: log.verification_type,
        result: log.verification_result,
        details: log.verification_details,
        verifiedBy: log.verified_by,
        verifiedAt: log.verified_at,
        ipAddress: log.ip_address,
        userAgent: log.user_agent
      }));
    } catch (error) {
      logger.error('Error getting verification history:', error);
      throw new Error(`Failed to get verification history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllReports(): Promise<any[]> {
    try {
      const reports = await CounterfeitReport.findAll({
        order: [['reported_at', 'DESC']]
      });

      return reports.map(report => ({
        id: report.id,
        batchId: report.batch_id,
        reporterName: report.reporter_name,
        reporterEmail: report.reporter_email,
        reportType: report.report_type,
        description: report.description,
        evidenceUrls: report.evidence_urls,
        location: report.location,
        status: report.status,
        investigatorNotes: report.investigator_notes,
        reportedAt: report.reported_at,
        resolvedAt: report.resolved_at
      }));
    } catch (error) {
      logger.error('Error getting all reports:', error);
      throw new Error(`Failed to get reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}