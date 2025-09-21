#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting Pharbit Blockchain Application (Simple Mode)...');
console.log('===============================================');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
    console.error('❌ Error: Please run this script from the project root directory');
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

console.log('\n🔄 Starting services sequentially...');
console.log('=========================');
console.log('This will start:');
console.log('  • Hardhat blockchain node (port 8545)');
console.log('  • Backend API server (port 3000)');
console.log('  • Frontend React app (port 3001)');
console.log('\nPress Ctrl+C to stop all services\n');

// Start Hardhat first
console.log('🔗 Starting Hardhat blockchain node...');
const hardhatProcess = spawn('npx', ['hardhat', 'node'], {
    cwd: 'contracts',
    stdio: 'inherit',
    shell: true
});

// Wait a bit for Hardhat to start
setTimeout(() => {
    console.log('🔧 Starting Backend API server...');
    const backendProcess = spawn('npm', ['run', 'dev'], {
        cwd: 'backend',
        stdio: 'inherit',
        shell: true
    });

    // Wait a bit for backend to start
    setTimeout(() => {
        console.log('🌐 Starting Frontend React app...');
        const frontendProcess = spawn('npm', ['start'], {
            cwd: 'frontend',
            stdio: 'inherit',
            shell: true
        });

        console.log('\n✅ All services started!');
        console.log('🌐 Frontend: http://localhost:3001');
        console.log('🔧 Backend: http://localhost:3000');
        console.log('⛓️ Blockchain: http://localhost:8545');
        console.log('\nPress Ctrl+C to stop all services...');

        // Handle process termination
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping all services...');
            hardhatProcess.kill('SIGINT');
            backendProcess.kill('SIGINT');
            frontendProcess.kill('SIGINT');
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log('\n🛑 Stopping all services...');
            hardhatProcess.kill('SIGTERM');
            backendProcess.kill('SIGTERM');
            frontendProcess.kill('SIGTERM');
            process.exit(0);
        });

    }, 3000); // Wait 3 seconds for backend

}, 5000); // Wait 5 seconds for Hardhat
