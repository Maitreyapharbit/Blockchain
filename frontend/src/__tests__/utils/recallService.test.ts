import { recallService } from '../../utils/recallService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('recallService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockedAxios);
  });

  describe('getRecalls', () => {
    it('should fetch recalls successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: '1',
              title: 'Test Recall',
              description: 'Test description',
              severity: 'high',
              status: 'in_progress',
              affectedBatches: ['batch1'],
              initiatedBy: 'Test User',
              initiatedDate: '2023-01-01T00:00:00Z',
              reason: 'Test reason',
              actions: [],
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await recallService.getRecalls();

      expect(mockedAxios.get).toHaveBeenCalledWith('/recalls', { params: undefined });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors', async () => {
      const errorMessage = 'Network Error';
      mockedAxios.get.mockRejectedValue(new Error(errorMessage));

      await expect(recallService.getRecalls()).rejects.toThrow('Failed to fetch recalls');
    });
  });

  describe('getRecallById', () => {
    it('should fetch single recall successfully', async () => {
      const mockRecall = {
        id: '1',
        title: 'Test Recall',
        description: 'Test description',
        severity: 'high',
        status: 'in_progress',
        affectedBatches: ['batch1'],
        initiatedBy: 'Test User',
        initiatedDate: '2023-01-01T00:00:00Z',
        reason: 'Test reason',
        actions: [],
      };

      const mockResponse = {
        data: {
          data: mockRecall,
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await recallService.getRecallById('1');

      expect(mockedAxios.get).toHaveBeenCalledWith('/recalls/1');
      expect(result).toEqual(mockRecall);
    });

    it('should handle errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(recallService.getRecallById('1')).rejects.toThrow('Failed to fetch recall');
    });
  });

  describe('createRecall', () => {
    it('should create recall successfully', async () => {
      const recallData = {
        title: 'Test Recall',
        description: 'Test description',
        severity: 'high',
        reason: 'Test reason',
      };

      const mockRecall = {
        id: '1',
        ...recallData,
        status: 'initiated',
        affectedBatches: [],
        initiatedBy: 'Test User',
        initiatedDate: '2023-01-01T00:00:00Z',
        actions: [],
      };

      const mockResponse = {
        data: {
          data: mockRecall,
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await recallService.createRecall(recallData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/recalls', recallData);
      expect(result).toEqual(mockRecall);
    });

    it('should handle errors', async () => {
      const recallData = {
        title: 'Test Recall',
        description: 'Test description',
        severity: 'high',
        reason: 'Test reason',
      };

      mockedAxios.post.mockRejectedValue(new Error('Network Error'));

      await expect(recallService.createRecall(recallData)).rejects.toThrow('Failed to create recall');
    });
  });

  describe('updateRecall', () => {
    it('should update recall successfully', async () => {
      const updates = {
        status: 'completed',
        completionDate: '2023-01-02T00:00:00Z',
      };

      const mockRecall = {
        id: '1',
        title: 'Test Recall',
        description: 'Test description',
        severity: 'high',
        status: 'completed',
        affectedBatches: ['batch1'],
        initiatedBy: 'Test User',
        initiatedDate: '2023-01-01T00:00:00Z',
        completionDate: '2023-01-02T00:00:00Z',
        reason: 'Test reason',
        actions: [],
      };

      const mockResponse = {
        data: {
          data: mockRecall,
        },
      };

      mockedAxios.put.mockResolvedValue(mockResponse);

      const result = await recallService.updateRecall('1', updates);

      expect(mockedAxios.put).toHaveBeenCalledWith('/recalls/1', updates);
      expect(result).toEqual(mockRecall);
    });

    it('should handle errors', async () => {
      const updates = {
        status: 'completed',
      };

      mockedAxios.put.mockRejectedValue(new Error('Network Error'));

      await expect(recallService.updateRecall('1', updates)).rejects.toThrow('Failed to update recall');
    });
  });

  describe('getAffectedBatches', () => {
    it('should fetch affected batches successfully', async () => {
      const mockBatches = [
        {
          id: 'batch1',
          productName: 'Test Product',
          batchNumber: 'BATCH001',
          manufacturingDate: '2023-01-01T00:00:00Z',
          expiryDate: '2024-01-01T00:00:00Z',
          quantity: 1000,
          location: 'Test Location',
          status: 'active',
          blockchainHash: 'test-hash',
          securityFeatures: [],
        },
      ];

      const mockResponse = {
        data: {
          data: mockBatches,
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await recallService.getAffectedBatches('1');

      expect(mockedAxios.get).toHaveBeenCalledWith('/recalls/1/batches');
      expect(result).toEqual(mockBatches);
    });

    it('should handle errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(recallService.getAffectedBatches('1')).rejects.toThrow('Failed to fetch affected batches');
    });
  });

  describe('addBatchToRecall', () => {
    it('should add batch to recall successfully', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} });

      await recallService.addBatchToRecall('1', 'batch1');

      expect(mockedAxios.post).toHaveBeenCalledWith('/recalls/1/batches', { batchId: 'batch1' });
    });

    it('should handle errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network Error'));

      await expect(recallService.addBatchToRecall('1', 'batch1')).rejects.toThrow('Failed to add batch to recall');
    });
  });

  describe('removeBatchFromRecall', () => {
    it('should remove batch from recall successfully', async () => {
      mockedAxios.delete.mockResolvedValue({ data: {} });

      await recallService.removeBatchFromRecall('1', 'batch1');

      expect(mockedAxios.delete).toHaveBeenCalledWith('/recalls/1/batches/batch1');
    });

    it('should handle errors', async () => {
      mockedAxios.delete.mockRejectedValue(new Error('Network Error'));

      await expect(recallService.removeBatchFromRecall('1', 'batch1')).rejects.toThrow('Failed to remove batch from recall');
    });
  });

  describe('getDistributionNodes', () => {
    it('should fetch distribution nodes successfully', async () => {
      const mockNodes = [
        {
          id: 'node1',
          name: 'Test Node',
          type: 'pharmacy',
          location: {
            latitude: 40.7128,
            longitude: -74.0060,
            address: 'Test Address',
          },
          contactInfo: {
            phone: '123-456-7890',
            email: 'test@example.com',
            contactPerson: 'Test Person',
          },
          affectedBatches: ['batch1'],
          status: 'notified',
        },
      ];

      const mockResponse = {
        data: {
          data: mockNodes,
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await recallService.getDistributionNodes('1');

      expect(mockedAxios.get).toHaveBeenCalledWith('/recalls/1/distribution');
      expect(result).toEqual(mockNodes);
    });

    it('should handle errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(recallService.getDistributionNodes('1')).rejects.toThrow('Failed to fetch distribution nodes');
    });
  });

  describe('updateDistributionNodeStatus', () => {
    it('should update distribution node status successfully', async () => {
      mockedAxios.put.mockResolvedValue({ data: {} });

      await recallService.updateDistributionNodeStatus('1', 'node1', 'responding');

      expect(mockedAxios.put).toHaveBeenCalledWith('/recalls/1/distribution/node1', { status: 'responding' });
    });

    it('should handle errors', async () => {
      mockedAxios.put.mockRejectedValue(new Error('Network Error'));

      await expect(recallService.updateDistributionNodeStatus('1', 'node1', 'responding')).rejects.toThrow('Failed to update distribution node status');
    });
  });

  describe('getRecallActions', () => {
    it('should fetch recall actions successfully', async () => {
      const mockActions = [
        {
          id: 'action1',
          type: 'notification',
          description: 'Send notification',
          status: 'completed',
          assignedTo: 'Test User',
          dueDate: '2023-01-01T00:00:00Z',
          completedDate: '2023-01-01T00:00:00Z',
        },
      ];

      const mockResponse = {
        data: {
          data: mockActions,
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await recallService.getRecallActions('1');

      expect(mockedAxios.get).toHaveBeenCalledWith('/recalls/1/actions');
      expect(result).toEqual(mockActions);
    });

    it('should handle errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(recallService.getRecallActions('1')).rejects.toThrow('Failed to fetch recall actions');
    });
  });

  describe('createRecallAction', () => {
    it('should create recall action successfully', async () => {
      const actionData = {
        type: 'notification',
        description: 'Send notification',
        assignedTo: 'Test User',
        dueDate: '2023-01-01T00:00:00Z',
      };

      const mockAction = {
        id: 'action1',
        ...actionData,
        status: 'pending',
      };

      const mockResponse = {
        data: {
          data: mockAction,
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await recallService.createRecallAction('1', actionData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/recalls/1/actions', actionData);
      expect(result).toEqual(mockAction);
    });

    it('should handle errors', async () => {
      const actionData = {
        type: 'notification',
        description: 'Send notification',
        assignedTo: 'Test User',
        dueDate: '2023-01-01T00:00:00Z',
      };

      mockedAxios.post.mockRejectedValue(new Error('Network Error'));

      await expect(recallService.createRecallAction('1', actionData)).rejects.toThrow('Failed to create recall action');
    });
  });

  describe('updateRecallAction', () => {
    it('should update recall action successfully', async () => {
      const updates = {
        status: 'completed',
        completedDate: '2023-01-01T00:00:00Z',
      };

      const mockAction = {
        id: 'action1',
        type: 'notification',
        description: 'Send notification',
        status: 'completed',
        assignedTo: 'Test User',
        dueDate: '2023-01-01T00:00:00Z',
        completedDate: '2023-01-01T00:00:00Z',
      };

      const mockResponse = {
        data: {
          data: mockAction,
        },
      };

      mockedAxios.put.mockResolvedValue(mockResponse);

      const result = await recallService.updateRecallAction('1', 'action1', updates);

      expect(mockedAxios.put).toHaveBeenCalledWith('/recalls/1/actions/action1', updates);
      expect(result).toEqual(mockAction);
    });

    it('should handle errors', async () => {
      const updates = {
        status: 'completed',
      };

      mockedAxios.put.mockRejectedValue(new Error('Network Error'));

      await expect(recallService.updateRecallAction('1', 'action1', updates)).rejects.toThrow('Failed to update recall action');
    });
  });

  describe('sendRecallNotifications', () => {
    it('should send recall notifications successfully', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} });

      await recallService.sendRecallNotifications('1', ['node1', 'node2']);

      expect(mockedAxios.post).toHaveBeenCalledWith('/recalls/1/notify', { nodeIds: ['node1', 'node2'] });
    });

    it('should handle errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network Error'));

      await expect(recallService.sendRecallNotifications('1', ['node1'])).rejects.toThrow('Failed to send recall notifications');
    });
  });

  describe('getRecallStats', () => {
    it('should fetch recall stats successfully', async () => {
      const mockStats = {
        total: 10,
        active: 5,
        completed: 3,
        bySeverity: { high: 2, medium: 3, low: 5 },
        byStatus: { in_progress: 5, completed: 3, cancelled: 2 },
      };

      const mockResponse = {
        data: {
          data: mockStats,
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await recallService.getRecallStats();

      expect(mockedAxios.get).toHaveBeenCalledWith('/recalls/stats');
      expect(result).toEqual(mockStats);
    });

    it('should handle errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(recallService.getRecallStats()).rejects.toThrow('Failed to fetch recall statistics');
    });
  });

  describe('searchBatches', () => {
    it('should search batches successfully', async () => {
      const mockBatches = [
        {
          id: 'batch1',
          productName: 'Test Product',
          batchNumber: 'BATCH001',
          manufacturingDate: '2023-01-01T00:00:00Z',
          expiryDate: '2024-01-01T00:00:00Z',
          quantity: 1000,
          location: 'Test Location',
          status: 'active',
          blockchainHash: 'test-hash',
          securityFeatures: [],
        },
      ];

      const mockResponse = {
        data: {
          data: mockBatches,
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await recallService.searchBatches('BATCH001');

      expect(mockedAxios.get).toHaveBeenCalledWith('/batches/search', { params: { q: 'BATCH001' } });
      expect(result).toEqual(mockBatches);
    });

    it('should handle errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(recallService.searchBatches('BATCH001')).rejects.toThrow('Failed to search batches');
    });
  });

  describe('getBatchById', () => {
    it('should fetch batch by ID successfully', async () => {
      const mockBatch = {
        id: 'batch1',
        productName: 'Test Product',
        batchNumber: 'BATCH001',
        manufacturingDate: '2023-01-01T00:00:00Z',
        expiryDate: '2024-01-01T00:00:00Z',
        quantity: 1000,
        location: 'Test Location',
        status: 'active',
        blockchainHash: 'test-hash',
        securityFeatures: [],
      };

      const mockResponse = {
        data: {
          data: mockBatch,
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await recallService.getBatchById('batch1');

      expect(mockedAxios.get).toHaveBeenCalledWith('/batches/batch1');
      expect(result).toEqual(mockBatch);
    });

    it('should handle errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(recallService.getBatchById('batch1')).rejects.toThrow('Failed to fetch batch');
    });
  });

  describe('updateBatchStatus', () => {
    it('should update batch status successfully', async () => {
      const mockBatch = {
        id: 'batch1',
        productName: 'Test Product',
        batchNumber: 'BATCH001',
        manufacturingDate: '2023-01-01T00:00:00Z',
        expiryDate: '2024-01-01T00:00:00Z',
        quantity: 1000,
        location: 'Test Location',
        status: 'recalled',
        blockchainHash: 'test-hash',
        securityFeatures: [],
      };

      const mockResponse = {
        data: {
          data: mockBatch,
        },
      };

      mockedAxios.put.mockResolvedValue(mockResponse);

      const result = await recallService.updateBatchStatus('batch1', 'recalled');

      expect(mockedAxios.put).toHaveBeenCalledWith('/batches/batch1/status', { status: 'recalled' });
      expect(result).toEqual(mockBatch);
    });

    it('should handle errors', async () => {
      mockedAxios.put.mockRejectedValue(new Error('Network Error'));

      await expect(recallService.updateBatchStatus('batch1', 'recalled')).rejects.toThrow('Failed to update batch status');
    });
  });
});