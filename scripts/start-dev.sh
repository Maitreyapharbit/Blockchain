#!/bin/bash

# Kill any existing processes
echo "Cleaning up existing processes..."
kill $(lsof -t -i:8545) 2>/dev/null || true
kill $(lsof -t -i:3001) 2>/dev/null || true
kill $(lsof -t -i:3002) 2>/dev/null || true

# Start Hardhat node
echo "Starting Hardhat node..."
cd contracts
npm run node &
HARDHAT_PID=$!

# Wait for Hardhat node to be ready
echo "Waiting for Hardhat node..."
while ! nc -z localhost 8545; do
  sleep 1
done

# Start backend server
echo "Starting backend server..."
cd ../backend
npm run start &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend server..."
while ! nc -z localhost 3002; do
  sleep 1
done

# Start frontend
echo "Starting frontend..."
cd ../frontend
npm run start &
FRONTEND_PID=$!

# Save PIDs for cleanup
echo $HARDHAT_PID > ../logs/hardhat.pid
echo $BACKEND_PID > ../logs/backend.pid
echo $FRONTEND_PID > ../logs/frontend.pid

# Wait for all processes
wait