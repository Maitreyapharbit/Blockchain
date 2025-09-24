# 🚀 PharbitChain Startup Scripts

This directory contains executable scripts to easily start and manage your PharbitChain application in Codespaces.

## 📋 Available Scripts

### 1. **Complete Startup Script** (Recommended)
```bash
./start-pharbit-complete.sh
```
**What it does:**
- ✅ Installs all dependencies
- ✅ Fixes Hardhat installation
- ✅ Starts Hardhat blockchain node
- ✅ Deploys smart contracts
- ✅ Starts backend API server
- ✅ Starts frontend React app
- ✅ Monitors all services
- ✅ Provides detailed status information

### 2. **Quick Start Script** (Fast)
```bash
./quick-start.sh
```
**What it does:**
- ✅ Installs missing dependencies
- ✅ Starts all services quickly
- ✅ Minimal output for fast startup

### 3. **Stop All Services**
```bash
./stop-all.sh
```
**What it does:**
- ✅ Stops all running services
- ✅ Cleans up processes
- ✅ Removes PID files

## 🎯 **How to Use**

### **First Time Setup:**
```bash
# Make scripts executable (if needed)
chmod +x *.sh

# Run the complete startup script
./start-pharbit-complete.sh
```

### **Daily Usage:**
```bash
# Quick start (if dependencies are already installed)
./quick-start.sh

# Or use the complete script for full setup
./start-pharbit-complete.sh
```

### **Stop Services:**
```bash
# Stop all services
./stop-all.sh

# Or press Ctrl+C in the terminal running the services
```

## 🌐 **Accessing Your Application**

After running any startup script, look for the **"Ports"** tab in your Codespace interface:

- **Frontend**: `https://your-codespace-3001.preview.app.github.dev`
- **Backend API**: `https://your-codespace-3000.preview.app.github.dev`
- **Blockchain**: `https://your-codespace-8545.preview.app.github.dev`

## 🔧 **Troubleshooting**

### **If services don't start:**
```bash
# Stop all services first
./stop-all.sh

# Wait a moment
sleep 3

# Try again
./start-pharbit-complete.sh
```

### **If you get permission errors:**
```bash
# Make scripts executable
chmod +x *.sh
```

### **If ports are not accessible:**
1. Check the "Ports" tab in Codespaces
2. Make sure ports 3000, 3001, and 8545 are forwarded
3. Click on the forwarded port URLs

## 📊 **Service Status**

The complete startup script will show you:
- ✅ Service PIDs (Process IDs)
- ✅ Health check results
- ✅ Port information
- ✅ Access URLs for Codespaces

## 🎯 **Features Available**

Once running, you'll have access to:
- 💊 **Batch Creator**: Create pharmaceutical batches
- 🔍 **Batch Verifier**: Verify batches on blockchain
- ⛏️ **Block Miner**: Mine blocks and monitor stats
- 🔗 **MetaMask Integration**: Full wallet connectivity
- 📱 **Responsive UI**: Modern glassmorphism design

## 📝 **Logs**

All services log to the `logs/` directory:
- `logs/hardhat.log` - Blockchain node logs
- `logs/backend.log` - API server logs
- `logs/frontend.log` - React app logs

## 🚀 **Quick Reference**

```bash
# Complete setup and start
./start-pharbit-complete.sh

# Quick start (if already set up)
./quick-start.sh

# Stop everything
./stop-all.sh

# Check running processes
ps aux | grep -E "(hardhat|npm|node)" | grep -v grep

# Test backend health
curl http://localhost:3000/api/health
```

## 🎉 **Success!**

Your pharmaceutical blockchain application is now ready to use! The scripts handle all the complexity, so you can focus on building and testing your application.

**Happy coding!** 🚀