import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useMetaMask } from '../contexts/MetaMaskContext';
import { useBlockchain } from '../contexts/BlockchainContext';
import toast from 'react-hot-toast';

const Container = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 2rem;
  margin: 1rem 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const Title = styled.h2`
  margin: 0 0 1.5rem 0;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #4CAF50;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
`;

const MiningControls = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const Button = styled.button`
  background: ${props => props.$primary ? 
    'linear-gradient(135deg, #FF9800, #F57C00)' : 
    'linear-gradient(135deg, #2196F3, #1976D2)'
  };
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 150px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => props.$primary ? 
      'rgba(255, 152, 0, 0.3)' : 
      'rgba(33, 150, 243, 0.3)'
    };
  }
  
  &:disabled {
    background: rgba(255, 255, 255, 0.2);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const RecentBlocks = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  max-height: 300px;
  overflow-y: auto;
`;

const BlockItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  margin: 0.5rem 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border-left: 4px solid #4CAF50;
`;

const BlockInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const BlockNumber = styled.span`
  font-weight: bold;
  color: #4CAF50;
`;

const BlockTime = styled.span`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
`;

const BlockHash = styled.span`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  font-family: monospace;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const BlockMiner = () => {
  const { isConnected, account, connect } = useMetaMask();
  const { getNetworkInfo, loading } = useBlockchain();
  const [blockchainStats, setBlockchainStats] = useState({
    currentBlock: 0,
    networkName: 'Unknown',
    gasPrice: '0',
    isMining: false
  });
  const [error, setError] = useState(null);
  const [recentBlocks, setRecentBlocks] = useState([]);
  const [isMining, setIsMining] = useState(false);

  const updateBlockchainStats = async () => {
    try {
      setError(null);
      const networkInfo = await getNetworkInfo();
      if (networkInfo && networkInfo.success) {
        setBlockchainStats(prev => ({
          ...prev,
          currentBlock: networkInfo.network?.blockNumber || 0,
          networkName: networkInfo.network?.name || 'Localhost',
          gasPrice: networkInfo.network?.gasPrice || '0'
        }));
      }
    } catch (error) {
      console.error('Error fetching network info:', error);
      setError('Failed to fetch network info');
      // Set default values on error
      setBlockchainStats(prev => ({
        ...prev,
        currentBlock: prev.currentBlock || 0,
        networkName: 'Localhost',
        gasPrice: '0'
      }));
    }
  };

  const mineBlock = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      const result = await connect();
      if (!result.success) return;
    }

    setIsMining(true);
    
    try {
      // Simulate mining with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock block data
      const newBlockNumber = blockchainStats.currentBlock + 1;
      const newBlockHash = '0x' + Math.random().toString(16).substr(2, 64);
      const transactionCount = Math.floor(Math.random() * 5) + 1;
      
      toast.success('Block mined successfully!');
      
      // Add to recent blocks
      const newBlock = {
        number: newBlockNumber,
        hash: newBlockHash,
        timestamp: new Date().toLocaleString(),
        transactions: transactionCount
      };
      
      setRecentBlocks(prev => [newBlock, ...prev.slice(0, 9)]);
      
      // Update stats
      setBlockchainStats(prev => ({
        ...prev,
        currentBlock: newBlockNumber
      }));
      
    } catch (error) {
      console.error('Error mining block:', error);
      toast.error('An error occurred while mining');
    } finally {
      setIsMining(false);
    }
  };

  const startMining = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setBlockchainStats(prev => ({ ...prev, isMining: true }));
    toast.success('Mining started!');
    
    // Simulate continuous mining
    const miningInterval = setInterval(() => {
      mineBlock();
    }, 5000);

    // Store interval ID for cleanup
    window.miningInterval = miningInterval;
  };

  const stopMining = () => {
    if (window.miningInterval) {
      clearInterval(window.miningInterval);
      window.miningInterval = null;
    }
    
    setBlockchainStats(prev => ({ ...prev, isMining: false }));
    toast.success('Mining stopped!');
  };

  useEffect(() => {
    updateBlockchainStats();
    const interval = setInterval(updateBlockchainStats, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (window.miningInterval) {
        clearInterval(window.miningInterval);
      }
    };
  }, []);

  return (
    <Container>
      <Title>
        ⛏️ Block Miner & Blockchain Stats
      </Title>
      
      {!isConnected && (
        <div style={{ 
          background: 'rgba(255, 152, 0, 0.1)', 
          border: '1px solid #FF9800', 
          borderRadius: '8px', 
          padding: '1rem', 
          marginBottom: '1rem',
          color: '#FF9800'
        }}>
          ⚠️ Please connect your MetaMask wallet to mine blocks
        </div>
      )}

      {error && (
        <div style={{ 
          background: 'rgba(244, 67, 54, 0.1)', 
          border: '1px solid #F44336', 
          borderRadius: '8px', 
          padding: '1rem', 
          marginBottom: '1rem',
          color: '#F44336'
        }}>
          ❌ {error}
        </div>
      )}

      <StatsGrid>
        <StatCard>
          <StatValue>{blockchainStats.currentBlock || 0}</StatValue>
          <StatLabel>Current Block</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>{blockchainStats.networkName || 'Unknown'}</StatValue>
          <StatLabel>Network</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>{blockchainStats.gasPrice || '0'} Gwei</StatValue>
          <StatLabel>Gas Price</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>{blockchainStats.isMining ? '🟢' : '🔴'}</StatValue>
          <StatLabel>Mining Status</StatLabel>
        </StatCard>
      </StatsGrid>

      <MiningControls>
        <Button 
          onClick={mineBlock} 
          disabled={!isConnected || isMining || loading}
        >
          {isMining ? (
            <>
              <LoadingSpinner /> Mining...
            </>
          ) : (
            '⛏️ Mine Single Block'
          )}
        </Button>
        
        <Button 
          onClick={blockchainStats.isMining ? stopMining : startMining}
          disabled={!isConnected || loading}
          $primary
        >
          {blockchainStats.isMining ? '⏹️ Stop Mining' : '🚀 Start Mining'}
        </Button>
        
        <Button 
          onClick={updateBlockchainStats}
          disabled={loading}
        >
          🔄 Refresh Stats
        </Button>
      </MiningControls>

      <RecentBlocks>
        <h3 style={{ margin: '0 0 1rem 0', color: '#fff' }}>Recent Blocks</h3>
        {recentBlocks.length === 0 ? (
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', margin: '2rem 0' }}>
            No blocks mined yet. Start mining to see recent blocks!
          </p>
        ) : (
          recentBlocks.map((block, index) => (
            <BlockItem key={index}>
              <BlockInfo>
                <BlockNumber>Block #{block.number || 0}</BlockNumber>
                <BlockTime>{block.timestamp || 'Unknown'}</BlockTime>
                <BlockHash>{block.hash || '0x...'}</BlockHash>
              </BlockInfo>
              <div style={{ color: '#4CAF50', fontSize: '0.8rem' }}>
                {block.transactions || 0} tx
              </div>
            </BlockItem>
          ))
        )}
      </RecentBlocks>
    </Container>
  );
};

export default BlockMiner;
