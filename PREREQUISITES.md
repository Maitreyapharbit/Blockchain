# Prerequisites for Blockchain Project Setup

## Required Software

### 1. Node.js
- Download and install Node.js LTS version (18.x or later) from [nodejs.org](https://nodejs.org/)
- Verify installation:
  ```bash
  node --version
  npm --version
  ```

### 2. Git
- Download and install Git from [git-scm.com](https://git-scm.com/downloads)
- Verify installation:
  ```bash
  git --version
  ```

### 3. Visual Studio Code (Recommended IDE)
- Download and install from [code.visualstudio.com](https://code.visualstudio.com/)
- Recommended extensions:
  - Solidity (by Juan Blanco)
  - Node.js Extension Pack
  - Docker
  - GitLens

### 4. Docker Desktop (Optional - for containerized development)
- Download and install from [docker.com](https://www.docker.com/products/docker-desktop)
- Verify installation:
  ```bash
  docker --version
  docker-compose --version
  ```

## Required NPM Packages

### Global Packages
```bash
npm install -g hardhat-cli
npm install -g typescript
npm install -g ts-node
```

### Project-Specific Packages

1. Root Directory:
```bash
npm install
```

2. Contracts Directory:
```bash
cd contracts
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-ethers ethers
npm install --save-dev @nomiclabs/hardhat-ethers @nomiclabs/hardhat-waffle ethereum-waffle chai
npm install @openzeppelin/contracts
```

3. Backend Directory:
```bash
cd ../backend
npm install
```

4. Frontend Directory:
```bash
cd ../frontend
npm install
```

## Environment Setup

1. Configure Environment Variables:
   - Copy `docker.env` to create new `.env` files:
     ```bash
     cp docker.env backend/.env
     cp docker.env contracts/.env
     cp docker.env frontend/.env
     ```

2. Network Configuration:
   - Ensure ports 8545 (Hardhat), 3000 (Frontend), and 4000 (Backend) are available
   - Check firewall settings allow these ports

## System Requirements

- Operating System: Windows 10/11, macOS, or Linux
- RAM: Minimum 8GB (16GB recommended)
- Storage: At least 1GB free space
- Processor: Modern multi-core processor
- Internet: Stable connection required

## Development Tools (Optional but Recommended)

1. MetaMask Browser Extension
   - Install from [metamask.io](https://metamask.io/)
   - Set up a wallet for testing

2. Postman or Insomnia
   - For testing API endpoints
   - Download from [postman.com](https://www.postman.com/) or [insomnia.rest](https://insomnia.rest/)

## Troubleshooting Common Issues

### Windows-Specific
1. If you get permission errors:
   - Run Command Prompt or PowerShell as Administrator
   - Check Windows Defender settings
   - Ensure you have write permissions in the project directory

2. If npm install fails:
   ```bash
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

### Port Conflicts
Check if ports are in use:
```bash
# Windows
netstat -ano | findstr "8545"
netstat -ano | findstr "3000"
netstat -ano | findstr "4000"

# Linux/macOS
lsof -i :8545
lsof -i :3000
lsof -i :4000
```

## Verification Steps

After installing all prerequisites, verify the setup:

1. Verify Hardhat:
```bash
cd contracts
npx hardhat --version
```

2. Verify Node.js environment:
```bash
node --version
npm --version
```

3. Test contract compilation:
```bash
cd contracts
npx hardhat compile
```

4. Test local blockchain:
```bash
npx hardhat node
```

If all these steps complete without errors, your environment is ready for development.

## Next Steps

After completing all installations, refer to:
- `README.md` for project overview
- `QUICK_START.md` for running the project
- `WORKING_STARTUP.md` for development workflow