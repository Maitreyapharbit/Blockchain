import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useMetaMask } from './MetaMaskContext';

const BlockchainContext = createContext();

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
};

export const BlockchainProvider = ({ children }) => {
  const { isConnected, provider, signer } = useMetaMask();
  const [contracts, setContracts] = useState({});
  const [isDeployed, setIsDeployed] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState({});
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

  // Initialize blockchain service
  useEffect(() => {
    if (isConnected && provider) {
      initializeBlockchain();
    }
  }, [isConnected, provider, initializeBlockchain]);

  // Initialize blockchain service
  const initializeBlockchain = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get deployment status
      const response = await axios.get(`${API_BASE_URL}/blockchain/deployment/status`);
      
      if (response.data.success) {
        setDeploymentStatus(response.data.status);
        setIsDeployed(response.data.status.pharbitCore && response.data.status.complianceManager);
      }
    } catch (error) {
      console.error('Blockchain initialization error:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Deploy PharbitCore contract
  const deployPharbitCore = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/blockchain/deploy/pharbit-core`);
      
      if (response.data.success) {
        setContracts(prev => ({
          ...prev,
          pharbitCore: response.data.address
        }));
        toast.success('PharbitCore deployed successfully');
        return { success: true, address: response.data.address };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('PharbitCore deployment error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Deploy ComplianceManager contract
  const deployComplianceManager = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/blockchain/deploy/compliance-manager`);
      
      if (response.data.success) {
        setContracts(prev => ({
          ...prev,
          complianceManager: response.data.address
        }));
        toast.success('ComplianceManager deployed successfully');
        return { success: true, address: response.data.address };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('ComplianceManager deployment error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Deploy BatchNFT contract
  const deployBatchNFT = async (params) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/blockchain/deploy/batch-nft`, params);
      
      if (response.data.success) {
        setContracts(prev => ({
          ...prev,
          batchNFT: response.data.address
        }));
        toast.success('BatchNFT deployed successfully');
        return { success: true, address: response.data.address };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('BatchNFT deployment error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Deploy PharbitDeployer contract
  const deployPharbitDeployer = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/blockchain/deploy/pharbit-deployer`);
      
      if (response.data.success) {
        setContracts(prev => ({
          ...prev,
          pharbitDeployer: response.data.address
        }));
        toast.success('PharbitDeployer deployed successfully');
        return { success: true, address: response.data.address };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('PharbitDeployer deployment error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Deploy all contracts
  const deployAllContracts = async (params) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/blockchain/deploy/all`, params);
      
      if (response.data.success) {
        setContracts(response.data.contracts);
        setIsDeployed(true);
        toast.success('All contracts deployed successfully');
        return { success: true, contracts: response.data.contracts };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('All contracts deployment error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Load contract from address
  const loadContract = async (address, type) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/blockchain/load-contract`, {
        address,
        type
      });
      
      if (response.data.success) {
        setContracts(prev => ({
          ...prev,
          [type]: address
        }));
        toast.success(`${type} contract loaded successfully`);
        return { success: true };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Contract loading error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Create batch
  const createBatch = async (batchData) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/blockchain/batch/create`, batchData);
      
      if (response.data.success) {
        toast.success('Batch created successfully');
        // Refresh batches
        await fetchBatches();
        return { success: true, txHash: response.data.txHash };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Batch creation error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Transfer batch
  const transferBatch = async (batchId, to, reason, location) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/blockchain/batch/transfer`, {
        batchId,
        to,
        reason,
        location
      });
      
      if (response.data.success) {
        toast.success('Batch transferred successfully');
        // Refresh batches
        await fetchBatches();
        return { success: true, txHash: response.data.txHash };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Batch transfer error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Get batch information
  const getBatch = async (batchId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/blockchain/batch/${batchId}`);
      
      if (response.data.success) {
        return { success: true, batch: response.data.batch };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Get batch error:', error);
      return { success: false, error: error.message };
    }
  };

  // Get user batches
  const getUserBatches = async (address) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/blockchain/batch/user/${address}`);
      
      if (response.data.success) {
        return { success: true, batches: response.data.batches };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Get user batches error:', error);
      return { success: false, error: error.message };
    }
  };

  // Fetch batches
  const fetchBatches = async () => {
    try {
      if (!isConnected) return;
      
      const response = await axios.get(`${API_BASE_URL}/blockchain/batch/user/${signer?.address}`);
      
      if (response.data.success) {
        setBatches(response.data.batches);
      }
    } catch (error) {
      console.error('Fetch batches error:', error);
    }
  };

  // Get contract ABI
  const getContractABI = async (type) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/blockchain/contract/abi/${type}`);
      
      if (response.data.success) {
        return { success: true, abi: response.data.abi };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Get contract ABI error:', error);
      return { success: false, error: error.message };
    }
  };

  // Get gas estimate
  const getGasEstimate = async (method, params) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/blockchain/gas-estimate`, {
        method,
        params
      });
      
      if (response.data.success) {
        return { success: true, gasEstimate: response.data.gasEstimate };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Get gas estimate error:', error);
      return { success: false, error: error.message };
    }
  };

  // Get network information
  const getNetworkInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/blockchain/network`);
      
      if (response.data.success) {
        return { success: true, network: response.data.network };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Get network info error:', error);
      return { success: false, error: error.message };
    }
  };

  // Connect to MetaMask
  const connectMetaMask = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/blockchain/connect`);
      
      if (response.data.success) {
        toast.success('Connected to MetaMask');
        return { success: true };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('MetaMask connection error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  // Switch network
  const switchNetwork = async (chainId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/blockchain/switch-network`, {
        chainId
      });
      
      if (response.data.success) {
        toast.success(`Switched to network ${chainId}`);
        return { success: true };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Network switch error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  const value = {
    contracts,
    isDeployed,
    deploymentStatus,
    batches,
    loading,
    deployPharbitCore,
    deployComplianceManager,
    deployBatchNFT,
    deployPharbitDeployer,
    deployAllContracts,
    loadContract,
    createBatch,
    transferBatch,
    getBatch,
    getUserBatches,
    fetchBatches,
    getContractABI,
    getGasEstimate,
    getNetworkInfo,
    connectMetaMask,
    switchNetwork
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};