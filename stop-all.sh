#!/bin/bash

# PharbitChain Stop All Services Script

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛑 Stopping all PharbitChain services...${NC}"

# Kill all related processes
echo -e "${BLUE}Stopping Hardhat node...${NC}"
pkill -f "hardhat node" 2>/dev/null || true

echo -e "${BLUE}Stopping backend server...${NC}"
pkill -f "npm run dev" 2>/dev/null || true

echo -e "${BLUE}Stopping frontend app...${NC}"
pkill -f "npm start" 2>/dev/null || true

echo -e "${BLUE}Stopping concurrently processes...${NC}"
pkill -f "concurrently" 2>/dev/null || true

echo -e "${BLUE}Stopping start scripts...${NC}"
pkill -f "start-pharbit" 2>/dev/null || true

# Clean up PID files
rm -f logs/hardhat.pid 2>/dev/null || true
rm -f logs/backend.pid 2>/dev/null || true
rm -f logs/frontend.pid 2>/dev/null || true

echo -e "${GREEN}✅ All services stopped successfully!${NC}"
echo -e "${BLUE}You can now restart with: ./start-pharbit-complete.sh${NC}"