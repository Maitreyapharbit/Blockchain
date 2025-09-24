#!/bin/bash

# PharbitChain Quick Start Script
# Simple version for quick startup

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting PharbitChain...${NC}"

# Kill existing processes
echo -e "${BLUE}Cleaning up existing processes...${NC}"
pkill -f "hardhat node" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
sleep 2

# Install concurrently if missing
echo -e "${BLUE}Installing dependencies...${NC}"
npm install concurrently --save-dev --silent

# Start Hardhat
echo -e "${BLUE}Starting Hardhat blockchain...${NC}"
cd contracts
nohup npx hardhat node > ../logs/hardhat.log 2>&1 &
cd ..
sleep 5

# Start Backend
echo -e "${BLUE}Starting backend API...${NC}"
cd backend
nohup npm run dev > ../logs/backend.log 2>&1 &
cd ..
sleep 3

# Start Frontend
echo -e "${BLUE}Starting frontend app...${NC}"
cd frontend
nohup npm start > ../logs/frontend.log 2>&1 &
cd ..
sleep 5

# Check status
echo -e "${GREEN}✅ All services started!${NC}"
echo -e "${GREEN}Frontend: http://localhost:3001${NC}"
echo -e "${GREEN}Backend: http://localhost:3000${NC}"
echo -e "${GREEN}Blockchain: http://localhost:8545${NC}"
echo ""
echo -e "${BLUE}In Codespaces, check the 'Ports' tab for forwarded URLs${NC}"
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"

# Keep script running
wait