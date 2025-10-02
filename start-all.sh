#!/bin/bash

# PharbitChain Simple Startup Script
# This script starts all services assuming dependencies are already installed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

print_feature() {
    echo -e "${PURPLE}[FEATURE]${NC} $1"
}

print_service() {
    echo -e "${CYAN}[SERVICE]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    if command_exists lsof; then
        lsof -i :$1 >/dev/null 2>&1
    elif command_exists netstat; then
        netstat -tuln | grep -q ":$1 "
    elif command_exists ss; then
        ss -tuln | grep -q ":$1 "
    elif command_exists curl; then
        curl -s --connect-timeout 1 http://localhost:$1 >/dev/null 2>&1
    else
        # Fallback: assume port is not in use
        return 1
    fi
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
        # Try different methods to check if port is open
        if command_exists curl; then
            if curl -s --connect-timeout 2 http://$host:$port >/dev/null 2>&1; then
                print_success "$service_name is ready!"
                return 0
            fi
        elif command_exists wget; then
            if wget -q --timeout=2 --tries=1 http://$host:$port >/dev/null 2>&1; then
                print_success "$service_name is ready!"
                return 0
            fi
        elif command_exists telnet; then
            if echo "quit" | telnet $host $port 2>/dev/null | grep -q "Connected"; then
                print_success "$service_name is ready!"
                return 0
            fi
        else
            # Fallback: just wait and assume it's ready
            if [ $attempt -eq $max_attempts ]; then
                print_success "$service_name is ready! (assumed after $max_attempts attempts)"
                return 0
            fi
        fi
        
        print_status "Attempt $attempt/$max_attempts - waiting for $service_name..."
        sleep 2
        attempt=$((attempt + 1))
    done

    print_error "$service_name failed to start after $max_attempts attempts"
    return 1
}

# Function to check if a port is in use and free it
check_and_free_port() {
    local port=$1
    if port_in_use $port; then
        print_warning "Port $port is in use. Freeing it..."
        if command_exists lsof; then
            lsof -ti :$port | xargs kill -9 2>/dev/null || true
        elif command_exists fuser; then
            fuser -k $port/tcp 2>/dev/null || true
        fi
        sleep 2
    fi
}

