// Core types for pharmaceutical blockchain system

export interface Batch {
  id: string;
  productName: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  quantity: number;
  location: string;
  status: 'active' | 'recalled' | 'quarantined' | 'destroyed';
  blockchainHash: string;
  securityFeatures: SecurityFeature[];
}

export interface SecurityFeature {
  id: string;
  type: 'qr_code' | 'hologram' | 'serial_number' | 'tamper_evident';
  value: string;
  verified: boolean;
  verificationDate?: string;
}

export interface Recall {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'initiated' | 'in_progress' | 'completed' | 'cancelled';
  affectedBatches: string[];
  initiatedBy: string;
  initiatedDate: string;
  completionDate?: string;
  reason: string;
  actions: RecallAction[];
}

export interface RecallAction {
  id: string;
  type: 'notification' | 'quarantine' | 'return' | 'destroy';
  description: string;
  status: 'pending' | 'completed' | 'failed';
  assignedTo: string;
  dueDate: string;
  completedDate?: string;
}

export interface DistributionNode {
  id: string;
  name: string;
  type: 'manufacturer' | 'distributor' | 'pharmacy' | 'hospital' | 'clinic';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  contactInfo: {
    phone: string;
    email: string;
    contactPerson: string;
  };
  affectedBatches: string[];
  status: 'notified' | 'responding' | 'completed' | 'non_compliant';
}

export interface Notification {
  id: string;
  type: 'recall' | 'counterfeit' | 'verification' | 'system';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: string;
  read: boolean;
  actionRequired: boolean;
  relatedId?: string;
}

export interface CounterfeitReport {
  id: string;
  batchId: string;
  productName: string;
  reportedBy: string;
  reportDate: string;
  description: string;
  evidence: EvidenceFile[];
  status: 'pending' | 'investigating' | 'verified' | 'false_positive' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  verificationResults?: VerificationResult[];
}

export interface EvidenceFile {
  id: string;
  filename: string;
  type: 'image' | 'video' | 'document';
  url: string;
  uploadedAt: string;
  size: number;
}

export interface VerificationResult {
  id: string;
  batchId: string;
  verificationType: 'qr_scan' | 'hologram_check' | 'serial_validation' | 'blockchain_verify';
  result: 'authentic' | 'counterfeit' | 'suspicious' | 'error';
  confidence: number;
  timestamp: string;
  details: string;
  verifiedBy: string;
}

export interface SuspiciousActivity {
  id: string;
  batchId: string;
  activityType: 'unusual_pattern' | 'failed_verification' | 'location_mismatch' | 'timing_anomaly';
  description: string;
  detectedAt: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  metadata: Record<string, any>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manufacturer' | 'distributor' | 'pharmacy' | 'regulator';
  organization: string;
  permissions: string[];
  lastLogin: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Component Props Types
export interface RecallDashboardProps {
  recalls: Recall[];
  loading: boolean;
  error?: string;
  onRefresh: () => void;
  onRecallClick: (recallId: string) => void;
}

export interface RecallInitiationProps {
  onSubmit: (recallData: Partial<Recall>) => void;
  loading: boolean;
  error?: string;
}

export interface AffectedBatchListProps {
  batches: Batch[];
  recallId: string;
  onBatchSelect: (batchId: string) => void;
  onBatchAction: (batchId: string, action: string) => void;
  loading: boolean;
}

export interface DistributionTrackerProps {
  nodes: DistributionNode[];
  affectedBatches: string[];
  onNodeClick: (nodeId: string) => void;
  onStatusUpdate: (nodeId: string, status: DistributionNode['status']) => void;
  loading: boolean;
}

export interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onActionClick: (notificationId: string, action: string) => void;
  loading: boolean;
}

export interface RecallStatusCardProps {
  recall: Recall;
  onActionClick: (action: string) => void;
  compact?: boolean;
}

export interface CounterfeitDashboardProps {
  reports: CounterfeitReport[];
  activities: SuspiciousActivity[];
  loading: boolean;
  error?: string;
  onRefresh: () => void;
  onReportClick: (reportId: string) => void;
}

export interface SecurityFeatureVerifierProps {
  batchId: string;
  onVerificationComplete: (result: VerificationResult) => void;
  loading: boolean;
}

export interface ReportingFormProps {
  onSubmit: (reportData: Partial<CounterfeitReport>) => void;
  loading: boolean;
  error?: string;
}

export interface BatchAuthenticityProps {
  batch: Batch;
  verificationHistory: VerificationResult[];
  onVerify: () => void;
  loading: boolean;
}

export interface SuspiciousActivityListProps {
  activities: SuspiciousActivity[];
  onActivityClick: (activityId: string) => void;
  onStatusUpdate: (activityId: string, status: SuspiciousActivity['status']) => void;
  loading: boolean;
}

export interface VerificationHistoryProps {
  verifications: VerificationResult[];
  onVerificationClick: (verificationId: string) => void;
  loading: boolean;
}