#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting PharbitChain Development Environment...');
console.log('===============================================');
console.log('📋 Including Recall Management & Anti-Counterfeiting Features');
console.log('🔧 Comprehensive setup with dependency management');
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
            stdio: 'pipe',
            shell: true
        });

        let output = '';
        let error = '';

        process.stdout.on('data', (data) => {
            output += data.toString();
        });

        process.stderr.on('data', (data) => {
            error += data.toString();
        });

        process.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${description} completed`);
                resolve({ output, error });
            } else {
                console.error(`❌ ${description} failed with code ${code}`);
                if (error) {
                    console.error(`Error details: ${error.substring(0, 200)}...`);
                }
                reject(new Error(`Command failed with code ${code}`));
            }
        });

        process.on('error', (err) => {
            console.error(`❌ ${description} error:`, err.message);
            reject(err);
        });
    });
}

// Function to check if dependencies are installed
function checkDependencies() {
    const checks = {
        root: fs.existsSync('node_modules'),
        contracts: fs.existsSync('contracts/node_modules') && fs.existsSync('contracts/node_modules/.bin/hardhat'),
        backend: fs.existsSync('backend/node_modules'),
        frontend: fs.existsSync('frontend/node_modules')
    };
    return checks;
}

// Function to install dependencies
async function installDependencies() {
    try {
        console.log('🔧 Checking and installing dependencies...');
        
        const deps = checkDependencies();
        const installPromises = [];

        // Only install if node_modules doesn't exist
        if (!deps.root) {
            installPromises.push(
                runCommand('npm', ['install', '--force'], '.', 'Installing root dependencies')
            );
        } else {
            console.log('✅ Root dependencies already installed');
        }

        // Always reinstall Hardhat to ensure proper binary creation
        console.log('📦 Installing Hardhat dependencies...');
        installPromises.push(
            runCommand('npm', ['install', 'hardhat@2.19.0', '--save-dev', '--force'], 'contracts', 'Installing Hardhat')
        );
        installPromises.push(
            runCommand('npm', ['install', '@nomicfoundation/hardhat-toolbox@^4.0.0', '--save-dev', '--force'], 'contracts', 'Installing Hardhat Toolbox')
        );
        installPromises.push(
            runCommand('npm', ['install', '@openzeppelin/contracts@^4.9.6', '--save', '--force'], 'contracts', 'Installing OpenZeppelin')
        );

        if (!deps.backend) {
            installPromises.push(
                runCommand('npm', ['install', '--force'], 'backend', 'Installing backend dependencies')
            );
        } else {
            console.log('✅ Backend dependencies already installed');
        }

        if (!deps.frontend) {
            installPromises.push(
                runCommand('npm', ['install', '--force'], 'frontend', 'Installing frontend dependencies')
            );
        } else {
            console.log('✅ Frontend dependencies already installed');
        }

        // Run all installations in parallel
        if (installPromises.length > 0) {
            await Promise.all(installPromises);
        }
        
        console.log('✅ All dependencies ready!');
        console.log('');
        
    } catch (error) {
        console.error('❌ Failed to install dependencies:', error.message);
        console.log('🔄 Trying to continue with existing installations...');
    }
}

// Function to create .env files
function createEnvFiles() {
    console.log('📝 Setting up configuration files...');
    
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

// Function to check if port is in use
function isPortInUse(port) {
    return new Promise((resolve) => {
        const net = require('net');
        const server = net.createServer();
        
        server.listen(port, () => {
            server.once('close', () => {
                resolve(false);
            });
            server.close();
        });
        
        server.on('error', () => {
            resolve(true);
        });
    });
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
    
    // Try local Hardhat first, then fallback to npx
    const hardhatBinary = path.join('contracts', 'node_modules', '.bin', 'hardhat');
    let hardhatProcess;
    
    if (fs.existsSync(hardhatBinary)) {
        console.log('Using local Hardhat installation...');
        hardhatProcess = spawn(hardhatBinary, ['node'], {
            cwd: 'contracts',
            stdio: 'inherit',
            shell: true
        });
    } else {
        console.log('Hardhat binary not found, trying to create it...');
        const hardhatDir = path.join('contracts', 'node_modules', 'hardhat');
        if (fs.existsSync(hardhatDir)) {
            console.log('Creating Hardhat binary symlink...');
            const binDir = path.join('contracts', 'node_modules', '.bin');
            if (!fs.existsSync(binDir)) {
                fs.mkdirSync(binDir, { recursive: true });
            }
            const cliPath = path.join(hardhatDir, 'internal', 'cli', 'cli.js');
            if (fs.existsSync(cliPath)) {
                fs.writeFileSync(hardhatBinary, `#!/usr/bin/env node\nrequire('${cliPath}');`);
                fs.chmodSync(hardhatBinary, '755');
                console.log('Hardhat binary created, using local installation...');
                hardhatProcess = spawn(hardhatBinary, ['node'], {
                    cwd: 'contracts',
                    stdio: 'inherit',
                    shell: true
                });
            } else {
                console.log('Using npx Hardhat...');
                hardhatProcess = spawn('npx', ['hardhat', 'node'], {
                    cwd: 'contracts',
                    stdio: 'inherit',
                    shell: true
                });
            }
        } else {
            console.log('Using npx Hardhat...');
            hardhatProcess = spawn('npx', ['hardhat', 'node'], {
                cwd: 'contracts',
                stdio: 'inherit',
                shell: true
            });
        }
    }

        // Start backend after delay
        setTimeout(() => {
            console.log('🔧 Starting Backend API server...');
            const backendProcess = spawn('node', ['simple-server.js'], {
                cwd: 'backend',
                stdio: 'inherit',
                shell: true
            });

        // Start frontend after delay
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
