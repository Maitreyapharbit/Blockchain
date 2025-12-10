import axios from 'axios';
import { supabase } from '../config/supabase';
import { Recall, Batch, DistributionNode, RecallAction, ApiResponse, PaginatedResponse } from '../types';

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

export const recallService = {
  // Get all recalls with pagination and filters
  async getRecalls(params?: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: string;
    search?: string;
  }): Promise<PaginatedResponse<Recall>> {
    try {
      const response = await api.get('/recalls', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching recalls:', error);
      throw new Error('Failed to fetch recalls');
    }
  },

  // Get single recall by ID
  async getRecallById(id: string): Promise<Recall> {
    try {
      const response = await api.get(`/recalls/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching recall:', error);
      throw new Error('Failed to fetch recall');
    }
  },

  // Create new recall
  async createRecall(recallData: Partial<Recall>): Promise<Recall> {
    try {
      const response = await api.post('/recalls', recallData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating recall:', error);
      throw new Error('Failed to create recall');
    }
  },

  // Update recall
  async updateRecall(id: string, updates: Partial<Recall>): Promise<Recall> {
    try {
      const response = await api.put(`/recalls/${id}`, updates);
      return response.data.data;
    } catch (error) {
      console.error('Error updating recall:', error);
      throw new Error('Failed to update recall');
    }
  },

  // Get affected batches for a recall
  async getAffectedBatches(recallId: string): Promise<Batch[]> {
    try {
      const response = await api.get(`/recalls/${recallId}/batches`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching affected batches:', error);
      throw new Error('Failed to fetch affected batches');
    }
  },

  // Add batch to recall
  async addBatchToRecall(recallId: string, batchId: string): Promise<void> {
    try {
      await api.post(`/recalls/${recallId}/batches`, { batchId });
    } catch (error) {
      console.error('Error adding batch to recall:', error);
      throw new Error('Failed to add batch to recall');
    }
  },

  // Remove batch from recall
  async removeBatchFromRecall(recallId: string, batchId: string): Promise<void> {
    try {
      await api.delete(`/recalls/${recallId}/batches/${batchId}`);
    } catch (error) {
      console.error('Error removing batch from recall:', error);
      throw new Error('Failed to remove batch from recall');
    }
  },

  // Get distribution nodes for a recall
  async getDistributionNodes(recallId: string): Promise<DistributionNode[]> {
    try {
      const response = await api.get(`/recalls/${recallId}/distribution`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching distribution nodes:', error);
      throw new Error('Failed to fetch distribution nodes');
    }
  },

  // Update distribution node status
  async updateDistributionNodeStatus(
    recallId: string,
    nodeId: string,
    status: DistributionNode['status']
  ): Promise<void> {
    try {
      await api.put(`/recalls/${recallId}/distribution/${nodeId}`, { status });
    } catch (error) {
      console.error('Error updating distribution node status:', error);
      throw new Error('Failed to update distribution node status');
    }
  },

  // Get recall actions
  async getRecallActions(recallId: string): Promise<RecallAction[]> {
    try {
      const response = await api.get(`/recalls/${recallId}/actions`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching recall actions:', error);
      throw new Error('Failed to fetch recall actions');
    }
  },

  // Create recall action
  async createRecallAction(recallId: string, action: Partial<RecallAction>): Promise<RecallAction> {
    try {
      const response = await api.post(`/recalls/${recallId}/actions`, action);
      return response.data.data;
    } catch (error) {
      console.error('Error creating recall action:', error);
      throw new Error('Failed to create recall action');
    }
  },

  // Update recall action
  async updateRecallAction(
    recallId: string,
    actionId: string,
    updates: Partial<RecallAction>
  ): Promise<RecallAction> {
    try {
      const response = await api.put(`/recalls/${recallId}/actions/${actionId}`, updates);
      return response.data.data;
    } catch (error) {
      console.error('Error updating recall action:', error);
      throw new Error('Failed to update recall action');
    }
  },

  // Send notifications for recall
  async sendRecallNotifications(recallId: string, nodeIds: string[]): Promise<void> {
    try {
      await api.post(`/recalls/${recallId}/notify`, { nodeIds });
    } catch (error) {
      console.error('Error sending recall notifications:', error);
      throw new Error('Failed to send recall notifications');
    }
  },

  // Get recall statistics
  async getRecallStats(): Promise<{
    total: number;
    active: number;
    completed: number;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    try {
      const response = await api.get('/recalls/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching recall stats:', error);
      throw new Error('Failed to fetch recall statistics');
    }
  },

  // Search batches
  async searchBatches(query: string): Promise<Batch[]> {
    try {
      const response = await api.get('/batches/search', { params: { q: query } });
      return response.data.data;
    } catch (error) {
      console.error('Error searching batches:', error);
      throw new Error('Failed to search batches');
    }
  },

  // Get batch details
  async getBatchById(id: string): Promise<Batch> {
    try {
      const response = await api.get(`/batches/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching batch:', error);
      throw new Error('Failed to fetch batch');
    }
  },

  // Update batch status
  async updateBatchStatus(id: string, status: Batch['status']): Promise<Batch> {
    try {
      const response = await api.put(`/batches/${id}/status`, { status });
      return response.data.data;
    } catch (error) {
      console.error('Error updating batch status:', error);
      throw new Error('Failed to update batch status');
    }
  },
};

export default recallService;