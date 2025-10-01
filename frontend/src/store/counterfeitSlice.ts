import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  CounterfeitReport, 
  SuspiciousActivity, 
  VerificationResult, 
  EvidenceFile,
  Batch,
  PaginatedResponse 
} from '../types';
import { counterfeitService } from '../utils/counterfeitService';

interface CounterfeitState {
  reports: CounterfeitReport[];
  currentReport: CounterfeitReport | null;
  suspiciousActivities: SuspiciousActivity[];
  verificationResults: VerificationResult[];
  currentBatch: Batch | null;
  securityFeatures: Batch['securityFeatures'];
  loading: {
    reports: boolean;
    currentReport: boolean;
    activities: boolean;
    verifications: boolean;
    batch: boolean;
    securityFeatures: boolean;
  };
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    status: string;
    severity: string;
    activityType: string;
    search: string;
    result: string;
    verificationType: string;
  };
  stats: {
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
  } | null;
  realTimeStatus: {
    isVerifying: boolean;
    lastVerification?: VerificationResult;
    verificationInProgress: boolean;
  } | null;
}

const initialState: CounterfeitState = {
  reports: [],
  currentReport: null,
  suspiciousActivities: [],
  verificationResults: [],
  currentBatch: null,
  securityFeatures: [],
  loading: {
    reports: false,
    currentReport: false,
    activities: false,
    verifications: false,
    batch: false,
    securityFeatures: false,
  },
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasNext: false,
    hasPrev: false,
  },
  filters: {
    status: '',
    severity: '',
    activityType: '',
    search: '',
    result: '',
    verificationType: '',
  },
  stats: null,
  realTimeStatus: null,
};

// Async thunks
export const fetchReports = createAsyncThunk(
  'counterfeit/fetchReports',
  async (params?: { page?: number; limit?: number; status?: string; severity?: string; search?: string }) => {
    const response = await counterfeitService.getReports(params);
    return response;
  }
);

export const fetchReportById = createAsyncThunk(
  'counterfeit/fetchReportById',
  async (id: string) => {
    const report = await counterfeitService.getReportById(id);
    return report;
  }
);

export const createReport = createAsyncThunk(
  'counterfeit/createReport',
  async (reportData: Partial<CounterfeitReport>) => {
    const report = await counterfeitService.createReport(reportData);
    return report;
  }
);

export const updateReport = createAsyncThunk(
  'counterfeit/updateReport',
  async ({ id, updates }: { id: string; updates: Partial<CounterfeitReport> }) => {
    const report = await counterfeitService.updateReport(id, updates);
    return report;
  }
);

export const uploadEvidence = createAsyncThunk(
  'counterfeit/uploadEvidence',
  async ({ reportId, file }: { reportId: string; file: File }) => {
    const evidence = await counterfeitService.uploadEvidence(reportId, file);
    return { reportId, evidence };
  }
);

export const deleteEvidence = createAsyncThunk(
  'counterfeit/deleteEvidence',
  async ({ reportId, evidenceId }: { reportId: string; evidenceId: string }) => {
    await counterfeitService.deleteEvidence(reportId, evidenceId);
    return { reportId, evidenceId };
  }
);

export const fetchSuspiciousActivities = createAsyncThunk(
  'counterfeit/fetchSuspiciousActivities',
  async (params?: { page?: number; limit?: number; status?: string; severity?: string; activityType?: string }) => {
    const response = await counterfeitService.getSuspiciousActivities(params);
    return response;
  }
);

export const fetchSuspiciousActivityById = createAsyncThunk(
  'counterfeit/fetchSuspiciousActivityById',
  async (id: string) => {
    const activity = await counterfeitService.getSuspiciousActivityById(id);
    return activity;
  }
);

export const updateSuspiciousActivityStatus = createAsyncThunk(
  'counterfeit/updateSuspiciousActivityStatus',
  async ({ id, status }: { id: string; status: SuspiciousActivity['status'] }) => {
    const activity = await counterfeitService.updateSuspiciousActivityStatus(id, status);
    return activity;
  }
);

export const verifyBatch = createAsyncThunk(
  'counterfeit/verifyBatch',
  async ({ batchId, verificationType }: { batchId: string; verificationType: VerificationResult['verificationType'] }) => {
    const result = await counterfeitService.verifyBatch(batchId, verificationType);
    return result;
  }
);

export const fetchVerificationHistory = createAsyncThunk(
  'counterfeit/fetchVerificationHistory',
  async (batchId: string) => {
    const history = await counterfeitService.getVerificationHistory(batchId);
    return { batchId, history };
  }
);

export const fetchVerificationResults = createAsyncThunk(
  'counterfeit/fetchVerificationResults',
  async (params?: { page?: number; limit?: number; result?: string; verificationType?: string; batchId?: string }) => {
    const response = await counterfeitService.getVerificationResults(params);
    return response;
  }
);

export const scanQRCode = createAsyncThunk(
  'counterfeit/scanQRCode',
  async (qrData: string) => {
    const result = await counterfeitService.scanQRCode(qrData);
    return result;
  }
);

