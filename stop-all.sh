#!/bin/bash

# PharbitChain Complete Development Environment Stop Script
# This script stops all services including Recall Management and Anti-Counterfeiting features

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

# Function to kill process by PID file
kill_by_pid_file() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            print_status "Stopping $service_name (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            sleep 2
            if ps -p "$pid" > /dev/null 2>&1; then
                print_warning "Force killing $service_name..."
                kill -9 "$pid" 2>/dev/null || true
            fi
            print_success "$service_name stopped"
        else
            print_warning "$service_name was not running"
        fi
        rm -f "$pid_file"
    else
        print_warning "PID file for $service_name not found"
    fi
}

# Function to kill processes by port
kill_by_port() {
    local port=$1
    local service_name=$2
    
    if lsof -i :$port >/dev/null 2>&1; then
        print_status "Stopping $service_name on port $port..."
        lsof -ti :$port | xargs kill -9 2>/dev/null || true
        sleep 2
        if lsof -i :$port >/dev/null 2>&1; then
            print_warning "Some processes on port $port are still running"
        else
            print_success "$service_name stopped"
        fi
    else
        print_warning "$service_name was not running on port $port"
    fi
}

# Main execution
main() {
    echo -e "${GREEN}🛑 Stopping PharbitChain Complete Development Environment...${NC}"
    echo ""

    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi

    # Create logs directory if it doesn't exist
    mkdir -p logs

    # Stop services by PID files first
    print_status "Stopping services by PID files..."
    kill_by_pid_file "logs/frontend.pid" "Frontend Application"
    kill_by_pid_file "logs/backend.pid" "Backend Server"
    kill_by_pid_file "logs/hardhat.pid" "Hardhat Node"

    # Stop services by port as fallback
    print_status "Stopping services by port (fallback)..."
    kill_by_port 3001 "Frontend Application"
    kill_by_port 3000 "Backend Server"
    kill_by_port 8545 "Hardhat Node"

    # Additional cleanup for common processes
    print_status "Performing additional cleanup..."
    
    # Kill any remaining node processes that might be related to our project
    pkill -f "hardhat node" 2>/dev/null || true
    pkill -f "simple-server.js" 2>/dev/null || true
    pkill -f "react-scripts start" 2>/dev/null || true

    # Clean up any remaining processes on our ports
    for port in 3000 3001 8545; do
        if lsof -i :$port >/dev/null 2>&1; then
            print_warning "Cleaning up remaining processes on port $port..."
            lsof -ti :$port | xargs kill -9 2>/dev/null || true
        fi
    done

    # Clean up log files (optional)
    if [ "$1" = "--clean-logs" ] || [ "$1" = "-c" ]; then
        print_status "Cleaning up log files..."
        rm -f logs/*.log
        print_success "Log files cleaned"
    fi

    # Clean up PID files
    rm -f logs/*.pid

    print_success "All PharbitChain services stopped successfully!"
    print_status "Services stopped:"
    print_status "  - Hardhat Node (port 8545)"
    print_status "  - Backend Server (port 3000)"
    print_status "  - Frontend Application (port 3001)"
    print_status "  - Recall Management APIs"
    print_status "  - Anti-Counterfeiting APIs"
    echo ""
    print_status "To start again, run: ./start-all.sh"
    print_status "To clean logs, run: ./stop-all.sh --clean-logs"
}

# Run main function
main "$@"