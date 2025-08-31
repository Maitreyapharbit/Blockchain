#!/bin/bash

echo "🚀 Pharbit Blockchain - Transaction Creation"
echo "============================================"
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

# Create the transaction with specific details
echo ""
echo "🎯 Creating your transaction block..."
echo "Sender: 0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b"
echo "Receiver: 6M3uvRFJSR3hcJab22fSAQGUgXxiMKgdg225k3Pq9qpR"
echo "Quantity: 10"
echo ""
node create-transaction.js

echo ""
echo "🎉 Congratulations! Your transaction block has been created!"
echo "The blockchain now contains your transaction with the specified details:"
echo "  - Sender: 0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b"
echo "  - Receiver: 6M3uvRFJSR3hcJab22fSAQGUgXxiMKgdg225k3Pq9qpR"
echo "  - Quantity: 10"
echo ""
echo "Next steps:"
echo "1. View the transaction history"
echo "2. Check account balances"
echo "3. Create more transactions"
echo "4. Explore the blockchain data"