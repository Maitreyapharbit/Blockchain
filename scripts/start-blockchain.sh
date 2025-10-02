#!/bin/bash

# PharbitChain Blockchain Startup Script
# This script deploys smart contracts and starts the blockchain services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service_name to be ready on $host:$port..."

    while [ $attempt -le $max_attempts ]; do
        if nc -z $host $port 2>/dev/null; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - waiting for $service_name..."
        sleep 2
        attempt=$((attempt + 1))
    done

    print_error "$service_name failed to start after $max_attempts attempts"
    return 1
}

# Main execution
main() {
    print_status "Starting PharbitChain Blockchain Setup..."
    
        # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi

    # Create necessary directories
    mkdir -p logs
    mkdir -p contracts
    mkdir -p backend
    mkdir -p frontend

    # Check required commands
    print_status "Checking system requirements..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi

    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi

    if ! command_exists npx; then
        print_error "npx is not installed. Please install npx first."
        exit 1
    fi

    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi

    print_success "System requirements check passed"

    # Install dependencies
    print_status "Installing dependencies..."
    
    if [ ! -d "node_modules" ]; then
        npm install
    fi

    if [ ! -d "contracts/node_modules" ]; then
        cd contracts && npm install && cd ..
    fi

    if [ ! -d "backend/node_modules" ]; then
        cd backend && npm install && cd ..
    fi

    if [ ! -d "frontend/node_modules" ]; then
        cd frontend && npm install && cd ..
    fi

    print_success "Dependencies installed"

    # Check if Hardhat node is running
    if port_in_use 8545; then
        print_warning "Port 8545 is already in use. Hardhat node might already be running."
    else
        print_status "Starting Hardhat local node..."
        cd contracts
        npx hardhat node > ../logs/hardhat-node.log 2>&1 &
        HARDHAT_PID=$!
        cd ..
        
        # Wait for Hardhat node to be ready
        if wait_for_service localhost 8545 "Hardhat Node"; then
            print_success "Hardhat node started successfully (PID: $HARDHAT_PID)"
        else
            print_error "Failed to start Hardhat node"
            exit 1
        fi
    fi

    # Deploy contracts
    print_status "Deploying smart contracts..."
    cd contracts
    
    # Compile contracts
    print_status "Compiling contracts..."
    npx hardhat compile

    # Deploy to local network
    print_status "Deploying to local network..."
    npx hardhat run scripts/deploy.js --network localhost
    
    cd ..

    # Start backend server
    print_status "Starting backend server..."
    cd backend
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_warning "Please update .env file with your actual configuration"
    fi

    # Start backend
    npm run dev > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..

    # Wait for backend to be ready
    if wait_for_service localhost 3001 "Backend Server"; then
        print_success "Backend server started successfully (PID: $BACKEND_PID)"
    else
        print_error "Failed to start backend server"
        exit 1
    fi

    # Start frontend
    print_status "Starting frontend application..."
    cd frontend
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_warning "Please update .env file with your actual configuration"
    fi

    # Start frontend
    npm start > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..

    # Wait for frontend to be ready
    if wait_for_service localhost 3000 "Frontend Application"; then
        print_success "Frontend application started successfully (PID: $FRONTEND_PID)"
    else
        print_error "Failed to start frontend application"
        exit 1
    fi

    # Create logs directory if it doesn't exist
    mkdir -p logs

    # Save PIDs for cleanup
    echo $HARDHAT_PID > logs/hardhat.pid
    echo $BACKEND_PID > logs/backend.pid
    echo $FRONTEND_PID > logs/frontend.pid

    print_success "PharbitChain Blockchain is now running!"
    print_status "Services:"
    print_status "  - Hardhat Node: http://localhost:8545"
    print_status "  - Backend API: http://localhost:3001"
    print_status "  - Frontend App: http://localhost:3000"
    print_status "  - Contract Explorer: http://localhost:8545 (use MetaMask)"
    
    print_status "Logs are available in the logs/ directory"
    print_status "To stop all services, run: ./scripts/stop-blockchain.sh"
    
    # Keep script running
    print_status "Press Ctrl+C to stop all services..."
    
    # Trap Ctrl+C to cleanup
    trap 'echo ""; print_status "Stopping services..."; ./scripts/stop-blockchain.sh; exit 0' INT
    
    # Wait indefinitely
    while true; do
        sleep 1
    done
}

# Run main function
main "$@"