export const verifyHologram = createAsyncThunk(
  'counterfeit/verifyHologram',
  async ({ batchId, hologramData }: { batchId: string; hologramData: string }) => {
    const result = await counterfeitService.verifyHologram(batchId, hologramData);
    return result;
  }
);

export const verifySerialNumber = createAsyncThunk(
  'counterfeit/verifySerialNumber',
  async ({ batchId, serialNumber }: { batchId: string; serialNumber: string }) => {
    const result = await counterfeitService.verifySerialNumber(batchId, serialNumber);
    return result;
  }
);

export const fetchCounterfeitStats = createAsyncThunk(
  'counterfeit/fetchCounterfeitStats',
  async () => {
    const stats = await counterfeitService.getCounterfeitStats();
    return stats;
  }
);

export const fetchBatchSecurityFeatures = createAsyncThunk(
  'counterfeit/fetchBatchSecurityFeatures',
  async (batchId: string) => {
    const features = await counterfeitService.getBatchSecurityFeatures(batchId);
    return { batchId, features };
  }
);

export const generateQRCode = createAsyncThunk(
  'counterfeit/generateQRCode',
  async (batchId: string) => {
    const result = await counterfeitService.generateQRCode(batchId);
    return { batchId, ...result };
  }
);

export const fetchRealTimeVerificationStatus = createAsyncThunk(
  'counterfeit/fetchRealTimeVerificationStatus',
  async (batchId: string) => {
    const status = await counterfeitService.getRealTimeVerificationStatus(batchId);
    return { batchId, ...status };
  }
);

