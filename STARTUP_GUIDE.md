# 🚀 Pharbit Blockchain - Startup Guide

This guide will help you start the complete Pharbit Blockchain application with a single command.

## 📋 Prerequisites

Before running the startup scripts, ensure you have:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PowerShell** (Windows 10/11) or **Command Prompt**
- **MetaMask** browser extension (for wallet integration)

## 🎯 Quick Start (Recommended)

### Option 1: PowerShell Script (Advanced)
```powershell
# Run the comprehensive PowerShell script
.\start-pharbit-blockchain.ps1
```

### Option 2: Batch File (Simple)
```cmd
# Run the simple batch file
start-pharbit-blockchain.bat
```

### Option 3: Manual Command
```bash
# Run the npm dev command
npm run dev
```

## 🔧 What Each Script Does

### PowerShell Script (`start-pharbit-blockchain.ps1`)
- ✅ **Installs all dependencies** (root, backend, frontend, contracts)
- ✅ **Starts Hardhat blockchain node** on port 8545
- ✅ **Starts Backend server** on port 3000
- ✅ **Starts Frontend application** on port 3001
- ✅ **Monitors all services** and shows status
- ✅ **Handles errors gracefully** with detailed logging
- ✅ **Opens each service in separate windows** for easy monitoring
- ✅ **Waits for services to be ready** before starting the next one
- ✅ **Provides cleanup** when stopping

### Batch File (`start-pharbit-blockchain.bat`)
- ✅ **Simple one-command startup**
- ✅ **Uses npm run dev** to start all services
- ✅ **Basic error checking**
- ✅ **Easy to use**

## 🌐 Access Points

Once all services are running, you can access:

| Service | URL | Description |
|---------|-----|-------------|
| **Web Interface** | http://localhost:3001 | Main application UI |
| **Backend API** | http://localhost:3000 | REST API endpoints |
| **Blockchain Node** | http://localhost:8545 | Hardhat local blockchain |

## 🔗 MetaMask Configuration

To connect MetaMask to the local blockchain:

1. **Open MetaMask** in your browser
2. **Click the network dropdown** (top of MetaMask)
3. **Select "Add Network"** or "Custom RPC"
4. **Enter these details:**
   - **Network Name**: `Hardhat Local`
   - **RPC URL**: `http://localhost:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
   - **Block Explorer**: (leave empty)

## 📱 Using the Application

### 1. Create Pharmaceutical Batches
- Fill out the batch creation form
- Enter drug details (name, quantity, manufacturer, etc.)
- Click "Create Batch & Mine Block"
- Note the generated batch ID

### 2. Verify Batches
- Enter a batch ID in the verification form
- Or click on a batch from the available batches list
- View complete batch details and verification status

### 3. Mine Blocks
- Click "Mine Single Block" for individual mining
- Use "Start Mining" for continuous mining
- Monitor blockchain statistics in real-time

## 🛠️ Troubleshooting

### Common Issues

#### "Node.js is not installed"
- Download and install Node.js from https://nodejs.org/
- Restart your terminal/command prompt

#### "Port already in use"
- Stop any existing services using the ports
- Or change the ports in the configuration files

#### "MetaMask connection failed"
- Ensure MetaMask is installed and unlocked
- Check that you're connected to the correct network (Chain ID: 31337)
- Try refreshing the page

#### "Services won't start"
- Check that all dependencies are installed
- Ensure no other applications are using the required ports
- Check the console output for specific error messages

### Manual Service Management

If you need to start services individually:

```bash
# Terminal 1: Start Hardhat node
cd contracts
npx hardhat node

# Terminal 2: Start Backend
cd backend
npm run dev

# Terminal 3: Start Frontend
cd frontend
npm start
```

## 🔄 Stopping Services

### PowerShell Script
- Press `Ctrl+C` in the PowerShell window
- Or close the PowerShell window

### Batch File
- Press `Ctrl+C` in the command prompt
- Or close the command prompt window

### Manual
- Press `Ctrl+C` in each terminal window
- Or close each terminal window

## 📊 Service Status

The PowerShell script provides real-time monitoring:

- ✅ **Green**: Service is running normally
- ⚠️ **Yellow**: Service has stopped or has issues
- ❌ **Red**: Service failed to start or encountered an error

## 🆘 Getting Help

If you encounter issues:

1. **Check the console output** for error messages
2. **Verify all prerequisites** are installed
3. **Try restarting** the services
4. **Check port availability** (8545, 3000, 3001)
5. **Review the logs** in each service window

## 🎉 Success!

Once everything is running, you should see:

```
🎉 All Services Started Successfully!
=====================================

🌐 Web Interface: http://localhost:3001
🔗 Backend API: http://localhost:3000
⛓️  Blockchain: http://localhost:8545

📋 Service Status:
  ✅ Hardhat Node (PID: xxxx)
  ✅ Backend Server (PID: xxxx)
  ✅ Frontend App (PID: xxxx)
```

**Open http://localhost:3001 in your browser to start using the application!** 🚀
