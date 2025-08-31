#!/bin/bash

echo "🚀 Pharbit Blockchain - Quick Start"
echo "==================================="
echo ""

# Make scripts executable
chmod +x start-first-block.sh

# Start the network
echo "🌐 Starting the blockchain network..."
./start-first-block.sh

# Install client dependencies
echo ""
echo "📦 Installing client dependencies..."
cd client
npm install

# Create the first block
echo ""
echo "🎯 Creating your first block..."
node create-first-block.js

echo ""
echo "🎉 Congratulations! Your first block has been created!"
echo "You can now explore the blockchain and create more blocks."
echo ""
echo "Next steps:"
echo "1. View the blockchain explorer (if available)"
echo "2. Create more medicine batches"
echo "3. Transfer medicines between organizations"
echo "4. Monitor temperature and location updates"