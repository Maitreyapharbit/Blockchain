import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Recall, Batch, DistributionNode, RecallAction, PaginatedResponse } from '../types';
import { recallService } from '../utils/recallService';

interface RecallState {
  recalls: Recall[];
  currentRecall: Recall | null;
  affectedBatches: Batch[];
  distributionNodes: DistributionNode[];
  recallActions: RecallAction[];
  loading: {
    recalls: boolean;
    currentRecall: boolean;
    batches: boolean;
    distribution: boolean;
    actions: boolean;
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
    search: string;
  };
  stats: {
    total: number;
    active: number;
    completed: number;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
  } | null;
}

const initialState: RecallState = {
  recalls: [],
  currentRecall: null,
  affectedBatches: [],
  distributionNodes: [],
  recallActions: [],
  loading: {
    recalls: false,
    currentRecall: false,
    batches: false,
    distribution: false,
    actions: false,
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
    search: '',
  },
  stats: null,
};

// Async thunks
export const fetchRecalls = createAsyncThunk(
  'recall/fetchRecalls',
  async (params?: { page?: number; limit?: number; status?: string; severity?: string; search?: string }) => {
    const response = await recallService.getRecalls(params);
    return response;
  }
);

export const fetchRecallById = createAsyncThunk(
  'recall/fetchRecallById',
  async (id: string) => {
    const recall = await recallService.getRecallById(id);
    return recall;
  }
);

export const createRecall = createAsyncThunk(
  'recall/createRecall',
  async (recallData: Partial<Recall>) => {
    const recall = await recallService.createRecall(recallData);
    return recall;
  }
);

export const updateRecall = createAsyncThunk(
  'recall/updateRecall',
  async ({ id, updates }: { id: string; updates: Partial<Recall> }) => {
    const recall = await recallService.updateRecall(id, updates);
    return recall;
  }
);

export const fetchAffectedBatches = createAsyncThunk(
  'recall/fetchAffectedBatches',
  async (recallId: string) => {
    const batches = await recallService.getAffectedBatches(recallId);
    return batches;
  }
);

export const addBatchToRecall = createAsyncThunk(
  'recall/addBatchToRecall',
  async ({ recallId, batchId }: { recallId: string; batchId: string }) => {
    await recallService.addBatchToRecall(recallId, batchId);
    return batchId;
  }
);

export const removeBatchFromRecall = createAsyncThunk(
  'recall/removeBatchFromRecall',
  async ({ recallId, batchId }: { recallId: string; batchId: string }) => {
    await recallService.removeBatchFromRecall(recallId, batchId);
    return batchId;
  }
);

export const fetchDistributionNodes = createAsyncThunk(
  'recall/fetchDistributionNodes',
  async (recallId: string) => {
    const nodes = await recallService.getDistributionNodes(recallId);
    return nodes;
  }
);

export const updateDistributionNodeStatus = createAsyncThunk(
  'recall/updateDistributionNodeStatus',
  async ({ recallId, nodeId, status }: { recallId: string; nodeId: string; status: DistributionNode['status'] }) => {
    await recallService.updateDistributionNodeStatus(recallId, nodeId, status);
    return { nodeId, status };
  }
);

export const fetchRecallActions = createAsyncThunk(
  'recall/fetchRecallActions',
  async (recallId: string) => {
    const actions = await recallService.getRecallActions(recallId);
    return actions;
  }
);

export const createRecallAction = createAsyncThunk(
  'recall/createRecallAction',
  async ({ recallId, action }: { recallId: string; action: Partial<RecallAction> }) => {
    const newAction = await recallService.createRecallAction(recallId, action);
    return newAction;
  }
);

export const updateRecallAction = createAsyncThunk(
  'recall/updateRecallAction',
  async ({ recallId, actionId, updates }: { recallId: string; actionId: string; updates: Partial<RecallAction> }) => {
    const updatedAction = await recallService.updateRecallAction(recallId, actionId, updates);
    return updatedAction;
  }
);

export const sendRecallNotifications = createAsyncThunk(
  'recall/sendRecallNotifications',
  async ({ recallId, nodeIds }: { recallId: string; nodeIds: string[] }) => {
    await recallService.sendRecallNotifications(recallId, nodeIds);
    return nodeIds;
  }
);

export const fetchRecallStats = createAsyncThunk(
  'recall/fetchRecallStats',
  async () => {
    const stats = await recallService.getRecallStats();
    return stats;
  }
);

export const searchBatches = createAsyncThunk(
  'recall/searchBatches',
  async (query: string) => {
    const batches = await recallService.searchBatches(query);
    return batches;
  }
);

