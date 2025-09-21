#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Pharbit Blockchain Application...');
console.log('===============================================');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
    console.error('❌ Error: Please run this script from the project root directory');
    console.error('   Current directory:', process.cwd());
    console.error('   Expected: Directory containing package.json');
    process.exit(1);
}

// Create .env file if it doesn't exist
if (!fs.existsSync('.env')) {
    console.log('📝 Creating .env file...');
    const envContent = `NODE_ENV=development
PORT=3000
HOST=localhost
ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_CHAIN_ID=31337
`;
    
    fs.writeFileSync('.env', envContent);
    console.log('✅ .env file created');
}

// Copy .env to backend directory
if (fs.existsSync('.env')) {
    fs.copyFileSync('.env', 'backend/.env');
    console.log('✅ .env copied to backend directory');
}

console.log('\n🔄 Starting all services...');
console.log('=========================');
console.log('This will start:');
console.log('  • Hardhat blockchain node (port 8545)');
console.log('  • Backend API server (port 3000)');
console.log('  • Frontend React app (port 3001)');
console.log('\nPress Ctrl+C to stop all services\n');

// Start all services using npm run dev
const child = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping all services...');
    child.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Stopping all services...');
    child.kill('SIGTERM');
    process.exit(0);
});

child.on('close', (code) => {
    console.log(`\n✅ All services stopped with code ${code}`);
    process.exit(code);
});

child.on('error', (err) => {
    console.error('❌ Error starting services:', err);
    process.exit(1);
});
