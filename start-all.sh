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
        # Windows netstat compatibility
        if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
            netstat -an | findstr ":$1 " >/dev/null 2>&1
        else
            netstat -tuln | grep -q ":$1 "
        fi
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

    # Check if root .env exists
    if [ ! -f ".env" ]; then
        print_error "Root .env file not found. Please create one before proceeding."
        exit 1
    fi

    # Sync environment variables
    print_status "Synchronizing environment variables..."
    if node sync-env.js; then
        print_success "Environment variables synchronized successfully"
    else
        print_error "Failed to synchronize environment variables"
        exit 1
    fi

    # Install all dependencies first
    print_status "Installing all project dependencies..."
    
    # Install root dependencies
    if [ ! -d "node_modules" ]; then
        print_status "Installing root dependencies..."
        npm install --force
    else
        print_success "Root dependencies already installed"
    fi
    
    # Install contracts dependencies
    if [ ! -d "contracts/node_modules" ] || [ ! -f "contracts/node_modules/.bin/hardhat" ]; then
        print_status "Installing Hardhat dependencies..."
        cd contracts
        npm install --force
        cd ..
    else
        print_success "Hardhat dependencies already installed"
    fi
    
    # Install backend dependencies
    if [ ! -d "backend/node_modules" ]; then
        print_status "Installing backend dependencies..."
        cd backend
        npm install --force
        cd ..
    else
        print_success "Backend dependencies already installed"
    fi
    
    # Install frontend dependencies
    if [ ! -d "frontend/node_modules" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend
        npm install --force
        cd ..
    else
        print_success "Frontend dependencies already installed"
    fi
    
    print_success "All dependencies installed successfully!"

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
        
        # Ensure dependencies are installed
        print_status "Installing Hardhat dependencies..."
        rm -rf node_modules package-lock.json pnpm-lock.yaml
        
        # Install with pnpm for better dependency resolution
        print_status "Installing Hardhat and dependencies..."
        pnpm install hardhat@2.19.0 ethers@5.8.0 @nomicfoundation/hardhat-toolbox@2.0.2 @openzeppelin/contracts@4.9.6 --save-dev
        
        # Verify Hardhat installation
        if [ ! -f "node_modules/.bin/hardhat" ]; then
            print_error "Hardhat binary still not found, trying direct installation..."
            npx hardhat --version
            # Try to create the binary manually
            if [ -d "node_modules/hardhat" ]; then
                print_status "Hardhat package found, creating symlink..."
                mkdir -p node_modules/.bin
                ln -sf ../hardhat/internal/cli/cli.js node_modules/.bin/hardhat
            fi
        fi
        
        # Start Hardhat with pnpm
        print_status "Starting Hardhat node..."
        pnpm hardhat node > ../logs/hardhat-node.log 2>&1 &
        HARDHAT_PID=$!
        cd ..
        
        # Wait for Hardhat node to be ready with enhanced check
        attempt=1
        max_attempts=30
        print_status "Waiting for Hardhat node to be ready..."
        while [ $attempt -le $max_attempts ]; do
            # Try a more comprehensive RPC check
            if curl -s -X POST -H "Content-Type: application/json" \
               --data '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}' \
               http://localhost:8545 | grep -q "result.*1337"; then
                print_success "Hardhat node is ready and responding correctly!"
                break
            fi
            print_status "Attempt $attempt/$max_attempts - waiting for Hardhat node..."
            sleep 2
            attempt=$((attempt + 1))
        done
        
        if [ $attempt -gt $max_attempts ]; then
            print_error "Failed to start Hardhat node or node is not responding correctly"
            print_status "Checking Hardhat logs..."
            if [ -f "../logs/hardhat-node.log" ]; then
                tail -n 20 ../logs/hardhat-node.log
            else
                print_warning "Hardhat log file not found"
            fi
            exit 1
        fi
    fi

    # Deploy smart contracts
    print_status "Deploying smart contracts..."
    cd contracts
    
    # Compile contracts
    print_status "Compiling contracts..."
    if [ -f "node_modules/.bin/hardhat" ]; then
        if ./node_modules/.bin/hardhat compile > ../logs/contract-compile.log 2>&1; then
            print_success "Contracts compiled successfully"
        else
            print_error "Contract compilation failed"
            print_status "Check logs/contract-compile.log for details"
            exit 1
        fi
    else
        if npx hardhat compile > ../logs/contract-compile.log 2>&1; then
            print_success "Contracts compiled successfully"
        else
            print_error "Contract compilation failed"
            print_status "Check logs/contract-compile.log for details"
            exit 1
        fi
    fi

    # Deploy to local network
    print_status "Deploying to local network..."
    if [ -f "node_modules/.bin/hardhat" ]; then
        if ./node_modules/.bin/hardhat run scripts/deploy.js --network hardhat > ../logs/contract-deploy.log 2>&1; then
            print_success "Smart contracts deployed successfully"
        else
            print_error "Contract deployment failed"
            print_status "Check logs/contract-deploy.log for details"
            exit 1
        fi
    else
        if npx hardhat run scripts/deploy.js --network hardhat > ../logs/contract-deploy.log 2>&1; then
            print_success "Smart contracts deployed successfully"
        else
            print_error "Contract deployment failed"
            print_status "Check logs/contract-deploy.log for details"
            exit 1
        fi
    fi
    
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
    
    cd ..

    # Start backend server
    print_service "Starting backend server with Recall Management & Anti-Counterfeiting APIs..."
    cd backend
    
    # Install backend dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing backend dependencies..."
        npm install --legacy-peer-deps
    fi
    
    # Ensure required backend packages are installed
    for pkg in express cors dotenv body-parser ethers web3 @openzeppelin/contracts
    do
        if ! npm list $pkg > /dev/null 2>&1; then
            print_status "Installing $pkg package..."
            npm install $pkg --legacy-peer-deps
        fi
    done
    
    # The backend .env file is already synchronized by sync-env.js
    # No need to create symlink or overwrite
    print_status "Using synchronized backend .env file..."

    # Ensure logs directory exists
    mkdir -p logs

    # Ensure port 3001 is free for backend
    check_and_free_port 3001

    # Start backend server with environment variables and HTTPS for Codespaces
    print_status "Starting backend with simple-server.js..."
    export PORT=3001
    export NODE_ENV=development
    if [ -n "$CODESPACES" ]; then
        HTTPS=true node simple-server.js > ../logs/backend.log 2>&1 &
    else
        node simple-server.js > ../logs/backend.log 2>&1 &
    fi
    BACKEND_PID=$!
    
    # Give the process a moment to start
    sleep 2
    
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
    
    # Install frontend dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        # Install TypeScript dependencies
        npm install --save-dev typescript @types/node @types/react @types/react-dom @types/jest @typescript-eslint/parser @typescript-eslint/eslint-plugin @types/qrcode @types/leaflet --legacy-peer-deps
        # Install required packages
        npm install ethers@5.8.0 @web3-react/core @web3-react/injected-connector web3 qrcode leaflet react-leaflet @mui/material @mui/icons-material @mui/x-data-grid @emotion/react @emotion/styled framer-motion --legacy-peer-deps
        # Install remaining dependencies
        npm install --legacy-peer-deps
    fi
    
    # The frontend .env file is already synchronized by sync-env.js
    # No need to create symlink or overwrite
    print_status "Using synchronized frontend .env file..."

    # Check and create public directory if it doesn't exist
    if [ ! -d "public" ]; then
        print_status "Creating public directory..."
        mkdir -p public
    fi

    # The frontend .env file is already synchronized by sync-env.js
    # We just need to add Codespaces-specific overrides if needed
    if [ -n "$CODESPACES" ]; then
        # Get the Codespace domain
        CODESPACE_DOMAIN="https://$CODESPACE_NAME-3000.app.github.dev"
        BACKEND_DOMAIN="https://$CODESPACE_NAME-3001.app.github.dev"
        
        # Update specific variables for Codespaces without overwriting the entire file
        print_status "Updating frontend environment for Codespaces..."
        
        # Read existing .env and update specific variables
        if [ -f ".env" ]; then
            # Create a backup
            cp .env .env.backup
            
            # Update specific variables for Codespaces
            sed -i "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=$BACKEND_DOMAIN|" .env
            sed -i "s|REACT_APP_WS_URL=.*|REACT_APP_WS_URL=wss://$CODESPACE_NAME-3001.app.github.dev|" .env
            sed -i "s|HTTPS=.*|HTTPS=true|" .env
            
            # Add HTTPS=true if not present
            if ! grep -q "HTTPS=" .env; then
                echo "HTTPS=true" >> .env
            fi
        fi
    fi

    # Start frontend with proper host and port
    print_status "Starting frontend server..."
    export PORT=3000
    
    # Clean and rebuild node_modules
    print_status "Cleaning frontend dependencies..."
    rm -rf node_modules package-lock.json
    
    # Install dependencies with specific versions
    print_status "Installing frontend dependencies..."
    npm install --save \
        react@18.2.0 \
        react-dom@18.2.0 \
        react-router-dom@6.16.0 \
        @mui/material@5.15.12 \
        @mui/icons-material@5.15.12 \
        @mui/x-data-grid@6.19.6 \
        @emotion/react@11.11.4 \
        @emotion/styled@11.11.0 \
        ethers@5.7.2 \
        web3@1.10.0 \
        @web3-react/core@6.1.9 \
        @web3-react/injected-connector@6.0.7 \
        qrcode@1.5.3 \
        leaflet@1.9.4 \
        react-leaflet@4.2.1 \
        --legacy-peer-deps

    # Install dev dependencies
    print_status "Installing development dependencies..."
    npm install --save-dev \
        typescript@4.9.5 \
        @types/node@18.15.11 \
        @types/react@18.2.21 \
        @types/react-dom@18.2.7 \
        @types/leaflet@1.9.3 \
        @types/qrcode@1.5.1 \
        @typescript-eslint/parser@5.62.0 \
        @typescript-eslint/eslint-plugin@5.62.0 \
        --legacy-peer-deps

    print_status "Starting frontend application..."
    if [ -n "$CODESPACES" ]; then
        BROWSER=none HOST=0.0.0.0 HTTPS=true npm start > ../logs/frontend.log 2>&1 &
    else
        BROWSER=none HOST=0.0.0.0 npm start > ../logs/frontend.log 2>&1 &
    fi
    FRONTEND_PID=$!

    # Give the frontend more time to start
    sleep 10
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