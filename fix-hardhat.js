#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

console.log('🔧 Fixing Hardhat installation...');

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Navigate to contracts directory
const contractsDir = join(__dirname, 'contracts');

if (!existsSync(contractsDir)) {
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
