import axios from 'axios';
import { Recall, RecallBatch, DistributionRecord, SecurityFeature, VerificationRecord, CounterfeitReport, FlaggedBatch, ApiResponse } from '../types';

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in GitHub Codespaces
  if (window.location.hostname.includes('app.github.dev')) {
    const codespaceName = process.env.REACT_APP_CODESPACE_NAME || 'verbose-tribble-7vxrwqqxr4g5fr9j5';
    return `https://${codespaceName}-3001.app.github.dev/api`;
  }
  
  // Default to local development
  return process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Recall Management API
export const recallApi = {
  // Initiate a new recall
  initiateRecall: async (data: {
    batchIds: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    reason: string;
    initiatedBy: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post('/recalls/initiate', data);
    return response.data;
  },

  // Get recall status
  getRecallStatus: async (recallId: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/recalls/${recallId}/status`);
    return response.data;
  },

  // Get all recalls
  getAllRecalls: async (): Promise<ApiResponse<Recall[]>> => {
    const response = await api.get('/recalls');
    return response.data;
  },

  // Update recall status
  updateRecallStatus: async (recallId: string, data: {
    status: 'ACTIVE' | 'RESOLVED' | 'CANCELLED';
    resolutionNotes?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/recalls/${recallId}/status`, data);
    return response.data;
  },

  // Add batch to recall
  addBatchToRecall: async (recallId: string, data: {
    batchId: string;
    productName: string;
    lotNumber: string;
    expiryDate: string;
    quantity: number;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post(`/recalls/${recallId}/batches`, data);
    return response.data;
  },

  // Track affected distribution
  trackAffectedDistribution: async (batchId: string): Promise<ApiResponse<{
    batchId: string;
    distributions: DistributionRecord[];
    isRecalled: boolean;
    activeRecalls: any[];
  }>> => {
    const response = await api.get(`/recalls/distribution/${batchId}`);
    return response.data;
  },

  // Notify stakeholders
  notifyStakeholders: async (recallId: string): Promise<ApiResponse<any>> => {
    const response = await api.post(`/recalls/${recallId}/notify`);
    return response.data;
  },
};

// Anti-Counterfeiting API
export const counterfeitApi = {
  // Verify authenticity
  verifyAuthenticity: async (data: {
    batchId: string;
    verificationType: 'QR_SCAN' | 'HOLOGRAM_CHECK' | 'SERIAL_VERIFICATION';
    providedData: string;
    verifiedBy?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ApiResponse<{
    batchId: string;
    verificationType: string;
    isValid: boolean;
    verifiedAt: string;
  }>> => {
    const response = await api.post('/counterfeit/verify', data);
    return response.data;
  },

  // Report suspicious activity
  reportSuspiciousActivity: async (data: {
    batchId: string;
    reporterName: string;
    reporterEmail: string;
    reportType: 'SUSPICIOUS_PACKAGING' | 'INVALID_QR' | 'MISSING_HOLOGRAM' | 'OTHER';
    description: string;
    evidenceUrls: string[];
    location?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post('/counterfeit/report', data);
    return response.data;
  },

  // Get flagged batches
  getFlaggedBatches: async (): Promise<ApiResponse<FlaggedBatch[]>> => {
    const response = await api.get('/counterfeit/flagged');
    return response.data;
  },

  // Generate security features
  generateSecurityFeatures: async (data: {
    batchId: string;
    qrCodeHash: string;
    hologramId: string;
    serialNumber: string;
    securityPattern: string;
  }): Promise<ApiResponse<SecurityFeature>> => {
    const response = await api.post('/counterfeit/security-features', data);
    return response.data;
  },

  // Get security feature
  getSecurityFeature: async (batchId: string): Promise<ApiResponse<SecurityFeature>> => {
    const response = await api.get(`/counterfeit/security-features/${batchId}`);
    return response.data;
  },

  // Update report status
  updateReportStatus: async (reportId: string, data: {
    status: 'PENDING' | 'INVESTIGATING' | 'CONFIRMED' | 'FALSE_ALARM';
    investigatorNotes?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/counterfeit/reports/${reportId}/status`, data);
    return response.data;
  },

  // Get verification history
  getVerificationHistory: async (batchId: string): Promise<ApiResponse<VerificationRecord[]>> => {
    const response = await api.get(`/counterfeit/verification-history/${batchId}`);
    return response.data;
  },

  // Get all reports
  getAllReports: async (): Promise<ApiResponse<CounterfeitReport[]>> => {
    const response = await api.get('/counterfeit/reports');
    return response.data;
  },
};

// Health check
export const healthApi = {
  check: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;