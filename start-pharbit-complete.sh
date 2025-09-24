#!/bin/bash

# PharbitChain Complete Startup Script
# This script handles all setup and starts all services properly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

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

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Cleanup function
cleanup() {
    print_status "Stopping all services..."
    
    # Kill all related processes
    pkill -f "hardhat node" 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "npm start" 2>/dev/null || true
    pkill -f "concurrently" 2>/dev/null || true
    pkill -f "start-pharbit" 2>/dev/null || true
    
    print_success "All services stopped"
    exit 0
}

# Trap Ctrl+C for cleanup
trap cleanup INT

# Main execution
main() {
    print_header "🚀 PharbitChain Complete Startup"
    echo -e "${GREEN}This script will:${NC}"
    echo -e "  • Install all dependencies"
    echo -e "  • Fix Hardhat installation"
    echo -e "  • Start Hardhat blockchain node"
    echo -e "  • Start Backend API server"
    echo -e "  • Start Frontend React app"
    echo -e "  • Monitor all services"
    echo ""
    
    # Step 1: Check prerequisites
    print_step "1. Checking prerequisites..."
    
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
    
    # Step 2: Install dependencies
    print_step "2. Installing dependencies..."
    
    print_status "Installing root dependencies..."
    npm install --silent
    
    print_status "Installing backend dependencies..."
    cd backend
    npm install --silent
    cd ..
    
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install --silent
    cd ..
    
    print_status "Installing contracts dependencies..."
    cd contracts
    npm install --silent
    cd ..
    
    print_status "Installing concurrently package..."
    npm install concurrently --save-dev --silent
    
    print_success "All dependencies installed"
    
    # Step 3: Fix Hardhat installation
    print_step "3. Fixing Hardhat installation..."
    
    if [ -f "fix-hardhat.js" ]; then
        print_status "Running Hardhat fix script..."
        node fix-hardhat.js
    else
        print_status "Installing Hardhat locally in contracts directory..."
        cd contracts
        if ! npx hardhat --version > /dev/null 2>&1; then
            npm install hardhat@^2.22.0 --silent
        fi
        cd ..
    fi
    
    print_success "Hardhat installation fixed"
    
    # Step 4: Create logs directory
    print_step "4. Setting up logs directory..."
    mkdir -p logs
    print_success "Logs directory created"
    
    # Step 5: Start Hardhat node
    print_step "5. Starting Hardhat blockchain node..."
    
    # Kill any existing Hardhat processes
    pkill -f "hardhat node" 2>/dev/null || true
    sleep 2
    
    # Start Hardhat node in background
    cd contracts
    nohup npx hardhat node > ../logs/hardhat.log 2>&1 &
    HARDHAT_PID=$!
    cd ..
    
    # Wait for Hardhat to start
    print_status "Waiting for Hardhat to start..."
    sleep 5
    
    if kill -0 $HARDHAT_PID 2>/dev/null; then
        print_success "Hardhat node started (PID: $HARDHAT_PID)"
        echo $HARDHAT_PID > logs/hardhat.pid
    else
        print_error "Failed to start Hardhat node"
        print_status "Checking Hardhat logs..."
        tail -10 logs/hardhat.log
        exit 1
    fi
    
    # Step 6: Deploy contracts
    print_step "6. Deploying smart contracts..."
    
    cd contracts
    print_status "Compiling contracts..."
    npx hardhat compile --quiet
    
    print_status "Deploying contracts to local network..."
    npx hardhat run scripts/deploy.js --network localhost --quiet
    cd ..
    
    print_success "Contracts deployed successfully"
    
    # Step 7: Start backend
    print_step "7. Starting backend API server..."
    
    cd backend
    nohup npm run dev > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    print_status "Waiting for backend to start..."
    sleep 5
    
    # Test backend health
    for i in {1..10}; do
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            print_success "Backend server started and healthy (PID: $BACKEND_PID)"
            echo $BACKEND_PID > logs/backend.pid
            break
        fi
        if [ $i -eq 10 ]; then
            print_error "Backend failed to start or become healthy"
            print_status "Checking backend logs..."
            tail -10 logs/backend.log
            exit 1
        fi
        sleep 2
    done
    
    # Step 8: Start frontend
    print_step "8. Starting frontend React app..."
    
    cd frontend
    nohup npm start > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for frontend to start
    print_status "Waiting for frontend to start..."
    sleep 10
    
    # Test frontend accessibility
    for i in {1..15}; do
        if curl -s http://localhost:3001 > /dev/null 2>&1; then
            print_success "Frontend application started (PID: $FRONTEND_PID)"
            echo $FRONTEND_PID > logs/frontend.pid
            break
        fi
        if [ $i -eq 15 ]; then
            print_warning "Frontend may still be starting up..."
            print_status "Checking frontend logs..."
            tail -10 logs/frontend.log
        fi
        sleep 2
    done
    
    # Step 9: Show status
    print_step "9. Application Status"
    print_header "🎉 PharbitChain is now running!"
    echo ""
    print_success "Services Status:"
    print_status "  🔗 Hardhat Node: http://localhost:8545 (PID: $HARDHAT_PID)"
    print_status "  🚀 Backend API: http://localhost:3000 (PID: $BACKEND_PID)"
    print_status "  🌐 Frontend App: http://localhost:3001 (PID: $FRONTEND_PID)"
    echo ""
    print_success "In GitHub Codespaces:"
    print_status "  Look for the 'Ports' tab and click on the forwarded URLs:"
    print_status "  • Frontend: https://your-codespace-3001.preview.app.github.dev"
    print_status "  • Backend: https://your-codespace-3000.preview.app.github.dev"
    print_status "  • Blockchain: https://your-codespace-8545.preview.app.github.dev"
    echo ""
    print_success "Features Available:"
    print_status "  💊 Batch Creator: Create pharmaceutical batches"
    print_status "  🔍 Batch Verifier: Verify batches on blockchain"
    print_status "  ⛏️ Block Miner: Mine blocks and monitor stats"
    print_status "  🔗 MetaMask Integration: Full wallet connectivity"
    echo ""
    print_success "Logs are available in the logs/ directory"
    print_status "Press Ctrl+C to stop all services"
    echo ""
    
    # Step 10: Monitor services
    print_step "10. Monitoring services..."
    
    while true; do
        # Check if services are still running
        if ! kill -0 $HARDHAT_PID 2>/dev/null; then
            print_error "Hardhat node stopped unexpectedly"
            break
        fi
        
        if ! kill -0 $BACKEND_PID 2>/dev/null; then
            print_error "Backend server stopped unexpectedly"
            break
        fi
        
        if ! kill -0 $FRONTEND_PID 2>/dev/null; then
            print_error "Frontend application stopped unexpectedly"
            break
        fi
        
        sleep 5
    done
    
    cleanup
}

# Run main function
main "$@"