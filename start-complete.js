#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Pharbit Blockchain Application (Complete Mode)...');
console.log('===============================================');
console.log('📋 Including Recall Management & Anti-Counterfeiting Features');
console.log('');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
    console.error('❌ Error: Please run this script from the project root directory');
    console.error('   Current directory:', process.cwd());
    console.error('   Expected: Directory containing package.json');
    process.exit(1);
}

// Function to run command and return promise
function runCommand(command, args, cwd, description) {
    return new Promise((resolve, reject) => {
        console.log(`📦 ${description}...`);
        const process = spawn(command, args, {
            cwd: cwd,
            stdio: 'inherit',
            shell: true
        });

        process.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${description} completed`);
                resolve();
            } else {
                console.error(`❌ ${description} failed with code ${code}`);
                reject(new Error(`Command failed with code ${code}`));
            }
        });

        process.on('error', (err) => {
            console.error(`❌ ${description} error:`, err.message);
            reject(err);
        });
    });
}

// Function to install dependencies
async function installDependencies() {
    try {
        console.log('🔧 Installing all project dependencies...');
        
        // Install root dependencies
        await runCommand('npm', ['install', '--force'], '.', 'Installing root dependencies');
        
        // Install contracts dependencies
        await runCommand('npm', ['install', '--force'], 'contracts', 'Installing Hardhat dependencies');
        
        // Install backend dependencies
        await runCommand('npm', ['install', '--force'], 'backend', 'Installing backend dependencies');
        
        // Install frontend dependencies
        await runCommand('npm', ['install', '--force'], 'frontend', 'Installing frontend dependencies');
        
        console.log('✅ All dependencies installed successfully!');
        console.log('');
        
    } catch (error) {
        console.error('❌ Failed to install dependencies:', error.message);
        process.exit(1);
    }
}

// Function to create .env files
function createEnvFiles() {
    console.log('📝 Creating configuration files...');
    
    // Create root .env file
    if (!fs.existsSync('.env')) {
        const envContent = `NODE_ENV=development
PORT=3000
HOST=localhost
ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_CHAIN_ID=1337
`;
        fs.writeFileSync('.env', envContent);
        console.log('✅ Root .env file created');
    }
    
    // Create backend .env file
    if (!fs.existsSync('backend/.env')) {
        const backendEnvContent = `NODE_ENV=development
PORT=3001
HOST=localhost
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://localhost:5432/pharbit
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRY=24h
ETHEREUM_RPC_URL=http://localhost:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
`;
        fs.writeFileSync('backend/.env', backendEnvContent);
        console.log('✅ Backend .env file created');
    }
    
    // Create frontend .env file
    if (!fs.existsSync('frontend/.env')) {
        const frontendEnvContent = `REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_CHAIN_ID=1337
REACT_APP_CHAIN_NAME=Hardhat Local
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
`;
        fs.writeFileSync('frontend/.env', frontendEnvContent);
        console.log('✅ Frontend .env file created');
    }
    
    console.log('');
}

// Function to start services
function startServices() {
    console.log('🔄 Starting all services...');
    console.log('=========================');
    console.log('This will start:');
    console.log('  • Hardhat blockchain node (port 8545)');
    console.log('  • Backend API server (port 3001)');
    console.log('  • Frontend React app (port 3000)');
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
            console.log('🌐 Frontend: http://localhost:3000');
            console.log('🔧 Backend: http://localhost:3001');
            console.log('⛓️ Blockchain: http://localhost:8545');
            console.log('');
            console.log('🚨 Recall Management Features:');
            console.log('  - API: http://localhost:3001/api/recalls');
            console.log('  - Health Check: http://localhost:3001/api/health');
            console.log('');
            console.log('🛡️ Anti-Counterfeiting Features:');
            console.log('  - API: http://localhost:3001/api/counterfeit');
            console.log('  - Verification: http://localhost:3001/api/counterfeit/verify');
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
}

// Main execution
async function main() {
    try {
        // Install dependencies first
        await installDependencies();
        
        // Create configuration files
        createEnvFiles();
        
        // Start services
        startServices();
        
    } catch (error) {
        console.error('❌ Startup failed:', error.message);
        process.exit(1);
    }
}

// Run main function
main();
