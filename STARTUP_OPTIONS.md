# 🚀 Pharbit Blockchain - Startup Options

Choose the startup method that works best for your system:

## 🎯 Quick Start (No PowerShell Required)

### Option 1: Simple Batch File (Windows)
```cmd
start-pharbit-simple.bat
```
**Requirements:** Windows Command Prompt (no PowerShell needed)

### Option 2: Node.js Script (Cross-Platform)
```bash
node start-pharbit.js
```
**Requirements:** Node.js (works on Windows, macOS, Linux)

### Option 3: Shell Script (Unix-like systems)
```bash
./start-pharbit.sh
```
**Requirements:** Bash shell (Linux, macOS, WSL)

### Option 4: Direct NPM Command
```bash
npm run dev
```
**Requirements:** Node.js and npm

## 🌐 Access Your Application

Once started, open: **http://localhost:3001**

## 🔧 What Each Script Does

All scripts perform the same functions:
1. ✅ **Check directory** - Ensures you're in the project root
2. ✅ **Create .env file** - Sets up environment variables
3. ✅ **Copy .env to backend** - Ensures backend has configuration
4. ✅ **Start all services** - Launches Hardhat, Backend, and Frontend
5. ✅ **Handle cleanup** - Properly stops services on exit

## 📋 Service Ports

- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:3000
- **Blockchain**: http://localhost:8545

## 🛠️ Troubleshooting

### "Something is already running on port 3001"
- Stop any existing React development servers
- Or change the port in the frontend package.json

### "Cannot find module" errors
- Run `npm install` in the project root
- Run `npm install` in the backend directory
- Run `npm install` in the frontend directory

### "No Hardhat config file found"
- Make sure you're in the project root directory
- The contracts directory should contain hardhat.config.js

## 🎉 Success!

Once running, you'll see:
- Hardhat blockchain node on port 8545
- Backend API server on port 3000
- Frontend React app on port 3001

**Open http://localhost:3001 to start using the application!** 🚀
