# PharbitChain - Pharmaceutical Blockchain Supply Chain

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Solidity Version](https://img.shields.io/badge/solidity-%5E0.8.20-blue)](https://soliditylang.org/)
[![React Version](https://img.shields.io/badge/react-18.2.0-blue)](https://reactjs.org/)

A comprehensive blockchain-based pharmaceutical supply chain management system built with Ethereum smart contracts, Node.js backend, and React frontend. PharbitChain ensures transparency, traceability, and compliance in pharmaceutical supply chains.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **MetaMask** browser extension

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/Maitreyapharbit/Blockchain.git
cd pharbit-blockchain

# Start everything with one command
./start-all.sh
```

This script will automatically:
- Install all required system dependencies
- Install npm packages for frontend and backend
- Start the Hardhat blockchain node
- Deploy smart contracts
- Launch the backend server
- Start the frontend development server
- Handle graceful shutdown when stopped

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Blockchain Node**: http://localhost:8545

### Stop Everything

Simply press `Ctrl+C` in the terminal where you ran `start-all.sh`
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Node.js Backend │    │  Smart Contracts │
│                 │    │                 │    │                 │
│  - Dashboard    │◄──►│  - REST API     │◄──►│  - Batch Mgmt   │
│  - Batch Mgmt   │    │  - Auth Service │    │  - Compliance   │
│  - Compliance   │    │  - File Storage │    │  - NFT Tracking │
│  - Wallet Mgmt  │    │  - Database     │    │  - Access Control│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MetaMask      │    │   Local Storage │    │   Hardhat       │
│   Wallet        │    │   (Optional)    │    │   Local Node    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ✨ Features

### Smart Contracts
- **Batch Management**: Create, transfer, and track pharmaceutical batches
- **Compliance Tracking**: FDA compliance and regulatory features
- **NFT Integration**: ERC721 tokens for batch tokenization
- **Access Control**: Role-based permissions for different stakeholders
- **Emergency Pause**: Safety mechanisms for critical situations

### Backend API
- **RESTful API**: Complete CRUD operations for all entities
- **Authentication**: JWT-based authentication with role management
- **File Management**: Local file storage with S3 integration option
- **Database**: Local storage with Supabase integration option
- **Blockchain Integration**: Ethers.js for smart contract interaction

### Frontend Application
- **Modern UI**: React with TypeScript and styled-components
- **Web3 Integration**: MetaMask connection and transaction management
- **Real-time Updates**: Live transaction and batch status updates
- **Responsive Design**: Mobile and desktop optimized
- **Dashboard**: Comprehensive overview and analytics

## 📁 Project Structure

```
pharbit-blockchain/
├── contracts/                 # Smart contracts
│   ├── contracts/            # Solidity contracts
│   ├── scripts/              # Deployment scripts
│   ├── test/                 # Contract tests
│   └── hardhat.config.js     # Hardhat configuration
├── backend/                  # Node.js backend
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   ├── middleware/           # Express middleware
│   ├── migrations/           # Database migrations
│   └── index.js              # Entry point
├── frontend/                 # React frontend
│   ├── src/                  # Source code
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   └── contexts/         # React contexts
│   └── public/               # Static assets
├── scripts/                  # Utility scripts
├── docs/                     # Documentation
├── quick-start-local.sh      # Local startup script
└── stop-local.sh            # Local shutdown script
```

## 🔧 Configuration

### Backend Configuration

Edit `backend/.env` with your settings:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Blockchain Configuration
Contract Configuration
ETHEREUM_RPC_URL=http://localhost:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Optional: Database (Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your_s3_bucket
```

### Frontend Configuration

Edit `frontend/.env` with your settings:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3000/api

# Blockchain Configuration
REACT_APP_ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
REACT_APP_CHAIN_ID=31337
```

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# Smart contracts
npm run test:contracts

# Backend API
npm run test:backend

# Frontend components
npm run test:frontend
```

## 📚 Documentation

- **[Local Setup Guide](LOCAL_SETUP.md)** - Detailed local development setup
- **[API Documentation](docs/API.md)** - Complete API reference
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions

## 🛠️ Development

### Manual Setup

If you prefer to run each step manually:

```bash
# 1. Install dependencies
npm run install:all

# 2. Set up environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Start Docker container with Hardhat node (Terminal 1)
docker run -v $(pwd)/contracts:/app -w /app -p 8545:8545 node:18 npx hardhat node

# 4. Deploy contracts (Terminal 2)
docker run -v $(pwd)/contracts:/app -w /app node:18 bash -c "npm install --save-dev hardhat@2.19.1 @nomicfoundation/hardhat-ethers@3.0.2 ethers@6.8.1 --legacy-peer-deps && npx hardhat compile && npx hardhat run scripts/deploy.js --network hardhat"

# 5. Start backend (Terminal 3)
cd backend
npm run dev

# 6. Start frontend (Terminal 4)
cd frontend
npm start
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking (frontend)
cd frontend && npm run type-check
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill processes on specific ports
   lsof -ti :3000 | xargs kill -9
   lsof -ti :3001 | xargs kill -9
   lsof -ti :8545 | xargs kill -9
   ```

2. **Node modules not found**
   ```bash
   # Reinstall dependencies
   rm -rf node_modules backend/node_modules frontend/node_modules
   npm run install:all
   ```

3. **MetaMask connection issues**
   - Make sure you're on the correct network (Hardhat Local)
   - Check that the RPC URL is correct
   - Try refreshing the page

### Logs

Check the logs directory for detailed error information:

```bash
# View all logs
tail -f logs/*.log

# View specific logs
tail -f logs/backend.log
tail -f logs/frontend.log
tail -f logs/hardhat.log
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [LOCAL_SETUP.md](LOCAL_SETUP.md)
- **Issues**: [GitHub Issues](https://github.com/Maitreyapharbit/Blockchain/issues)
- **Email**: support@pharbitchain.com

---

**Built with ❤️ by the PharbitChain Team**