#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Utility functions
const runCommand = (command, args, cwd) => {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}`));
      } else {
        resolve();
      }
    });
  });
};

const setupEnv = () => {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.log('Creating .env file...');
    const envContent = `
NODE_ENV=development
PORT=3000
HOST=localhost
ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_CHAIN_ID=31337
SUPABASE_JWT_SECRET=your-super-secret-jwt-key-here
    `.trim();
    fs.writeFileSync(envPath, envContent);
  }
  
  // Copy .env to backend and frontend
  ['backend', 'frontend'].forEach(dir => {
    const targetPath = path.join(process.cwd(), dir, '.env');
    if (!fs.existsSync(path.dirname(targetPath))) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    }
    fs.copyFileSync(envPath, targetPath);
  });
};

const setupBackend = async () => {
  const backendDir = path.join(process.cwd(), 'backend');
  if (!fs.existsSync(path.join(backendDir, 'package.json'))) {
    await runCommand('npm', ['init', '-y'], backendDir);
    await runCommand('npm', ['install', 'express', 'dotenv', 'cors', '@supabase/supabase-js', 'ethers'], backendDir);
  }
  return runCommand('npm', ['install'], backendDir);
};

const setupFrontend = async () => {
  const frontendDir = path.join(process.cwd(), 'frontend');
  if (!fs.existsSync(path.join(frontendDir, 'package.json'))) {
    await runCommand('npx', ['create-react-app', '.'], frontendDir);
    await runCommand('npm', ['install', 'ethers', '@supabase/supabase-js', 'web3modal'], frontendDir);
  }
  return runCommand('npm', ['install'], frontendDir);
};

const setupContracts = async () => {
  const contractsDir = path.join(process.cwd(), 'contracts');
  if (!fs.existsSync(path.join(contractsDir, 'package.json'))) {
    await runCommand('npm', ['init', '-y'], contractsDir);
    await runCommand('npm', ['install', '--save-dev', 'hardhat'], contractsDir);
    await runCommand('npx', ['hardhat'], contractsDir);
  }
  return runCommand('npm', ['install'], contractsDir);
};

const startServices = async () => {
  const contractsDir = path.join(process.cwd(), 'contracts');
  const backendDir = path.join(process.cwd(), 'backend');
  const frontendDir = path.join(process.cwd(), 'frontend');

  // Start Hardhat node
  spawn('npx', ['hardhat', 'node'], {
    cwd: contractsDir,
    stdio: 'inherit',
    shell: true
  });

  // Wait a bit for the node to start
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Deploy contracts
  spawn('npx', ['hardhat', 'run', '--network', 'localhost', 'scripts/deploy.js'], {
    cwd: contractsDir,
    stdio: 'inherit',
    shell: true
  });

  // Start backend
  spawn('npm', ['start'], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: true
  });

  // Start frontend
  spawn('npm', ['start'], {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: true
  });
};

// Main execution
(async () => {
  try {
    console.log('🚀 Setting up Blockchain Development Environment...');
    
    console.log('📝 Setting up environment variables...');
    setupEnv();

    console.log('⚙️ Setting up backend...');
    await setupBackend();

    console.log('🎨 Setting up frontend...');
    await setupFrontend();

    console.log('📜 Setting up smart contracts...');
    await setupContracts();

    console.log('🚀 Starting all services...');
    await startServices();

    console.log(`
✅ Setup complete! Services starting up:
- Blockchain node: http://localhost:8545
- Backend API: http://localhost:3000
- Frontend: http://localhost:3001

Press Ctrl+C to stop all services.
    `);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();