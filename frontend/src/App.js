import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { MetaMaskProvider } from './contexts/MetaMaskContext';
import { BlockchainProvider } from './contexts/BlockchainContext';
import { SupabaseProvider } from './contexts/SupabaseContext';
import BatchCreator from './components/BatchCreator';
import BatchVerifier from './components/BatchVerifier';
import BlockMiner from './components/BlockMiner';
import ShipmentTrackingApp from './components/ShipmentTrackingApp';
import AlertDashboard from './components/AlertDashboard';
import styled from 'styled-components';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const Header = styled.header`
  padding: 2rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
`;

const Title = styled.h1`
  font-size: 3rem;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  margin: 1rem 0 0 0;
  opacity: 0.9;
`;

const Main = styled.main`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const ServiceCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 2rem;
  margin: 1rem 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const ServiceTitle = styled.h2`
  margin: 0 0 1rem 0;
  color: #fff;
`;

const ServiceStatus = styled.div`
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  background: #4CAF50;
  color: white;
  margin: 0.5rem 0;
`;

const ServiceLink = styled.a`
  color: #87CEEB;
  text-decoration: none;
  margin: 0 1rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

function App() {
  return (
    <ThemeProvider>
      <MetaMaskProvider>
        <BlockchainProvider>
          <SupabaseProvider>
            <Router>
              <Routes>
                <Route path="/shipments" element={<ShipmentTrackingApp />} />
                <Route path="/alerts" element={<AlertDashboard />} />
                <Route path="/" element={
                  <AppContainer>
                    <Header>
                      <Title>PharbitChain</Title>
                      <Subtitle>Pharmaceutical Blockchain Supply Chain Management</Subtitle>
                    </Header>
                    
                    <Main>
                      <ServiceCard>
                        <ServiceTitle>🚀 Services Status</ServiceTitle>
                        <div>
                          <ServiceStatus>✅ Blockchain Node Running</ServiceStatus>
                          <ServiceLink href="http://localhost:8545" target="_blank" rel="noopener noreferrer">
                            Hardhat Node (Port 8545)
                          </ServiceLink>
                        </div>
                        
                        <div>
                          <ServiceStatus>✅ Backend API Running</ServiceStatus>
                          <ServiceLink href="http://localhost:3000" target="_blank" rel="noopener noreferrer">
                            Backend API (Port 3000)
                          </ServiceLink>
                        </div>
                        
                        <div>
                          <ServiceStatus>✅ Frontend App Running</ServiceStatus>
                          <ServiceLink href="http://localhost:3001" target="_blank" rel="noopener noreferrer">
                            Frontend App (Port 3001)
                          </ServiceLink>
                        </div>
                      </ServiceCard>
                      
                      <ServiceCard>
                        <ServiceTitle>📦 Shipment Tracking</ServiceTitle>
                        <p>Real-time shipment monitoring with temperature tracking and alert system.</p>
                        <ServiceLink href="/shipments">
                          🚚 Go to Shipment Tracking
                        </ServiceLink>
                      </ServiceCard>
                      
                      <BatchCreator />
                      <BatchVerifier />
                      <BlockMiner />
                      
                      <ServiceCard>
                        <ServiceTitle>🔗 Quick Links</ServiceTitle>
                        <div>
                          <ServiceLink href="http://localhost:3000/api/health" target="_blank" rel="noopener noreferrer">
                            API Health Check
                          </ServiceLink>
                          <ServiceLink href="http://localhost:3000/api/docs" target="_blank" rel="noopener noreferrer">
                            API Documentation
                          </ServiceLink>
                        </div>
                      </ServiceCard>
                      
                      <ServiceCard>
                        <ServiceTitle>📋 MetaMask Setup</ServiceTitle>
                        <p>To connect to the local blockchain:</p>
                        <ul>
                          <li>Network Name: Hardhat Local</li>
                          <li>RPC URL: http://localhost:8545</li>
                          <li>Chain ID: 31337</li>
                          <li>Currency Symbol: ETH</li>
                        </ul>
                      </ServiceCard>
                    </Main>
                  </AppContainer>
                } />
              </Routes>
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  },
                }}
              />
            </Router>
          </SupabaseProvider>
        </BlockchainProvider>
      </MetaMaskProvider>
    </ThemeProvider>
  );
}

export default App;