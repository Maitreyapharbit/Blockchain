#!/bin/bash

# Gracefully stop all services
echo "Stopping all services..."

# Stop frontend
if [ -f logs/frontend.pid ]; then
  kill $(cat logs/frontend.pid) 2>/dev/null || true
  rm logs/frontend.pid
fi

# Stop backend
if [ -f logs/backend.pid ]; then
  kill $(cat logs/backend.pid) 2>/dev/null || true
  rm logs/backend.pid
fi

# Stop Hardhat node
if [ -f logs/hardhat.pid ]; then
  kill $(cat logs/hardhat.pid) 2>/dev/null || true
  rm logs/hardhat.pid
fi

# Double-check ports are clear
kill $(lsof -t -i:8545) 2>/dev/null || true
kill $(lsof -t -i:3001) 2>/dev/null || true
kill $(lsof -t -i:3002) 2>/dev/null || true

echo "All services stopped"