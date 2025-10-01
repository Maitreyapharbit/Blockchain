// Common types for the pharmaceutical blockchain system

export interface Recall {
  recallId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  status: 'ACTIVE' | 'RESOLVED' | 'CANCELLED';
  initiatedBy: string;
  initiatedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  batchCount: number;
  batches?: RecallBatch[];
}

export interface RecallBatch {
  batchId: string;
  productName: string;
  lotNumber: string;
  expiryDate: string;
  quantityAffected: number;
}

export interface DistributionRecord {
  distributorName: string;
  distributorAddress: string;
  quantityShipped: number;
  shippedDate: string;
  receivedDate?: string;
  status: 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED';
  blockchainTxHash?: string;
}

export interface SecurityFeature {
  batchId: string;
  qrCodeHash: string;
  hologramId: string;
  serialNumber: string;
  securityPattern: string;
  createdAt: string;
  isActive: boolean;
}

export interface VerificationRecord {
  id: string;
  verificationType: 'QR_SCAN' | 'HOLOGRAM_CHECK' | 'SERIAL_VERIFICATION';
  result: boolean;
  details: any;
  verifiedBy?: string;
  verifiedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface CounterfeitReport {
  id: string;
  batchId: string;
  reporterName: string;
  reporterEmail: string;
  reportType: 'SUSPICIOUS_PACKAGING' | 'INVALID_QR' | 'MISSING_HOLOGRAM' | 'OTHER';
  description: string;
  evidenceUrls: string[];
  location?: string;
  status: 'PENDING' | 'INVESTIGATING' | 'CONFIRMED' | 'FALSE_ALARM';
  investigatorNotes?: string;
  reportedAt: string;
  resolvedAt?: string;
}

export interface FlaggedBatch {
  batchId: string;
  securityFeature?: SecurityFeature;
  recentVerifications: VerificationRecord[];
  reports: CounterfeitReport[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  webhook: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANUFACTURER' | 'DISTRIBUTOR' | 'PHARMACIST' | 'INVESTIGATOR';
  permissions: string[];
  notificationSettings: NotificationSettings;
}