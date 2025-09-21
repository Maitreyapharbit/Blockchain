#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Hardhat installation...');

// Navigate to contracts directory
const contractsDir = path.join(__dirname, 'contracts');

if (!fs.existsSync(contractsDir)) {
    console.error('❌ Error: contracts directory not found');
    process.exit(1);
}

process.chdir(contractsDir);

try {
    // Install Hardhat locally
    console.log('📦 Installing Hardhat locally...');
    execSync('npm install hardhat@^2.22.0', { stdio: 'inherit' });
    
    // Verify installation
    console.log('✅ Verifying Hardhat installation...');
    execSync('npx hardhat --version', { stdio: 'inherit' });
    
    console.log('🎉 Hardhat is now installed locally!');
    console.log('You can now run ./quick-start-local.sh again');
    
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
