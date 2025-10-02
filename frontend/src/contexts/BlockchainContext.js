import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useMetaMask } from './MetaMaskContext';
import QRCode from 'qrcode';

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
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  // Helper function to generate QR code
  const generateQRCode = async (data) => {
    try {
      console.log('Generating QR code for data:', data);
      
      // Ensure data is a string
      const stringData = typeof data === 'object' ? JSON.stringify(data) : String(data);
      
      console.log('Converting data to QR code...');
      const qrCodeDataUrl = await QRCode.toDataURL(stringData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        width: 200,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      
      console.log('QR code generated successfully');
      return qrCodeDataUrl;
    } catch (error) {
      console.error('QR code generation error:', error);
      toast.error('Failed to generate QR code: ' + error.message);
      // Return a placeholder image with red background to indicate error
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TpUUqDnYQcchQnSyIijhKFYtgobQVWnUwufQLmjQkKS6OgmvBwY/FqoOLs64OroIg+AHi6OSk6CIl/i8ptIjx4Lgf7+497t4BQqPMNKtrHNB020wl4mImuyoGXxGCAPoQRkBmljEnSUl0HF/38PH1LsazOp/7c/SrOYsBPpF4lhmmTbxBPL1pG5z3iSOsKKvE58RjJl2Q+JHrisdvnAsuCzwzYqZT88QRYrHQxkobs6KpEU8RR1VNp3wh47HKeYuzVq6y5j35C0M5fWWZ6zSHkcAiliBBhIIqSijDRox2nRQLKTqP+/iHXL9ELoVcJTByLKACDbLrB/+D391a+ckJLykUBzpfHOdjFAjuAo2a43wfO07jBAg+A1d6y1+pAzOfpNdaWvQI6N0GLq5bmrIHXO4AA0+GbMquFKQp5PPA+xl9UxbovwV61morr3k+RxgYStQoXvfwCBha3Ku32LvTm9s/bzr9/QBBYXKj7xEi6wAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB+QIDwgMB1Y5qoYAAAGeSURBVHja7dgxEQAgDMAwwAb+RaGDhHeLZO54A6DlPgcAFgkQAQJAgAABIEAACBAAAv5HAAgQAAJAgAAQIAAECAABAkCACABAgAAQIAAECAABAkCAABAgAAQIAAECQIAAECAABAh7AAgQAAIEgAABIEAACBAAAkSAABAgAAQIAAECQIAAECAAfJYAAYAAASBAAAgQAAIEgAABIEAAeC0BAkCAAPBCAAQIAAECQIAAECAA/BwAAgSAAAEgQAAIEAACBIAAEQACBIAAASBAAAgQAAIEgAABIEAACBABIEAACBAAAkSACBAAAgSAAAEgQAAIEAACBIAAAeC5BAgAAQJAgAAQIAAECAABAkCACABAgAAQIAAECAABAkCAABAgAAQIAAECQIAAECAA1gIgQAAIEAACBIAAASBAAAgQAQJAgAAQIAAECAABAkCAABAgALwWAAECQIAAECAABAgAAQJAgAAQIBYJgAABIEAACBAAAkSAABAgAAQIAAECQIAAECAABAgAuyVABAhzAXL9dV3gZb/CAAAAAElFTkSuQmCC';
    }
  };

  // Helper function to generate hash
  const generateHash = async (data) => {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Hash generation error:', error);
      // Return a simple hash based on data length and content
      return data.length.toString(16) + data.charCodeAt(0).toString(16);
    }
  };

  // Initialize blockchain service
  const initializeBlockchain = useCallback(async () => {
    try {
      setLoading(true);
      
      // For now, we'll create a mock deployment status
      // In a real implementation, this would call the backend API
      const mockDeploymentStatus = {
        pharbitCore: true,
        complianceManager: true,
        batchNFT: true,
        pharbitDeployer: true
      };
      
      setDeploymentStatus(mockDeploymentStatus);
      setIsDeployed(true);
    } catch (error) {
      console.error('Blockchain initialization error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load existing batches from localStorage
  useEffect(() => {
    const existingBatches = JSON.parse(localStorage.getItem('pharbitBatches') || '[]');
    setBatches(existingBatches);
  }, []);

  // Initialize blockchain service
  useEffect(() => {
    if (isConnected && provider) {
      initializeBlockchain();
    }
  }, [isConnected, provider, initializeBlockchain]);

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
      
      // Generate a unique batch ID
      const batchId = Math.floor(Math.random() * 1000000) + 1000;
      
      // Generate QR code data
      const qrCodeData = {
        batchId: batchId,
        drugName: batchData.drugName,
        manufacturer: batchData.manufacturer,
        quantity: batchData.quantity,
        lotNumber: batchData.lotNumber,
        timestamp: Date.now(),
        verificationUrl: `${window.location.origin}/verify/${batchId}`
      };

      // Generate QR code as base64 data URL
      const qrCodeString = JSON.stringify(qrCodeData);
      const qrCodeBase64 = await generateQRCode(qrCodeString);
      
      // Create hash for verification
      const qrHash = await generateHash(qrCodeString);
      
      // Create the batch object with all provided data including QR code
      const newBatch = {
        batchId: batchId,
        drugName: batchData.drugName,
        quantity: batchData.quantity,
        manufacturer: batchData.manufacturer,
        lotNumber: batchData.lotNumber,
        dosageForm: batchData.dosageForm,
        strength: batchData.strength,
        packaging: batchData.packaging,
        description: batchData.description,
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: Math.floor(Math.random() * 100) + 1,
        createdAt: Date.now(),
        qrCode: {
          dataUrl: qrCodeBase64,
          batchUrl: `${window.location.origin}/verify/${batchId}`,
          hash: qrHash,
        },
        verified: true,
        qrCode: {
          dataUrl: qrCodeBase64,
          batchUrl: qrCodeData.verificationUrl,
          hash: qrHash,
          generatedAt: new Date().toISOString()
        }
      };

      // Store the batch in localStorage for persistence
      const existingBatches = JSON.parse(localStorage.getItem('pharbitBatches') || '[]');
      existingBatches.push(newBatch);
      localStorage.setItem('pharbitBatches', JSON.stringify(existingBatches));

      // Add to current batches state
      setBatches(prev => [...prev, newBatch]);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Batch created successfully');
      return { success: true, batch: newBatch };
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
      setLoading(true);
      
      // Convert batchId to number for comparison
      const numericBatchId = parseInt(batchId);
      
      // Get batches from localStorage
      const existingBatches = JSON.parse(localStorage.getItem('pharbitBatches') || '[]');
      
      // Find the batch with the matching ID
      const foundBatch = existingBatches.find(batch => batch.batchId === numericBatchId);
      
      if (foundBatch) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return { success: true, batch: foundBatch };
      } else {
        // If batch not found, return error
        return { 
          success: false, 
          error: `Batch with ID ${batchId} not found`,
          batch: null
        };
      }
    } catch (error) {
      console.error('Get batch error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
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
      // For now, we'll create a mock response
      // In a real implementation, this would call the backend API
      const mockNetwork = {
        name: 'Hardhat Local',
        chainId: 31337,
        blockNumber: Math.floor(Math.random() * 100) + 1,
        gasPrice: '20000000000' // 20 Gwei
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return { success: true, network: mockNetwork };
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