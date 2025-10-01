import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Sequelize } from 'sequelize';
import Web3 from 'web3';
import dotenv from 'dotenv';

import { RecallService } from './services/RecallService';
import { CounterfeitService } from './services/CounterfeitService';
import { createRecallRoutes } from './routes/recallRoutes';
import { createCounterfeitRoutes } from './routes/counterfeitRoutes';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'pharma_blockchain',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Web3 connection
const web3 = new Web3(process.env.ETHEREUM_RPC_URL || 'http://localhost:8545');

// Contract addresses (these would be set after deployment)
const RECALL_CONTRACT_ADDRESS = process.env.RECALL_CONTRACT_ADDRESS || '';
const COUNTERFEIT_CONTRACT_ADDRESS = process.env.COUNTERFEIT_CONTRACT_ADDRESS || '';

// Contract ABIs (simplified for this example)
const RECALL_CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "recallId", "type": "string"},
      {"internalType": "uint8", "name": "severity", "type": "uint8"},
      {"internalType": "string", "name": "reason", "type": "string"},
      {"internalType": "string[]", "name": "batchIds", "type": "string[]"}
    ],
    "name": "initiateRecall",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "recallId", "type": "string"}],
    "name": "getRecall",
    "outputs": [
      {"internalType": "string", "name": "", "type": "string"},
      {"internalType": "uint8", "name": "", "type": "uint8"},
      {"internalType": "string", "name": "", "type": "string"},
      {"internalType": "address", "name": "", "type": "address"},
      {"internalType": "uint256", "name": "", "type": "uint256"},
      {"internalType": "uint8", "name": "", "type": "uint8"},
      {"internalType": "string[]", "name": "", "type": "string[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const COUNTERFEIT_CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "batchId", "type": "string"},
      {"internalType": "uint8", "name": "verificationType", "type": "uint8"},
      {"internalType": "string", "name": "providedData", "type": "string"},
      {"internalType": "string", "name": "details", "type": "string"}
    ],
    "name": "verifyAuthenticity",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "batchId", "type": "string"}],
    "name": "getSecurityFeature",
    "outputs": [
      {"internalType": "string", "name": "", "type": "string"},
      {"internalType": "string", "name": "", "type": "string"},
      {"internalType": "string", "name": "", "type": "string"},
      {"internalType": "string", "name": "", "type": "string"},
      {"internalType": "string", "name": "", "type": "string"},
      {"internalType": "address", "name": "", "type": "address"},
      {"internalType": "uint256", "name": "", "type": "uint256"},
      {"internalType": "bool", "name": "", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Initialize services
let recallService: RecallService;
let counterfeitService: CounterfeitService;

async function initializeServices() {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Initialize contract instances
    const recallContract = new web3.eth.Contract(RECALL_CONTRACT_ABI as any, RECALL_CONTRACT_ADDRESS);
    const counterfeitContract = new web3.eth.Contract(COUNTERFEIT_CONTRACT_ABI as any, COUNTERFEIT_CONTRACT_ADDRESS);

    // Initialize services
    recallService = new RecallService(web3, recallContract, sequelize);
    counterfeitService = new CounterfeitService(web3, counterfeitContract, sequelize);

    // Sync database models
    await sequelize.sync({ alter: true });
    logger.info('Database models synchronized');

    logger.info('Services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/recalls', createRecallRoutes(recallService));
app.use('/api/counterfeit', createCounterfeitRoutes(counterfeitService));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
async function startServer() {
  await initializeServices();
  
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

startServer().catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export { app, sequelize, web3 };