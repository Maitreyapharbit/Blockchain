#!/bin/bash

# PharbitChain Quick Local Setup
# This script sets up everything needed to run locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js $(node -v) is installed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    # Install backend dependencies
    if [ ! -d "backend/node_modules" ]; then
        cd backend && npm install && cd ..
    fi
    
    # Install frontend dependencies
    if [ ! -d "frontend/node_modules" ]; then
        cd frontend && npm install && cd ..
    fi
    
    # Install contract dependencies
    if [ ! -d "contracts/node_modules" ]; then
        cd contracts && npm install && cd ..
    fi
    
    # Ensure Hardhat is installed locally in contracts directory
    cd contracts
    if ! npx hardhat --version > /dev/null 2>&1; then
        print_status "Installing Hardhat locally..."
        npm install hardhat@^2.22.0
    fi
    cd ..
    
    print_success "All dependencies installed"
}

# Create environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Backend .env
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        print_warning "Created backend/.env from example. Please update with your credentials."
    fi
    
    # Frontend .env
    if [ ! -f "frontend/.env" ]; then
        cp frontend/.env.example frontend/.env
        print_warning "Created frontend/.env from example. Please update with your credentials."
    fi
    
    print_success "Environment files created"
}

# Create logs directory
setup_logs() {
    print_status "Setting up logs directory..."
    mkdir -p logs
    print_success "Logs directory created"
}

# Start Hardhat node
start_hardhat() {
    print_status "Starting Hardhat local node..."
    
    # Kill any existing Hardhat processes
    pkill -f "hardhat node" || true
    
    # Start Hardhat node in background
    cd contracts
    npx hardhat node > ../logs/hardhat.log 2>&1 &
    HARDHAT_PID=$!
    cd ..
    
    # Wait for Hardhat to start
    sleep 5
    
    if kill -0 $HARDHAT_PID 2>/dev/null; then
        print_success "Hardhat node started (PID: $HARDHAT_PID)"
        echo $HARDHAT_PID > logs/hardhat.pid
    else
        print_error "Failed to start Hardhat node"
        exit 1
    fi
}

# Deploy contracts
deploy_contracts() {
    print_status "Deploying smart contracts..."
    
    cd contracts
    
    # Compile contracts
    npx hardhat compile
    
    # Deploy to local network
    npx hardhat run scripts/deploy.js --network localhost
    
    cd ..
    
    print_success "Contracts deployed successfully"
}

# Start backend
start_backend() {
    print_status "Starting backend server..."
    
    cd backend
    
    # Start backend in background
    npm run dev > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    sleep 3
    
    if kill -0 $BACKEND_PID 2>/dev/null; then
        print_success "Backend server started (PID: $BACKEND_PID)"
        echo $BACKEND_PID > logs/backend.pid
    else
        print_error "Failed to start backend server"
        exit 1
    fi
}

# Start frontend
start_frontend() {
    print_status "Starting frontend application..."
    
    cd frontend
    
    # Start frontend in background
    npm start > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for frontend to start
    sleep 5
    
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        print_success "Frontend application started (PID: $FRONTEND_PID)"
        echo $FRONTEND_PID > logs/frontend.pid
    else
        print_error "Failed to start frontend application"
        exit 1
    fi
}

# Show status
show_status() {
    print_success "PharbitChain is now running locally!"
    echo ""
    print_status "Services:"
    print_status "  - Hardhat Node: http://localhost:8545"
    print_status "  - Backend API: http://localhost:3001"
    print_status "  - Frontend App: http://localhost:3000"
    print_status "  - API Health: http://localhost:3001/health"
    echo ""
    print_status "MetaMask Setup:"
    print_status "  - Network Name: Hardhat Local"
    print_status "  - RPC URL: http://localhost:8545"
    print_status "  - Chain ID: 31337"
    print_status "  - Currency Symbol: ETH"
    echo ""
    print_status "Logs are available in the logs/ directory"
    print_status "To stop all services, run: ./stop-local.sh"
    echo ""
    print_status "Press Ctrl+C to stop all services..."
}

# Cleanup function
cleanup() {
    print_status "Stopping all services..."
    
    # Stop services by PID
    if [ -f "logs/hardhat.pid" ]; then
        HARDHAT_PID=$(cat logs/hardhat.pid)
        kill $HARDHAT_PID 2>/dev/null || true
        rm -f logs/hardhat.pid
    fi
    
    if [ -f "logs/backend.pid" ]; then
        BACKEND_PID=$(cat logs/backend.pid)
        kill $BACKEND_PID 2>/dev/null || true
        rm -f logs/backend.pid
    fi
    
    if [ -f "logs/frontend.pid" ]; then
        FRONTEND_PID=$(cat logs/frontend.pid)
        kill $FRONTEND_PID 2>/dev/null || true
        rm -f logs/frontend.pid
    fi
    
    # Kill any remaining processes
    pkill -f "hardhat node" || true
    pkill -f "npm run dev" || true
    pkill -f "npm start" || true
    
    print_success "All services stopped"
    exit 0
}

# Main execution
main() {
    print_status "Starting PharbitChain Local Setup..."
    
    # Check prerequisites
    check_node
    
    # Setup
    install_dependencies
    setup_environment
    setup_logs
    
    # Start services
    start_hardhat
    deploy_contracts
    start_backend
    start_frontend
    
    # Show status
    show_status
    
    # Trap Ctrl+C for cleanup
    trap cleanup INT
    
    # Keep script running
    while true; do
        sleep 1
    done
}

# Run main function
main "$@"