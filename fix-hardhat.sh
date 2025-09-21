#!/bin/bash

echo "🔧 Fixing Hardhat installation..."

# Navigate to contracts directory
cd contracts

# Install Hardhat locally
echo "📦 Installing Hardhat locally..."
npm install hardhat@^2.22.0

# Verify installation
echo "✅ Verifying Hardhat installation..."
npx hardhat --version

echo "🎉 Hardhat is now installed locally!"
echo "You can now run ./quick-start-local.sh again"
