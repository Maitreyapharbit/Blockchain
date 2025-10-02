#!/bin/bash

# PharbitChain Blockchain Stop Script
# This script stops all blockchain services

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

# Function to kill process by PID
kill_process() {
    local pid=$1
    local name=$2
    
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        print_status "Stopping $name (PID: $pid)..."
        kill "$pid"
        
        # Wait for process to stop
        local count=0
        while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
            sleep 1
            count=$((count + 1))
        done
        
        if kill -0 "$pid" 2>/dev/null; then
            print_warning "Force killing $name..."
            kill -9 "$pid" 2>/dev/null || true
        fi
        
        print_success "$name stopped"
    else
        print_warning "$name is not running"
    fi
}

# Function to kill processes by port
kill_by_port() {
    local port=$1
    local name=$2
    
    local pids=$(lsof -ti :$port 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        print_status "Stopping $name on port $port..."
        echo "$pids" | xargs kill -9 2>/dev/null || true
        print_success "$name stopped"
    else
        print_warning "$name is not running on port $port"
    fi
}

# Main execution
main() {
    print_status "Stopping PharbitChain Blockchain services..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi

    # Create logs directory if it doesn't exist
    mkdir -p logs

    # Stop services by PID files
    if [ -f "logs/hardhat.pid" ]; then
        HARDHAT_PID=$(cat logs/hardhat.pid)
        kill_process "$HARDHAT_PID" "Hardhat Node"
        rm -f logs/hardhat.pid
    fi

    if [ -f "logs/backend.pid" ]; then
        BACKEND_PID=$(cat logs/backend.pid)
        kill_process "$BACKEND_PID" "Backend Server"
        rm -f logs/backend.pid
    fi

    if [ -f "logs/frontend.pid" ]; then
        FRONTEND_PID=$(cat logs/frontend.pid)
        kill_process "$FRONTEND_PID" "Frontend Application"
        rm -f logs/frontend.pid
    fi

    # Stop services by port (fallback)
    kill_by_port 8545 "Hardhat Node"
    kill_by_port 3001 "Backend Server"
    kill_by_port 3000 "Frontend Application"

    # Kill any remaining Node.js processes related to this project
    print_status "Cleaning up remaining processes..."
    
    # Find and kill processes with our project path
    local project_path=$(pwd)
    local node_pids=$(ps aux | grep -E "node.*$project_path" | grep -v grep | awk '{print $2}' || true)
    
    if [ -n "$node_pids" ]; then
        echo "$node_pids" | xargs kill -9 2>/dev/null || true
        print_success "Cleaned up remaining Node.js processes"
    fi

    # Clean up log files
    if [ -d "logs" ]; then
        print_status "Cleaning up log files..."
        rm -f logs/*.pid
        print_success "Log files cleaned up"
    fi

    print_success "All PharbitChain Blockchain services stopped!"
    print_status "You can restart the services by running: ./scripts/start-blockchain.sh"
}

# Run main function
main "$@"