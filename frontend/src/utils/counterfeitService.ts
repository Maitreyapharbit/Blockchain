import axios from 'axios';
import { supabase } from '../config/supabase';
import { 
  CounterfeitReport, 
  SuspiciousActivity, 
  VerificationResult, 
  EvidenceFile,
  Batch,
  ApiResponse,
  PaginatedResponse 
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } = {} } = await supabase.auth.getSession();
    if (session && session.access_token) {
      if (config.headers) {
        config.headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }
  } catch (e) {
    // ignore and continue without auth
  }
  return config;
});

export const counterfeitService = {
  // Get all counterfeit reports
  async getReports(params?: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: string;
    search?: string;
  }): Promise<PaginatedResponse<CounterfeitReport>> {
    try {
      const response = await api.get('/counterfeit/reports', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching counterfeit reports:', error);
      throw new Error('Failed to fetch counterfeit reports');
    }
  },

  // Get single report by ID
  async getReportById(id: string): Promise<CounterfeitReport> {
    try {
      const response = await api.get(`/counterfeit/reports/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching counterfeit report:', error);
      throw new Error('Failed to fetch counterfeit report');
    }
  },

  // Create new counterfeit report
  async createReport(reportData: Partial<CounterfeitReport>): Promise<CounterfeitReport> {
    try {
      const response = await api.post('/counterfeit/reports', reportData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating counterfeit report:', error);
      throw new Error('Failed to create counterfeit report');
    }
  },

  // Update counterfeit report
  async updateReport(id: string, updates: Partial<CounterfeitReport>): Promise<CounterfeitReport> {
    try {
      const response = await api.put(`/counterfeit/reports/${id}`, updates);
      return response.data.data;
    } catch (error) {
      console.error('Error updating counterfeit report:', error);
      throw new Error('Failed to update counterfeit report');
    }
  },

  // Upload evidence file
  async uploadEvidence(reportId: string, file: File): Promise<EvidenceFile> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(`/counterfeit/reports/${reportId}/evidence`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error uploading evidence:', error);
      throw new Error('Failed to upload evidence');
    }
  },

  // Delete evidence file
  async deleteEvidence(reportId: string, evidenceId: string): Promise<void> {
    try {
      await api.delete(`/counterfeit/reports/${reportId}/evidence/${evidenceId}`);
    } catch (error) {
      console.error('Error deleting evidence:', error);
      throw new Error('Failed to delete evidence');
    }
  },

  // Get suspicious activities
  async getSuspiciousActivities(params?: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: string;
    activityType?: string;
  }): Promise<PaginatedResponse<SuspiciousActivity>> {
    try {
      const response = await api.get('/counterfeit/activities', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching suspicious activities:', error);
      throw new Error('Failed to fetch suspicious activities');
    }
  },

  // Get single suspicious activity
  async getSuspiciousActivityById(id: string): Promise<SuspiciousActivity> {
    try {
      const response = await api.get(`/counterfeit/activities/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching suspicious activity:', error);
      throw new Error('Failed to fetch suspicious activity');
    }
  },

  // Update suspicious activity status
  async updateSuspiciousActivityStatus(
    id: string,
    status: SuspiciousActivity['status']
  ): Promise<SuspiciousActivity> {
    try {
      const response = await api.put(`/counterfeit/activities/${id}`, { status });
      return response.data.data;
    } catch (error) {
      console.error('Error updating suspicious activity status:', error);
      throw new Error('Failed to update suspicious activity status');
    }
  },

  // Verify batch authenticity
  async verifyBatch(batchId: string, verificationType: VerificationResult['verificationType']): Promise<VerificationResult> {
    try {
      const response = await api.post(`/counterfeit/verify`, {
        batchId,
        verificationType,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error verifying batch:', error);
      throw new Error('Failed to verify batch');
    }
  },

  // Get verification history for a batch
  async getVerificationHistory(batchId: string): Promise<VerificationResult[]> {
    try {
      const response = await api.get(`/counterfeit/verify/${batchId}/history`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching verification history:', error);
      throw new Error('Failed to fetch verification history');
    }
  },

  // Get all verification results
  async getVerificationResults(params?: {
    page?: number;
    limit?: number;
    result?: string;
    verificationType?: string;
    batchId?: string;
  }): Promise<PaginatedResponse<VerificationResult>> {
    try {
      const response = await api.get('/counterfeit/verify/results', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching verification results:', error);
      throw new Error('Failed to fetch verification results');
    }
  },

  // Scan QR code
  async scanQRCode(qrData: string): Promise<{
    batchId: string;
    batch: Batch;
    verificationResult: VerificationResult;
  }> {
    try {
      const response = await api.post('/counterfeit/scan-qr', { qrData });
      return response.data.data;
    } catch (error) {
      console.error('Error scanning QR code:', error);
      throw new Error('Failed to scan QR code');
    }
  },

  // Verify hologram
  async verifyHologram(batchId: string, hologramData: string): Promise<VerificationResult> {
    try {
      const response = await api.post('/counterfeit/verify-hologram', {
        batchId,
        hologramData,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error verifying hologram:', error);
      throw new Error('Failed to verify hologram');
    }
  },

  // Verify serial number
  async verifySerialNumber(batchId: string, serialNumber: string): Promise<VerificationResult> {
    try {
      const response = await api.post('/counterfeit/verify-serial', {
        batchId,
        serialNumber,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error verifying serial number:', error);
      throw new Error('Failed to verify serial number');
    }
  },

  // Get counterfeit statistics
  async getCounterfeitStats(): Promise<{
    totalReports: number;
    verifiedCounterfeits: number;
    falsePositives: number;
    pendingInvestigation: number;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    verificationStats: {
      totalVerifications: number;
      authenticCount: number;
      counterfeitCount: number;
      suspiciousCount: number;
    };
  }> {
    try {
      const response = await api.get('/counterfeit/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching counterfeit stats:', error);
      throw new Error('Failed to fetch counterfeit statistics');
    }
  },

  // Get batch security features
  async getBatchSecurityFeatures(batchId: string): Promise<Batch['securityFeatures']> {
    try {
      const response = await api.get(`/batches/${batchId}/security-features`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching security features:', error);
      throw new Error('Failed to fetch security features');
    }
  },

  // Generate QR code for batch
  async generateQRCode(batchId: string): Promise<{ qrCode: string; qrData: string }> {
    try {
      const response = await api.post(`/batches/${batchId}/generate-qr`);
      return response.data.data;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  },

  // Get real-time verification status
  async getRealTimeVerificationStatus(batchId: string): Promise<{
    isVerifying: boolean;
    lastVerification?: VerificationResult;
    verificationInProgress: boolean;
  }> {
    try {
      const response = await api.get(`/counterfeit/verify/${batchId}/status`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching verification status:', error);
      throw new Error('Failed to fetch verification status');
    }
  },
};

export default counterfeitService;