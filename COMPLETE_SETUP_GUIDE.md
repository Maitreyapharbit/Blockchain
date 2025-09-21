# 🚀 Pharbit Blockchain - Complete Setup Guide

## 📋 **Table of Contents**
- [Quick Start](#-quick-start)
- [Platform-Specific Instructions](#-platform-specific-instructions)
- [Manual Setup](#-manual-setup)
- [Troubleshooting](#-troubleshooting)
- [Features](#-features)
- [Access URLs](#-access-urls)

---

## ⚡ **Quick Start**

### **For All Platforms (Recommended):**
```bash
# 1. Fix Hardhat installation
node fix-hardhat.js

# 2. Start the application
node start-pharbit.js
```

### **Alternative Quick Start:**
```bash
# Option 1: Simple startup (if concurrently issues)
node start-simple.js

# Option 2: Shell script (Unix-like systems)
./start-pharbit.sh

# Option 3: Direct NPM
npm run dev

# Option 4: Quick start script
./quick-start-local.sh
```

---

## 🖥️ **Platform-Specific Instructions**

### **🌐 GitHub Codespaces**

**Best for:** Cloud development, no local setup required

```bash
# 1. Open your Codespace in GitHub
# 2. Run these commands:

node fix-hardhat.js
node start-pharbit.js
```

**Access URLs:**
- Look for the **"Ports"** tab in Codespaces
- Click on the forwarded port URLs:
  - Frontend: `https://your-codespace-3001.preview.app.github.dev`
  - Backend: `https://your-codespace-3000.preview.app.github.dev`
  - Blockchain: `https://your-codespace-8545.preview.app.github.dev`

---

### **🪟 Windows**

**Option 1: Command Prompt (Recommended)**
```cmd
start-pharbit-simple.bat
```

**Option 2: PowerShell**
```powershell
.\start-pharbit.ps1
```

**Option 3: Node.js (Cross-platform)**
```cmd
node start-pharbit.js
```

**Access URLs:**
- Frontend: http://localhost:3001
- Backend: http://localhost:3000
- Blockchain: http://localhost:8545

---

### **🍎 macOS**

**Option 1: Shell Script**
```bash
./start-pharbit.sh
```

**Option 2: Node.js**
```bash
node start-pharbit.js
```

**Option 3: Direct NPM**
```bash
npm run dev
```

**Access URLs:**
- Frontend: http://localhost:3001
- Backend: http://localhost:3000
- Blockchain: http://localhost:8545

---

### **🐧 Linux**

**Option 1: Shell Script**
```bash
./start-pharbit.sh
```

**Option 2: Node.js**
```bash
node start-pharbit.js
```

**Option 3: Direct NPM**
```bash
npm run dev
```

**Access URLs:**
- Frontend: http://localhost:3001
- Backend: http://localhost:3000
- Blockchain: http://localhost:8545

---

## 🔧 **Manual Setup**

If the automated scripts don't work, follow these manual steps:

### **1. Install Dependencies**
```bash
# Root dependencies
npm install

# Backend dependencies
cd backend && npm install && cd ..

# Frontend dependencies
cd frontend && npm install && cd ..

# Contract dependencies
cd contracts && npm install && cd ..
```

### **2. Fix Hardhat Installation**
```bash
cd contracts
npm install hardhat@^2.22.0
cd ..
```

### **3. Create Environment Files**
```bash
# Create .env file in root
cat > .env << EOF
NODE_ENV=development
PORT=3000
HOST=localhost
ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_CHAIN_ID=31337
EOF

# Copy to backend
cp .env backend/.env
```

### **4. Start Services**

**Terminal 1 - Hardhat:**
```bash
cd contracts
npx hardhat node
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm start
```

---

## 🛠️ **Troubleshooting**

### **Common Issues & Solutions**

#### **"Hardhat not found" Error**
```bash
# Fix: Install Hardhat locally
node fix-hardhat.js
# OR
cd contracts && npm install hardhat@^2.22.0 && cd ..
```

#### **"Port already in use" Error**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

#### **"Cannot find module" Error**
```bash
# Reinstall dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd contracts && npm install && cd ..
```

#### **"concurrently: not found" Error**
```bash
# Install missing dependency
npm install concurrently --save-dev

# OR use the simple startup script
node start-simple.js
```

#### **"Something is already running on port 3001"**
```bash
# Kill existing React processes
pkill -f "react-scripts start"
# OR
pkill -f "npm start"
```

#### **PowerShell Execution Policy Error (Windows)**
```powershell
# Run this in PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### **Codespaces Port Not Accessible**
1. Check the **"Ports"** tab in Codespaces
2. Make sure ports 3000, 3001, and 8545 are forwarded
3. Click on the forwarded port URLs
4. If not forwarded, manually forward them in the Ports tab

---

## ✨ **Features**

### **💊 Batch Creator**
- Create pharmaceutical batches with full validation
- Real-time form validation
- Batch ID generation
- Transaction hash tracking

### **🔍 Batch Verifier**
- Search and verify batches on blockchain
- Display batch details and status
- Available batches list
- Click-to-fill functionality

### **⛏️ Block Miner**
- Mine blocks and monitor blockchain statistics
- Real-time blockchain stats
- Block mining simulation
- Network monitoring

### **🔗 MetaMask Integration**
- Full wallet connectivity
- Account management
- Transaction signing
- Network switching

### **📱 Responsive UI**
- Modern glassmorphism design
- Mobile-friendly interface
- Toast notifications
- Error handling

---

## 🌐 **Access URLs**

### **Local Development:**
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Blockchain RPC**: http://localhost:8545
- **API Health**: http://localhost:3000/health

### **GitHub Codespaces:**
- **Frontend**: `https://your-codespace-3001.preview.app.github.dev`
- **Backend API**: `https://your-codespace-3000.preview.app.github.dev`
- **Blockchain RPC**: `https://your-codespace-8545.preview.app.github.dev`

---

## 🔑 **MetaMask Setup**

### **Network Configuration:**
- **Network Name**: Hardhat Local
- **RPC URL**: http://localhost:8545 (or your Codespace URL)
- **Chain ID**: 31337
- **Currency Symbol**: ETH

### **Test Accounts:**
The Hardhat node provides 20 test accounts with 10000 ETH each for testing.

---

## 📁 **Project Structure**

```
pharbit-blockchain/
├── backend/                 # Express.js API server
├── frontend/               # React.js web application
├── contracts/              # Smart contracts (Solidity)
├── scripts/                # Utility scripts
├── docs/                   # Documentation
├── start-pharbit.js        # Cross-platform startup script
├── start-pharbit.sh        # Unix-like startup script
├── start-pharbit-simple.bat # Windows startup script
├── fix-hardhat.js          # Hardhat installation fix
└── package.json            # Root package configuration
```

---

## 🎯 **Quick Commands Reference**

### **Start Application:**
```bash
# Cross-platform
node start-pharbit.js

# Unix-like
./start-pharbit.sh

# Windows
start-pharbit-simple.bat

# Direct NPM
npm run dev
```

### **Fix Issues:**
```bash
# Fix Hardhat
node fix-hardhat.js

# Reinstall dependencies
npm run install:all

# Clean and restart
npm run clean && npm run install:all
```

### **Stop Services:**
```bash
# Kill all processes
pkill -f "hardhat node"
pkill -f "npm run dev"
pkill -f "npm start"

# Or use Ctrl+C in the terminal running the startup script
```

---

## 🎉 **Success!**

Once everything is running, you'll see:
- ✅ Hardhat blockchain node running
- ✅ Backend API server running
- ✅ Frontend React app running
- ✅ All services accessible via their URLs

**Your pharmaceutical blockchain application is now ready to use!** 🚀

---

## 📞 **Need Help?**

If you encounter any issues:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Verify all dependencies are installed
3. Ensure ports are not in use
4. Check the console logs for specific error messages

**Happy coding!** 💊⛓️
