#!/bin/bash

echo "🚀 Starting PharbitChain Development Environment..."

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
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. This is not recommended for development."
fi

# Install system dependencies
print_status "Installing system dependencies..."
if command -v apt-get &> /dev/null; then
    sudo apt-get update && sudo apt-get install -y netcat-openbsd lsof curl
elif command -v yum &> /dev/null; then
    sudo yum update -y && sudo yum install -y nc lsof curl
elif command -v brew &> /dev/null; then
    brew install netcat lsof curl
else
    print_warning "Package manager not detected. Please install netcat, lsof, and curl manually."
fi

# Check Node.js version
print_status "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version: $(node -v)"

# Install project dependencies
print_status "Installing backend dependencies..."
if [ -d "backend" ]; then
    cd backend
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install backend dependencies"
        exit 1
    fi
    cd ..
    print_success "Backend dependencies installed"
else
    print_error "Backend directory not found"
    exit 1
fi

print_status "Installing frontend dependencies..."
if [ -d "frontend" ]; then
    cd frontend
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
    cd ..
    print_success "Frontend dependencies installed"
else
    print_error "Frontend directory not found"
    exit 1
fi

# Function to check if a port is in use
check_and_free_port() {
    local port=$1
    if lsof -i :"$port" > /dev/null 2>&1; then
        print_warning "Port $port is in use. Attempting to free it..."
        lsof -ti :"$port" | xargs kill -9 2>/dev/null
        sleep 2
        if lsof -i :"$port" > /dev/null 2>&1; then
            print_error "Could not free port $port. Please stop the service using this port manually."
            return 1
        else
            print_success "Port $port freed successfully"
        fi
    fi
    return 0
}

# Free up commonly used ports
print_status "Checking and freeing up ports..."
check_and_free_port 3000
check_and_free_port 3001
check_and_free_port 8545

# Check if environment files exist
print_status "Checking environment configuration..."
if [ ! -f "backend/.env" ]; then
    print_warning "Backend .env file not found. Creating from example..."
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        print_warning "Please update backend/.env with your actual configuration"
    else
        print_error "Backend .env.example not found. Please create backend/.env manually"
    fi
fi

if [ ! -f "frontend/.env" ]; then
    print_warning "Frontend .env file not found. Creating from example..."
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
        print_warning "Please update frontend/.env with your actual configuration"
    else
        print_error "Frontend .env.example not found. Please create frontend/.env manually"
    fi
fi

# Start blockchain in the background
print_status "Starting blockchain server..."
if [ -f "scripts/start-blockchain.sh" ]; then
    bash scripts/start-blockchain.sh > logs/blockchain.log 2>&1 &
    BLOCKCHAIN_PID=$!
    print_success "Blockchain server started (PID: $BLOCKCHAIN_PID)"
else
    print_warning "Blockchain start script not found. Starting with npx hardhat node..."
    npx hardhat node > logs/blockchain.log 2>&1 &
    BLOCKCHAIN_PID=$!
    print_success "Blockchain server started with Hardhat (PID: $BLOCKCHAIN_PID)"
fi

# Wait for blockchain to be ready
print_status "Waiting for blockchain to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8545 > /dev/null 2>&1; then
        print_success "Blockchain is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Blockchain failed to start within 30 seconds"
        kill $BLOCKCHAIN_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

# Start backend in the background
print_status "Starting backend server..."
if [ -f "scripts/start-server.sh" ]; then
    bash scripts/start-server.sh > logs/backend.log 2>&1 &
    BACKEND_PID=$!
else
    cd backend
    npm run dev > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
fi

print_success "Backend server started (PID: $BACKEND_PID)"

# Wait for backend to be ready
print_status "Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "Backend is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Backend failed to start within 30 seconds"
        kill $BACKEND_PID 2>/dev/null
        kill $BLOCKCHAIN_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

# Start frontend
print_status "Starting frontend server..."
cd frontend
npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

print_success "Frontend server started (PID: $FRONTEND_PID)"

# Wait for frontend to be ready
print_status "Waiting for frontend to be ready..."
for i in {1..60}; do
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        print_success "Frontend is ready!"
        break
    fi
    if [ $i -eq 60 ]; then
        print_warning "Frontend may still be starting up..."
        break
    fi
    sleep 1
done

# Create logs directory if it doesn't exist
mkdir -p logs

# Setup cleanup on script exit
cleanup() {
    print_status "Stopping all services..."
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        print_status "Frontend stopped"
    fi
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        print_status "Backend stopped"
    fi
    
    if [ ! -z "$BLOCKCHAIN_PID" ]; then
        kill $BLOCKCHAIN_PID 2>/dev/null
        print_status "Blockchain stopped"
    fi
    
    print_success "All services stopped"
    exit
}

trap cleanup SIGINT SIGTERM

# Display service information
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    🚀 PharbitChain Started! 🚀                ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  Services:                                                 ║${NC}"
echo -e "${CYAN}║  • Blockchain: http://localhost:8545                       ║${NC}"
echo -e "${CYAN}║  • Backend API: http://localhost:3000                      ║${NC}"
echo -e "${CYAN}║  • Frontend: http://localhost:3001                         ║${NC}"
echo -e "${CYAN}║  • Shipment Tracking: http://localhost:3001/shipments      ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  Logs:                                                     ║${NC}"
echo -e "${CYAN}║  • Blockchain: tail -f logs/blockchain.log                 ║${NC}"
echo -e "${CYAN}║  • Backend: tail -f logs/backend.log                       ║${NC}"
echo -e "${CYAN}║  • Frontend: tail -f logs/frontend.log                     ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  Press Ctrl+C to stop all services                         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Keep script running and show logs
print_status "Monitoring services... (Press Ctrl+C to stop all services)"
wait