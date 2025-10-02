#!/bin/bash

# PharbitChain Complete Development Environment Startup Script
# This script starts all services including the new Recall Management and Anti-Counterfeiting features

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

# Function to check if a port is in use and free it
check_and_free_port() {
    local port=$1
    if port_in_use $port; then
        print_warning "Port $port is in use. Freeing it..."
        lsof -ti :$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Main execution
main() {
    echo -e "${GREEN}🚀 Starting PharbitChain Complete Development Environment...${NC}"
    echo -e "${PURPLE}📋 Including Recall Management & Anti-Counterfeiting Features${NC}"
    echo ""

    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi

    # Check system requirements
    print_status "Checking system requirements..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi

    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi

    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi

    print_success "System requirements check passed"

    # Install system dependencies
    print_status "Installing system dependencies..."
    if command_exists apt-get; then
        sudo apt-get update >/dev/null 2>&1 && sudo apt-get install -y netcat-openbsd >/dev/null 2>&1 || true
    fi

    # Create necessary directories
    mkdir -p logs
    mkdir -p backend/logs
    mkdir -p frontend/logs

    # Install project dependencies
    print_status "Installing project dependencies..."
    
    if [ ! -d "node_modules" ]; then
        print_status "Installing root dependencies..."
        npm install >/dev/null 2>&1
    fi

    if [ ! -d "backend/node_modules" ]; then
        print_status "Installing backend dependencies..."
        cd backend && npm install >/dev/null 2>&1 && cd ..
    fi

    if [ ! -d "frontend/node_modules" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend && npm install >/dev/null 2>&1 && cd ..
    fi

    print_success "Dependencies installed"

    # Free up commonly used ports
    print_status "Checking and freeing up ports..."
    check_and_free_port 3000
    check_and_free_port 3001
    check_and_free_port 8545

    # Start Hardhat blockchain node
    print_service "Starting Hardhat blockchain node..."
    if port_in_use 8545; then
        print_warning "Port 8545 is already in use. Hardhat node might already be running."
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
            exit 1
        fi
    fi

    # Deploy smart contracts
    print_status "Deploying smart contracts..."
    cd contracts
    
    # Compile contracts
    print_status "Compiling contracts..."
    npx hardhat compile >/dev/null 2>&1

    # Deploy to local network
    print_status "Deploying to local network..."
    npx hardhat run scripts/deploy.js --network localhost >/dev/null 2>&1
    
    cd ..
    print_success "Smart contracts deployed"

    # Start backend server with new features
    print_service "Starting backend server with Recall Management & Anti-Counterfeiting APIs..."
    cd backend
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
        else
            # Create a basic .env file
            cat > .env << EOF
# Backend Configuration
NODE_ENV=development
PORT=3000
HOST=localhost
CORS_ORIGIN=http://localhost:3001

# Database Configuration
DATABASE_URL=postgresql://localhost:5432/pharbit

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRY=24h

# Blockchain Configuration
ETHEREUM_RPC_URL=http://localhost:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Supabase Configuration (optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# AWS Configuration (optional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
EOF
        fi
        print_warning "Please update .env file with your actual configuration"
    fi

    # Start backend server
    node simple-server.js > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..

    # Wait for backend to be ready
    if wait_for_service localhost 3000 "Backend Server"; then
        print_success "Backend server started successfully (PID: $BACKEND_PID)"
        print_feature "✅ Recall Management API: http://localhost:3000/api/recalls"
        print_feature "✅ Anti-Counterfeiting API: http://localhost:3000/api/counterfeit"
        print_feature "✅ Health Check: http://localhost:3000/api/health"
    else
        print_error "Failed to start backend server"
        print_status "Check logs/backend.log for details"
        exit 1
    fi

    # Start frontend
    print_service "Starting frontend application with new features..."
    cd frontend
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
        else
            # Create a basic .env file
            cat > .env << EOF
# Frontend Configuration
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=ws://localhost:3000

# Supabase Configuration (optional)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# Blockchain Configuration
REACT_APP_CHAIN_ID=31337
REACT_APP_CHAIN_NAME="Hardhat Local"
REACT_APP_RPC_URL=http://localhost:8545

# Development Configuration
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
EOF
        fi
        print_warning "Please update .env file with your actual configuration"
    fi

    # Start frontend
    npm start > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..

    # Wait for frontend to be ready
    if wait_for_service localhost 3001 "Frontend Application"; then
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

    # Display success message
    echo ""
    echo -e "${GREEN}✨ PharbitChain Complete Development Environment is now running!${NC}"
    echo ""
    print_service "🔗 Services:"
    print_service "  - Hardhat Node: http://localhost:8545"
    print_service "  - Backend API: http://localhost:3000"
    print_service "  - Frontend App: http://localhost:3001"
    print_service "  - Contract Explorer: http://localhost:8545 (use MetaMask)"
    echo ""
    print_feature "🚨 Recall Management Features:"
    print_feature "  - Quick recall initiation: http://localhost:3001 (scroll down)"
    print_feature "  - Affected batch identification"
    print_feature "  - Distribution tracking for rapid response"
    print_feature "  - Stakeholder notification system"
    echo ""
    print_feature "🛡️ Anti-Counterfeiting Features:"
    print_feature "  - Visual verification indicators (QR, hologram, serial)"
    print_feature "  - Suspicious activity flagging"
    print_feature "  - Reporting mechanism for suspected fakes"
    print_feature "  - Security feature generation and validation"
    echo ""
    print_status "📊 API Endpoints:"
    print_status "  - Recall Management: /api/recalls/*"
    print_status "  - Anti-Counterfeiting: /api/counterfeit/*"
    print_status "  - Health Check: /api/health"
    echo ""
    print_status "📝 Logs are available in the logs/ directory"
    print_status "🛑 To stop all services, run: ./scripts/stop-blockchain.sh"
    echo ""
    print_status "Press Ctrl+C to stop all services..."
    
    # Setup cleanup on script exit
    cleanup() {
        echo ""
        print_status "🛑 Stopping all services..."
        kill $FRONTEND_PID 2>/dev/null || true
        kill $BACKEND_PID 2>/dev/null || true
        kill $HARDHAT_PID 2>/dev/null || true
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