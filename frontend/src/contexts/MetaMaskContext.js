import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const MetaMaskContext = createContext();

export const useMetaMask = () => {
  const context = useContext(MetaMaskContext);
  if (!context) {
    throw new Error('useMetaMask must be used within a MetaMaskProvider');
  }
  return context;
};

export const MetaMaskProvider = ({ children }) => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState('0');

  // Check if MetaMask is installed
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      setIsInstalled(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);
    }
  }, []);

  // Connect to MetaMask
  const connect = async () => {
    try {
      if (!isInstalled) {
        toast(
          (t) => (
            <span>
              MetaMask is not installed.{' '}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#4CAF50', textDecoration: 'underline' }}
                onClick={() => toast.dismiss(t.id)}
              >
                Install MetaMask
              </a>
            </span>
          ),
          { icon: '🦊', duration: 10000 }
        );
        return { success: false, error: 'MetaMask not installed' };
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        toast.error('No accounts found');
        return { success: false, error: 'No accounts found' };
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(address);

      setAccount(address);
      setChainId(Number(network.chainId));
      setProvider(provider);
      setSigner(signer);
      setBalance(ethers.utils.formatEther(balance));
      setIsConnected(true);

      toast.success(`Connected to ${address.slice(0, 6)}...${address.slice(-4)}`);
      return { success: true, account: address };
    } catch (error) {
      console.error('MetaMask connection error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  // Disconnect from MetaMask
  const disconnect = () => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setBalance('0');
    setIsConnected(false);
    toast.success('Disconnected from MetaMask');
  };

  // Switch network
  const switchNetwork = async (targetChainId) => {
    try {
      if (!isInstalled) {
        toast.error('MetaMask is not installed');
        return { success: false, error: 'MetaMask not installed' };
      }

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }]
      });

      setChainId(targetChainId);
      toast.success(`Switched to network ${targetChainId}`);
      return { success: true };
    } catch (error) {
      if (error.code === 4902) {
        // Network doesn't exist, try to add it
        return await addNetwork(targetChainId);
      }
      console.error('Network switch error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  // Add network
  const addNetwork = async (chainId) => {
    try {
      const networkConfig = getNetworkConfig(chainId);
      
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig]
      });

      setChainId(chainId);
      toast.success(`Added and switched to network ${chainId}`);
      return { success: true };
    } catch (error) {
      console.error('Add network error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  // Get network configuration
  const getNetworkConfig = (chainId) => {
    const networks = {
      1: {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        rpcUrls: ['https://mainnet.infura.io/v3/YOUR_INFURA_KEY'],
        blockExplorerUrls: ['https://etherscan.io'],
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18
        }
      },
      11155111: {
        chainId: '0xaa36a7',
        chainName: 'Sepolia Testnet',
        rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
        nativeCurrency: {
          name: 'Sepolia Ether',
          symbol: 'ETH',
          decimals: 18
        }
      },
      1337: {
        chainId: '0x539',
        chainName: 'Localhost',
        rpcUrls: ['http://localhost:8545'],
        blockExplorerUrls: [],
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18
        }
      }
    };

    return networks[chainId] || networks[1337];
  };

  // Sign message
  const signMessage = async (message) => {
    try {
      if (!isConnected || !signer) {
        throw new Error('Not connected to MetaMask');
      }

      const signature = await signer.signMessage(message);
      return { success: true, signature };
    } catch (error) {
      console.error('Sign message error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  // Send transaction
  const sendTransaction = async (transaction) => {
    try {
      if (!isConnected || !signer) {
        throw new Error('Not connected to MetaMask');
      }

      const tx = await signer.sendTransaction(transaction);
      const receipt = await tx.wait();
      
      toast.success('Transaction confirmed');
      return { success: true, tx, receipt };
    } catch (error) {
      console.error('Send transaction error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  // Get network name
  const getNetworkName = (chainId) => {
    const networks = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      1337: 'Localhost',
      31337: 'Hardhat'
    };
    return networks[chainId] || 'Unknown Network';
  };

  // Format address
  const formatAddress = (address, length = 6) => {
    if (!address) return '';
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  };

  // Listen for account changes
  useEffect(() => {
    if (isInstalled) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAccount(accounts[0]);
        }
      };

      const handleChainChanged = (chainId) => {
        setChainId(Number(chainId));
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [isInstalled]);

  const value = {
    isInstalled,
    isConnected,
    account,
    chainId,
    provider,
    signer,
    balance,
    connect,
    disconnect,
    switchNetwork,
    addNetwork,
    signMessage,
    sendTransaction,
    getNetworkName,
    formatAddress
  };

  return (
    <MetaMaskContext.Provider value={value}>
      {children}
    </MetaMaskContext.Provider>
  );
};