# Main execution
main() {
    echo -e "${GREEN}🚀 Starting PharbitChain Development Environment...${NC}"
    echo -e "${PURPLE}📋 Including Recall Management & Anti-Counterfeiting Features${NC}"
    echo ""

    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi

    # Create necessary directories
    mkdir -p logs
    mkdir -p backend/logs
    mkdir -p frontend/logs

    # Free up commonly used ports
    print_status "Checking and freeing up ports..."
    check_and_free_port 3000
    check_and_free_port 3001
    check_and_free_port 8545

    # Start Hardhat blockchain node
    print_service "Starting Hardhat blockchain node..."
    if port_in_use 8545; then
        print_warning "Port 8545 is already in use. Hardhat node might already be running."
        HARDHAT_PID=$(lsof -ti :8545 | head -1)
        if [ -n "$HARDHAT_PID" ]; then
            print_success "Using existing Hardhat node (PID: $HARDHAT_PID)"
        fi
    else
        cd contracts
        npx hardhat node > ../logs/hardhat-node.log 2>&1 &
        HARDHAT_PID=$!
        cd ..
        
        # Wait for Hardhat node to be ready
        if wait_for_service localhost 8545 "Hardhat Node"; then
            print_success "Hardhat node started successfully (PID: $HARDHAT_PID)"
        else
            print_error "Failed to start Hardhat node"
            print_status "Check logs/hardhat-node.log for details"
            exit 1
        fi
    fi

    # Deploy smart contracts
    print_status "Deploying smart contracts..."
    cd contracts
    
    # Compile contracts
    print_status "Compiling contracts..."
    if npx hardhat compile > ../logs/contract-compile.log 2>&1; then
        print_success "Contracts compiled successfully"
    else
        print_error "Contract compilation failed"
        print_status "Check logs/contract-compile.log for details"
        exit 1
    fi

    # Deploy to local network
    print_status "Deploying to local network..."
    if npx hardhat run scripts/deploy.js --network hardhat > ../logs/contract-deploy.log 2>&1; then
        print_success "Smart contracts deployed successfully"
        
        # Extract contract addresses from deployment log
        RECALL_CONTRACT=$(grep "RecallManagement deployed to:" ../logs/contract-deploy.log | awk '{print $NF}')
        COUNTERFEIT_CONTRACT=$(grep "AntiCounterfeitVerification deployed to:" ../logs/contract-deploy.log | awk '{print $NF}')
        
        if [ -n "$RECALL_CONTRACT" ] && [ -n "$COUNTERFEIT_CONTRACT" ]; then
            print_success "Contract addresses extracted:"
            print_success "  - Recall Management: $RECALL_CONTRACT"
            print_success "  - Anti-Counterfeiting: $COUNTERFEIT_CONTRACT"
        else
            print_warning "Could not extract contract addresses from deployment log"
        fi
    else
        print_error "Contract deployment failed"
        print_status "Check logs/contract-deploy.log for details"
        exit 1
    fi
    
    cd ..

    # Start backend server
    print_service "Starting backend server with Recall Management & Anti-Counterfeiting APIs..."
    cd backend
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating basic configuration..."
        cat > .env << EOF
# Backend Configuration
NODE_ENV=development
PORT=3001
HOST=localhost
CORS_ORIGIN=http://localhost:3000

# Database Configuration
DATABASE_URL=postgresql://localhost:5432/pharbit

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRY=24h

# Blockchain Configuration
ETHEREUM_RPC_URL=http://localhost:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
EOF
    else
        print_success ".env file found, using existing configuration"
    fi

    # Copy root .env to backend if it exists and backend doesn't have one
    if [ -f "../.env" ] && [ ! -f ".env" ]; then
        print_status "Copying root .env to backend directory..."
        cp ../.env .env
    fi

    # Ensure port 3001 is free for backend
    check_and_free_port 3001

    # Start backend server
    print_status "Starting backend with simple-server.js..."
    node simple-server.js > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    print_status "Backend server started with PID: $BACKEND_PID"
    cd ..

    # Wait for backend to be ready
    if wait_for_service localhost 3001 "Backend Server"; then
        print_success "Backend server started successfully (PID: $BACKEND_PID)"
        print_feature "✅ Recall Management API: http://localhost:3001/api/recalls"
        print_feature "✅ Anti-Counterfeiting API: http://localhost:3001/api/counterfeit"
        print_feature "✅ Health Check: http://localhost:3001/api/health"
    else
        print_error "Failed to start backend server"
        print_status "Checking backend logs for details..."
        
        # Show last few lines of the log
        if [ -f "logs/backend.log" ]; then
            print_status "Last 10 lines of backend.log:"
            tail -10 logs/backend.log | sed 's/^/  /'
        else
            print_warning "Backend log file not found"
        fi
        
        # Check if backend is actually running on a different port
        print_status "Checking if backend is running on alternative ports..."
        if curl -s http://localhost:3000/health >/dev/null 2>&1; then
            print_warning "Backend appears to be running on port 3000 instead of 3001"
            print_status "This might be due to a port conflict. Continuing with port 3000..."
        else
            print_error "Backend startup failed. Please check the logs and try again."
            exit 1
        fi
    fi

    # Start frontend
    print_service "Starting frontend application..."
    cd frontend
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating basic configuration..."
        cat > .env << EOF
# Frontend Configuration
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001

# Blockchain Configuration
REACT_APP_ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_CHAIN_ID=1337
REACT_APP_CHAIN_NAME="Hardhat Local"

# Contract Addresses
REACT_APP_RECALL_CONTRACT_ADDRESS=${RECALL_CONTRACT:-}
REACT_APP_COUNTERFEIT_CONTRACT_ADDRESS=${COUNTERFEIT_CONTRACT:-}

# Development Configuration
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
EOF
    else
        print_success ".env file found, using existing configuration"
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
        print_status "Check logs/frontend.log for details"
        exit 1
    fi

    # Save PIDs for cleanup
    echo $HARDHAT_PID > logs/hardhat.pid
    echo $BACKEND_PID > logs/backend.pid
    echo $FRONTEND_PID > logs/frontend.pid

    # Verify all services are running
    print_status "Verifying all services are running..."
    
    # Check Hardhat node
    if port_in_use 8545; then
        print_success "✅ Hardhat Node is running on port 8545"
    else
        print_error "❌ Hardhat Node is not running on port 8545"
    fi
    
    # Check backend
    if port_in_use 3001; then
        print_success "✅ Backend API is running on port 3001"
    elif port_in_use 3000; then
        print_warning "⚠️ Backend API is running on port 3000 (port conflict with frontend)"
    else
        print_error "❌ Backend API is not running on expected ports"
    fi
    
    # Check frontend
    if port_in_use 3000; then
        print_success "✅ Frontend App is running on port 3000"
    else
        print_error "❌ Frontend App is not running on port 3000"
    fi

    # Display success message
    echo ""
    echo -e "${GREEN}✨ PharbitChain Development Environment is now running!${NC}"
    echo ""
    print_service "🔗 Services:"
    print_service "  - Hardhat Node: http://localhost:8545"
    print_service "  - Backend API: http://localhost:3001"
    print_service "  - Frontend App: http://localhost:3000"
    echo ""
    print_feature "🚨 Recall Management Features:"
    print_feature "  - API: http://localhost:3001/api/recalls"
    print_feature "  - Health Check: http://localhost:3001/api/health"
    echo ""
    print_feature "🛡️ Anti-Counterfeiting Features:"
    print_feature "  - API: http://localhost:3001/api/counterfeit"
    print_feature "  - Verification: http://localhost:3001/api/counterfeit/verify"
    echo ""
    print_status "📝 Logs are available in the logs/ directory"
    print_status "🛑 To stop all services, run: ./stop-all.sh or press Ctrl+C"
    echo ""
    print_status "Press Ctrl+C to stop all services..."
    
    # Setup cleanup on script exit
    cleanup() {
        echo ""
        print_status "🛑 Stopping all services..."
        
        # Stop frontend
        if [ -n "$FRONTEND_PID" ] && kill -0 $FRONTEND_PID 2>/dev/null; then
            print_status "Stopping frontend (PID: $FRONTEND_PID)..."
            kill $FRONTEND_PID 2>/dev/null || true
        fi
        
        # Stop backend
        if [ -n "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
            print_status "Stopping backend (PID: $BACKEND_PID)..."
            kill $BACKEND_PID 2>/dev/null || true
        fi
        
        # Stop Hardhat node
        if [ -n "$HARDHAT_PID" ] && kill -0 $HARDHAT_PID 2>/dev/null; then
            print_status "Stopping Hardhat node (PID: $HARDHAT_PID)..."
            kill $HARDHAT_PID 2>/dev/null || true
        fi
        
        # Clean up any remaining processes on our ports
        check_and_free_port 3000
        check_and_free_port 3001
        check_and_free_port 8545
        
        print_success "All services stopped"
        exit 0
    }

    trap cleanup SIGINT SIGTERM

    # Keep script running
    while true; do
        sleep 1
    done
}

# Run main function
main "$@"