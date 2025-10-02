#!/bin/bash

# PharbitChain Backend Server Startup Script
# This script starts only the backend server

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
    print_status "Starting PharbitChain Backend Server..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi

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

    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi

    print_success "System requirements check passed"

    # Check if backend directory exists
    if [ ! -d "backend" ]; then
        print_error "Backend directory not found. Please run this script from the project root."
        exit 1
    fi

    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    
    if [ ! -d "node_modules" ]; then
        npm install
    fi

    print_success "Backend dependencies installed"

    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_warning "Please update .env file with your actual configuration"
        print_warning "Required variables: SUPABASE_URL, SUPABASE_ANON_KEY, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, JWT_SECRET"
    fi

    # Check if port is already in use
    if port_in_use 3001; then
        print_warning "Port 3001 is already in use. Backend server might already be running."
        print_status "Checking if backend is responding..."
        
        if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
            print_success "Backend server is already running and responding!"
            exit 0
        else
            print_error "Port 3001 is in use but backend is not responding. Please free the port and try again."
            exit 1
        fi
    fi

    # Create logs directory
    mkdir -p ../logs

    # Start backend server
    print_status "Starting backend server..."
    
    if [ "$1" = "--dev" ] || [ "$1" = "-d" ]; then
        print_status "Starting in development mode with hot reload..."
        npm run dev > ../logs/backend.log 2>&1 &
        BACKEND_PID=$!
    else
        print_status "Starting in production mode..."
        npm start > ../logs/backend.log 2>&1 &
        BACKEND_PID=$!
    fi

    # Wait for backend to be ready
    if wait_for_service localhost 3001 "Backend Server"; then
        print_success "Backend server started successfully (PID: $BACKEND_PID)"
    else
        print_error "Failed to start backend server"
        print_status "Check logs/backend.log for details"
        exit 1
    fi

    # Save PID for cleanup
    echo $BACKEND_PID > ../logs/backend.pid

    print_success "PharbitChain Backend Server is now running!"
    print_status "Backend API: http://localhost:3001"
    print_status "Health Check: http://localhost:3001/api/health"
    print_status "API Documentation: http://localhost:3001/api/docs"
    print_status "Logs: logs/backend.log"
    print_status "PID: $BACKEND_PID"
    
    print_status "Press Ctrl+C to stop the server..."
    
    # Trap Ctrl+C to cleanup
    trap 'echo ""; print_status "Stopping backend server..."; kill $BACKEND_PID 2>/dev/null || true; rm -f ../logs/backend.pid; print_success "Backend server stopped"; exit 0' INT
    
    # Wait indefinitely
    while true; do
        sleep 1
    done
}

# Run main function
main "$@"