const counterfeitSlice = createSlice({
  name: 'counterfeit',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<CounterfeitState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<Partial<CounterfeitState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearCurrentReport: (state) => {
      state.currentReport = null;
    },
    clearCurrentBatch: (state) => {
      state.currentBatch = null;
      state.securityFeatures = [];
      state.verificationResults = [];
    },
    updateReportInList: (state, action: PayloadAction<CounterfeitReport>) => {
      const index = state.reports.findIndex(report => report.id === action.payload.id);
      if (index !== -1) {
        state.reports[index] = action.payload;
      }
    },
    updateSuspiciousActivityInList: (state, action: PayloadAction<SuspiciousActivity>) => {
      const index = state.suspiciousActivities.findIndex(activity => activity.id === action.payload.id);
      if (index !== -1) {
        state.suspiciousActivities[index] = action.payload;
      }
    },
    addVerificationResult: (state, action: PayloadAction<VerificationResult>) => {
      state.verificationResults.unshift(action.payload);
    },
    updateRealTimeStatus: (state, action: PayloadAction<Partial<CounterfeitState['realTimeStatus']>>) => {
      if (state.realTimeStatus) {
        state.realTimeStatus = { ...state.realTimeStatus, ...action.payload };
      } else {
        state.realTimeStatus = action.payload as CounterfeitState['realTimeStatus'];
      }
    },
    setCurrentBatch: (state, action: PayloadAction<Batch>) => {
      state.currentBatch = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch reports
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading.reports = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading.reports = false;
        state.reports = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          hasNext: action.payload.hasNext,
          hasPrev: action.payload.hasPrev,
        };
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading.reports = false;
        state.error = action.error.message || 'Failed to fetch reports';
      });

    // Fetch report by ID
    builder
      .addCase(fetchReportById.pending, (state) => {
        state.loading.currentReport = true;
        state.error = null;
      })
      .addCase(fetchReportById.fulfilled, (state, action) => {
        state.loading.currentReport = false;
        state.currentReport = action.payload;
      })
      .addCase(fetchReportById.rejected, (state, action) => {
        state.loading.currentReport = false;
        state.error = action.error.message || 'Failed to fetch report';
      });

    // Create report
    builder
      .addCase(createReport.pending, (state) => {
        state.loading.reports = true;
        state.error = null;
      })
      .addCase(createReport.fulfilled, (state, action) => {
        state.loading.reports = false;
        state.reports.unshift(action.payload);
      })
      .addCase(createReport.rejected, (state, action) => {
        state.loading.reports = false;
        state.error = action.error.message || 'Failed to create report';
      });

    // Update report
    builder
      .addCase(updateReport.pending, (state) => {
        state.loading.currentReport = true;
        state.error = null;
      })
      .addCase(updateReport.fulfilled, (state, action) => {
        state.loading.currentReport = false;
        state.currentReport = action.payload;
        const index = state.reports.findIndex(report => report.id === action.payload.id);
        if (index !== -1) {
          state.reports[index] = action.payload;
        }
      })
      .addCase(updateReport.rejected, (state, action) => {
        state.loading.currentReport = false;
        state.error = action.error.message || 'Failed to update report';
      });

    // Upload evidence
    builder
      .addCase(uploadEvidence.fulfilled, (state, action) => {
        const { reportId, evidence } = action.payload;
        const report = state.reports.find(r => r.id === reportId);
        if (report) {
          report.evidence.push(evidence);
        }
        if (state.currentReport && state.currentReport.id === reportId) {
          state.currentReport.evidence.push(evidence);
        }
      });

    // Delete evidence
    builder
      .addCase(deleteEvidence.fulfilled, (state, action) => {
        const { reportId, evidenceId } = action.payload;
        const report = state.reports.find(r => r.id === reportId);
        if (report) {
          report.evidence = report.evidence.filter(e => e.id !== evidenceId);
        }
        if (state.currentReport && state.currentReport.id === reportId) {
          state.currentReport.evidence = state.currentReport.evidence.filter(e => e.id !== evidenceId);
        }
      });

    // Fetch suspicious activities
    builder
      .addCase(fetchSuspiciousActivities.pending, (state) => {
        state.loading.activities = true;
        state.error = null;
      })
      .addCase(fetchSuspiciousActivities.fulfilled, (state, action) => {
        state.loading.activities = false;
        state.suspiciousActivities = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          hasNext: action.payload.hasNext,
          hasPrev: action.payload.hasPrev,
        };
      })
      .addCase(fetchSuspiciousActivities.rejected, (state, action) => {
        state.loading.activities = false;
        state.error = action.error.message || 'Failed to fetch suspicious activities';
      });

    // Update suspicious activity status
    builder
      .addCase(updateSuspiciousActivityStatus.fulfilled, (state, action) => {
        const index = state.suspiciousActivities.findIndex(activity => activity.id === action.payload.id);
        if (index !== -1) {
          state.suspiciousActivities[index] = action.payload;
        }
      });

    // Verify batch
    builder
      .addCase(verifyBatch.pending, (state) => {
        state.loading.verifications = true;
        state.error = null;
      })
      .addCase(verifyBatch.fulfilled, (state, action) => {
        state.loading.verifications = false;
        state.verificationResults.unshift(action.payload);
      })
      .addCase(verifyBatch.rejected, (state, action) => {
        state.loading.verifications = false;
        state.error = action.error.message || 'Failed to verify batch';
      });

    // Fetch verification history
    builder
      .addCase(fetchVerificationHistory.pending, (state) => {
        state.loading.verifications = true;
        state.error = null;
      })
      .addCase(fetchVerificationHistory.fulfilled, (state, action) => {
        state.loading.verifications = false;
        state.verificationResults = action.payload.history;
      })
      .addCase(fetchVerificationHistory.rejected, (state, action) => {
        state.loading.verifications = false;
        state.error = action.error.message || 'Failed to fetch verification history';
      });

    // Fetch verification results
    builder
      .addCase(fetchVerificationResults.pending, (state) => {
        state.loading.verifications = true;
        state.error = null;
      })
      .addCase(fetchVerificationResults.fulfilled, (state, action) => {
        state.loading.verifications = false;
        state.verificationResults = action.payload.data;
      })
      .addCase(fetchVerificationResults.rejected, (state, action) => {
        state.loading.verifications = false;
        state.error = action.error.message || 'Failed to fetch verification results';
      });

    // Scan QR code
    builder
      .addCase(scanQRCode.pending, (state) => {
        state.loading.batch = true;
        state.error = null;
      })
      .addCase(scanQRCode.fulfilled, (state, action) => {
        state.loading.batch = false;
        state.currentBatch = action.payload.batch;
        state.verificationResults.unshift(action.payload.verificationResult);
      })
      .addCase(scanQRCode.rejected, (state, action) => {
        state.loading.batch = false;
        state.error = action.error.message || 'Failed to scan QR code';
      });

    // Verify hologram
    builder
      .addCase(verifyHologram.fulfilled, (state, action) => {
        state.verificationResults.unshift(action.payload);
      });

    // Verify serial number
    builder
      .addCase(verifySerialNumber.fulfilled, (state, action) => {
        state.verificationResults.unshift(action.payload);
      });

    // Fetch counterfeit stats
    builder
      .addCase(fetchCounterfeitStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });

    // Fetch batch security features
    builder
      .addCase(fetchBatchSecurityFeatures.pending, (state) => {
        state.loading.securityFeatures = true;
        state.error = null;
      })
      .addCase(fetchBatchSecurityFeatures.fulfilled, (state, action) => {
        state.loading.securityFeatures = false;
        state.securityFeatures = action.payload.features;
      })
      .addCase(fetchBatchSecurityFeatures.rejected, (state, action) => {
        state.loading.securityFeatures = false;
        state.error = action.error.message || 'Failed to fetch security features';
      });

    // Fetch real-time verification status
    builder
      .addCase(fetchRealTimeVerificationStatus.fulfilled, (state, action) => {
        state.realTimeStatus = {
          isVerifying: action.payload.isVerifying,
          lastVerification: action.payload.lastVerification,
          verificationInProgress: action.payload.verificationInProgress,
        };
      });
  },
});

export const {
  clearError,
  setFilters,
  setPagination,
  clearCurrentReport,
  clearCurrentBatch,
  updateReportInList,
  updateSuspiciousActivityInList,
  addVerificationResult,
  updateRealTimeStatus,
  setCurrentBatch,
} = counterfeitSlice.actions;

export default counterfeitSlice.reducer;