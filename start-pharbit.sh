#!/bin/bash

echo "🚀 Starting Pharbit Blockchain Application..."
echo "==============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected: Directory containing package.json"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
NODE_ENV=development
PORT=3000
HOST=localhost
ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_CHAIN_ID=31337
EOF
    echo "✅ .env file created"
fi

# Copy .env to backend directory
if [ -f ".env" ]; then
    cp .env backend/.env
    echo "✅ .env copied to backend directory"
fi

echo ""
echo "🔄 Starting all services..."
echo "========================="
echo "This will start:"
echo "  • Hardhat blockchain node (port 8545)"
echo "  • Backend API server (port 3000)"
echo "  • Frontend React app (port 3001)"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start all services using npm run dev
npm run dev