const recallSlice = createSlice({
  name: 'recall',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<RecallState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<Partial<RecallState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearCurrentRecall: (state) => {
      state.currentRecall = null;
      state.affectedBatches = [];
      state.distributionNodes = [];
      state.recallActions = [];
    },
    updateRecallInList: (state, action: PayloadAction<Recall>) => {
      const index = state.recalls.findIndex(recall => recall.id === action.payload.id);
      if (index !== -1) {
        state.recalls[index] = action.payload;
      }
    },
    updateBatchInList: (state, action: PayloadAction<Batch>) => {
      const index = state.affectedBatches.findIndex(batch => batch.id === action.payload.id);
      if (index !== -1) {
        state.affectedBatches[index] = action.payload;
      }
    },
    updateDistributionNodeInList: (state, action: PayloadAction<DistributionNode>) => {
      const index = state.distributionNodes.findIndex(node => node.id === action.payload.id);
      if (index !== -1) {
        state.distributionNodes[index] = action.payload;
      }
    },
    updateRecallActionInList: (state, action: PayloadAction<RecallAction>) => {
      const index = state.recallActions.findIndex(action => action.id === action.payload.id);
      if (index !== -1) {
        state.recallActions[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch recalls
    builder
      .addCase(fetchRecalls.pending, (state) => {
        state.loading.recalls = true;
        state.error = null;
      })
      .addCase(fetchRecalls.fulfilled, (state, action) => {
        state.loading.recalls = false;
        state.recalls = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          hasNext: action.payload.hasNext,
          hasPrev: action.payload.hasPrev,
        };
      })
      .addCase(fetchRecalls.rejected, (state, action) => {
        state.loading.recalls = false;
        state.error = action.error.message || 'Failed to fetch recalls';
      });

    // Fetch recall by ID
    builder
      .addCase(fetchRecallById.pending, (state) => {
        state.loading.currentRecall = true;
        state.error = null;
      })
      .addCase(fetchRecallById.fulfilled, (state, action) => {
        state.loading.currentRecall = false;
        state.currentRecall = action.payload;
      })
      .addCase(fetchRecallById.rejected, (state, action) => {
        state.loading.currentRecall = false;
        state.error = action.error.message || 'Failed to fetch recall';
      });

    // Create recall
    builder
      .addCase(createRecall.pending, (state) => {
        state.loading.recalls = true;
        state.error = null;
      })
      .addCase(createRecall.fulfilled, (state, action) => {
        state.loading.recalls = false;
        state.recalls.unshift(action.payload);
      })
      .addCase(createRecall.rejected, (state, action) => {
        state.loading.recalls = false;
        state.error = action.error.message || 'Failed to create recall';
      });

    // Update recall
    builder
      .addCase(updateRecall.pending, (state) => {
        state.loading.currentRecall = true;
        state.error = null;
      })
      .addCase(updateRecall.fulfilled, (state, action) => {
        state.loading.currentRecall = false;
        state.currentRecall = action.payload;
        const index = state.recalls.findIndex(recall => recall.id === action.payload.id);
        if (index !== -1) {
          state.recalls[index] = action.payload;
        }
      })
      .addCase(updateRecall.rejected, (state, action) => {
        state.loading.currentRecall = false;
        state.error = action.error.message || 'Failed to update recall';
      });

    // Fetch affected batches
    builder
      .addCase(fetchAffectedBatches.pending, (state) => {
        state.loading.batches = true;
        state.error = null;
      })
      .addCase(fetchAffectedBatches.fulfilled, (state, action) => {
        state.loading.batches = false;
        state.affectedBatches = action.payload;
      })
      .addCase(fetchAffectedBatches.rejected, (state, action) => {
        state.loading.batches = false;
        state.error = action.error.message || 'Failed to fetch affected batches';
      });

    // Add batch to recall
    builder
      .addCase(addBatchToRecall.fulfilled, (state, action) => {
        // Refresh affected batches
        // In a real app, you might want to add the batch directly to the list
      });

    // Remove batch from recall
    builder
      .addCase(removeBatchFromRecall.fulfilled, (state, action) => {
        state.affectedBatches = state.affectedBatches.filter(batch => batch.id !== action.payload);
      });

    // Fetch distribution nodes
    builder
      .addCase(fetchDistributionNodes.pending, (state) => {
        state.loading.distribution = true;
        state.error = null;
      })
      .addCase(fetchDistributionNodes.fulfilled, (state, action) => {
        state.loading.distribution = false;
        state.distributionNodes = action.payload;
      })
      .addCase(fetchDistributionNodes.rejected, (state, action) => {
        state.loading.distribution = false;
        state.error = action.error.message || 'Failed to fetch distribution nodes';
      });

    // Update distribution node status
    builder
      .addCase(updateDistributionNodeStatus.fulfilled, (state, action) => {
        const { nodeId, status } = action.payload;
        const node = state.distributionNodes.find(n => n.id === nodeId);
        if (node) {
          node.status = status;
        }
      });

    // Fetch recall actions
    builder
      .addCase(fetchRecallActions.pending, (state) => {
        state.loading.actions = true;
        state.error = null;
      })
      .addCase(fetchRecallActions.fulfilled, (state, action) => {
        state.loading.actions = false;
        state.recallActions = action.payload;
      })
      .addCase(fetchRecallActions.rejected, (state, action) => {
        state.loading.actions = false;
        state.error = action.error.message || 'Failed to fetch recall actions';
      });

    // Create recall action
    builder
      .addCase(createRecallAction.fulfilled, (state, action) => {
        state.recallActions.push(action.payload);
      });

    // Update recall action
    builder
      .addCase(updateRecallAction.fulfilled, (state, action) => {
        const index = state.recallActions.findIndex(action => action.id === action.payload.id);
        if (index !== -1) {
          state.recallActions[index] = action.payload;
        }
      });

    // Fetch recall stats
    builder
      .addCase(fetchRecallStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const {
  clearError,
  setFilters,
  setPagination,
  clearCurrentRecall,
  updateRecallInList,
  updateBatchInList,
  updateDistributionNodeInList,
  updateRecallActionInList,
} = recallSlice.actions;

export default recallSlice.reducer;