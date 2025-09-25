#!/bin/bash

echo "🚀 Starting Blockchain Development Environment..."

# Install system dependencies
echo "📦 Installing system dependencies..."
sudo apt-get update && sudo apt-get install -y netcat-openbsd

# Install project dependencies
echo "📦 Installing backend dependencies..."
npm install --prefix backend

echo "📦 Installing frontend dependencies..."
npm install --prefix frontend

# Function to check if a port is in use
check_and_free_port() {
    local port=$1
    if lsof -i :"$port" > /dev/null; then
        echo "🔄 Port $port is in use. Freeing it..."
        lsof -ti :"$port" | xargs kill -9
        sleep 2
    fi
}

# Free up commonly used ports
check_and_free_port 3000
check_and_free_port 3001
check_and_free_port 8545

# Start blockchain in the background
echo "⛓️  Starting blockchain server..."
bash scripts/start-blockchain.sh &
BLOCKCHAIN_PID=$!
sleep 5  # Give blockchain time to start

# Start backend in the background
echo "🖥️  Starting backend server..."
bash scripts/start-server.sh &
BACKEND_PID=$!
sleep 5  # Give backend time to start

# Start frontend
echo "🌐 Starting frontend server..."
npm run start --prefix frontend &
FRONTEND_PID=$!

# Setup cleanup on script exit
cleanup() {
    echo "🛑 Stopping all services..."
    kill $FRONTEND_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    kill $BLOCKCHAIN_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

echo "✨ All services started!"
echo "💡 Press Ctrl+C to stop all services"

# Keep script running and show logs
wait