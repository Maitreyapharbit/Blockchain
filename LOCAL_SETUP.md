# PharbitChain Local Setup Guide

This guide will help you get the pharmaceutical blockchain application running locally on your machine.

## 🚀 Quick Start

### Unified Setup Script (Recommended)

```bash
./start-all.sh
```

This script provides a complete setup and startup process:
- Installs all system dependencies (including netcat)
- Installs npm packages for frontend and backend
- Checks and resolves port conflicts automatically
- Starts the Hardhat blockchain node
- Launches the backend server
- Starts the frontend development server
- Handles graceful shutdown of all services

### Manual Setup (Alternative)

If you need to run services separately:

```bash
# 1. Install system dependencies
sudo apt-get update && sudo apt-get install -y netcat-openbsd

# 2. Install project dependencies
npm install --prefix backend
npm install --prefix frontend

# 3. Start blockchain server
bash scripts/start-blockchain.sh

# 4. Start backend server
bash scripts/start-server.sh

# 5. Start frontend
npm run start --prefix frontend
```

To stop all services when using manual setup, you'll need to terminate each process separately using `Ctrl+C` in each terminal.

## 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **Git** (for cloning the repository)

## 🔧 Configuration

### Backend Configuration

Edit `backend/.env` with your settings:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration (Optional - uses local storage by default)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AWS Configuration (Optional - uses local storage by default)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_s3_bucket

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Blockchain Configuration
ETHEREUM_RPC_URL=http://localhost:8545
PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
```

### Frontend Configuration

Edit `frontend/.env` with your settings:

```env
# React App Configuration
REACT_APP_ENV=development
REACT_APP_VERSION=1.0.0

# API Configuration
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_API_TIMEOUT=10000

# Blockchain Configuration
REACT_APP_ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
REACT_APP_CHAIN_ID=31337
```

## 🌐 Access Points

Once running, you can access:

- **Frontend Application**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/api/health
- **API Documentation**: http://localhost:3000/api/docs
- **Hardhat Node**: http://localhost:8545

## 🔍 Testing the Application

### 1. Connect MetaMask

1. Install MetaMask browser extension
2. Add local network:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

### 2. Import Test Accounts

When you start Hardhat, it will display test accounts with private keys. Import these into MetaMask for testing.

### 3. Create Your First Batch

1. Go to http://localhost:3001
2. Navigate to "Batch Management"
3. Click "Create New Batch"
4. Fill in batch details
5. Submit transaction via MetaMask

## 🛠️ Development Commands

### Start Services

```bash
# Start all services
./quick-start-local.sh

# Start individual services
npm run backend:dev    # Backend only
npm run frontend:dev   # Frontend only
npm run dev           # Both backend and frontend
```

### Stop Services

```bash
# Stop all services
./stop-local.sh

# Or use Ctrl+C if running the start script
```

### Testing

```bash
# Run all tests
npm test

# Run specific tests
npm run test:contracts  # Smart contract tests
npm run test:backend    # Backend API tests
npm run test:frontend   # Frontend component tests
```

### Database Operations

```bash
# Seed database with test data
cd backend && npm run db:seed

# Run database migrations
cd backend && npm run db:migrate
```

## 📁 Project Structure

```
pharbit-blockchain/
├── contracts/          # Smart contracts
├── backend/            # Node.js backend
├── frontend/           # React frontend
├── scripts/            # Utility scripts
├── docs/               # Documentation
├── logs/               # Application logs
└── quick-start-local.sh # Quick start script
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

3. **Contracts not deployed**
   ```bash
   # Redeploy contracts
   cd contracts
   npx hardhat run scripts/deploy.js --network localhost
   ```

4. **MetaMask connection issues**
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

### Reset Everything

If you need to start fresh:

```bash
# Stop all services
./stop-local.sh

# Clear all data
rm -rf node_modules backend/node_modules frontend/node_modules
rm -rf contracts/artifacts contracts/cache
rm -rf logs/*

# Reinstall and restart
npm run install:all
./quick-start-local.sh
```

## 📚 Next Steps

1. **Explore the Frontend**: Navigate through different pages and features
2. **Test Smart Contracts**: Create batches, transfer ownership, add compliance records
3. **API Testing**: Use the API documentation at http://localhost:3000/api/docs
4. **Development**: Make changes to the code and see them reflected immediately

## 🆘 Support

If you encounter any issues:

1. Check the logs in the `logs/` directory
2. Verify all services are running on the correct ports
3. Ensure MetaMask is properly configured
4. Check that all dependencies are installed correctly

The application is now ready for local development! 🎉