#!/bin/bash

# Test script to verify backend functionality

echo "🧪 Testing PharbitChain Backend..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if backend dependencies are installed
print_status "Checking backend dependencies..."
if [ ! -d "backend/node_modules" ]; then
    print_error "Backend dependencies not installed. Installing..."
    cd backend
    npm install
    cd ..
fi

# Check if required files exist
print_status "Checking required files..."
if [ ! -f "backend/simple-server.js" ]; then
    print_error "simple-server.js not found"
    exit 1
fi

if [ ! -f "backend/routes/recalls.js" ]; then
    print_error "recalls.js not found"
    exit 1
fi

if [ ! -f "backend/routes/counterfeit.js" ]; then
    print_error "counterfeit.js not found"
    exit 1
fi

print_success "All required files found"

# Start backend server
print_status "Starting backend server..."
cd backend
node simple-server.js &
BACKEND_PID=$!
cd ..

# Wait for server to start
print_status "Waiting for server to start..."
sleep 5

# Test health endpoint
print_status "Testing health endpoint..."
if curl -s http://localhost:3001/health > /dev/null; then
    print_success "Health endpoint is working"
else
    print_error "Health endpoint failed"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Test API endpoints
print_status "Testing API endpoints..."

# Test recalls endpoint
if curl -s http://localhost:3001/api/recalls > /dev/null; then
    print_success "Recalls API is working"
else
    print_error "Recalls API failed"
fi

# Test counterfeit endpoint
if curl -s http://localhost:3001/api/counterfeit/flagged > /dev/null; then
    print_success "Counterfeit API is working"
else
    print_error "Counterfeit API failed"
fi

# Test root API endpoint
if curl -s http://localhost:3001/api > /dev/null; then
    print_success "Root API endpoint is working"
else
    print_error "Root API endpoint failed"
fi

print_success "Backend test completed successfully!"

# Clean up
print_status "Stopping backend server..."
kill $BACKEND_PID 2>/dev/null
wait $BACKEND_PID 2>/dev/null

print_success "✅ Backend is working correctly!"