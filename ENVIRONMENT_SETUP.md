# Environment Configuration Guide

## Overview

This project now uses a **single unified `.env` file** in the root directory instead of separate environment files in each subdirectory. This approach provides better maintainability and consistency across the entire monorepo.

## File Structure

```
/workspace/
├── .env                    # 🎯 Main environment file (edit this one)
├── frontend/.env           # 🔄 Auto-generated from root .env
├── contracts/.env          # 🔄 Auto-generated from root .env
├── sync-env.js            # 🔧 Environment synchronization script
└── backend/               # 📁 Loads directly from root .env
```

## How It Works

### 1. Root Environment File (`/workspace/.env`)
- **Primary source of truth** for all environment variables
- Contains variables for all three components: backend, frontend, and contracts
- Edit this file to make changes to your environment configuration

### 2. Backend (`/workspace/backend/`)
- Loads environment variables **directly** from the root `.env` file
- No separate `.env` file needed
- Configuration updated in `/workspace/backend/config/env.js`

### 3. Frontend (`/workspace/frontend/`)
- React apps require `.env` files in their project root
- Uses auto-generated `.env` file that syncs from root
- Variables must be prefixed with `REACT_APP_` to be accessible in React

### 4. Contracts (`/workspace/contracts/`)
- Uses auto-generated `.env` file that syncs from root
- Hardhat configuration updated to load from root directory

## Environment Variables

### Backend Variables
```bash
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# Security
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
SESSION_SECRET=your_session_secret_here

# AWS
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_s3_bucket
```

### Frontend Variables (REACT_APP_ prefix required)
```bash
# API Configuration
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_API_TIMEOUT=10000

# Supabase
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Blockchain
REACT_APP_ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_CHAIN_ID=31337
REACT_APP_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
```

### Contracts Variables
```bash
# Ethereum Configuration
ETHEREUM_RPC_URL=http://localhost:8545
ETHEREUM_RPC_URL_SEPOLIA=https://sepolia.infura.io/v3/your_project_id
PRIVATE_KEY=your_private_key_here

# Contract Addresses
CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
RECALL_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
COUNTERFEIT_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# API Keys
INFURA_PROJECT_ID=your_infura_project_id
ALCHEMY_API_KEY=your_alchemy_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Synchronization Script

The `sync-env.js` script automatically synchronizes environment variables from the root `.env` file to the individual project directories.

### Usage

```bash
# Sync all environments
npm run sync-env

# Sync only frontend
npm run sync-env:frontend

# Sync only contracts
npm run sync-env:contracts

# Direct script usage
node sync-env.js
node sync-env.js --frontend-only
node sync-env.js --contracts-only
```

### When to Run Sync

Run the sync script when you:
- Add new environment variables to the root `.env`
- Modify existing environment variables
- Set up the project for the first time
- Deploy contracts and need to update contract addresses

## Setup Instructions

### 1. Initial Setup
```bash
# Copy the example file
cp .env.example .env

# Edit the .env file with your actual values
nano .env  # or use your preferred editor

# Sync environment variables to all projects
npm run sync-env
```

### 2. Adding New Variables

1. **Add to root `.env`**:
   ```bash
   # Add your new variable
   NEW_VARIABLE=your_value_here
   ```

2. **Update sync script** (if needed):
   - Add the variable to `FRONTEND_VARS` or `CONTRACTS_VARS` arrays in `sync-env.js`
   - Or add it to the backend validation schema in `backend/config/env.js`

3. **Run sync**:
   ```bash
   npm run sync-env
   ```

### 3. Contract Deployment

After deploying contracts, update the addresses in the root `.env`:

```bash
# Update contract addresses
RECALL_CONTRACT_ADDRESS=0x1234567890abcdef...
COUNTERFEIT_CONTRACT_ADDRESS=0xabcdef1234567890...

# Sync to all projects
npm run sync-env
```

## Best Practices

### ✅ Do's
- Always edit the root `.env` file
- Run `npm run sync-env` after making changes
- Use descriptive variable names
- Group related variables with comments
- Keep sensitive data secure (never commit `.env` to git)

### ❌ Don'ts
- Don't edit the generated `.env` files in subdirectories
- Don't commit `.env` files to version control
- Don't use the same variable names without proper prefixes
- Don't forget to sync after adding new variables

## Troubleshooting

### Environment Variables Not Loading

1. **Check the root `.env` file exists**:
   ```bash
   ls -la .env
   ```

2. **Verify variable names**:
   - Backend: Any name (validated by Joi schema)
   - Frontend: Must start with `REACT_APP_`
   - Contracts: Any name (used by Hardhat)

3. **Run sync script**:
   ```bash
   npm run sync-env
   ```

4. **Check generated files**:
   ```bash
   cat frontend/.env
   cat contracts/.env
   ```

### Backend Issues

- Ensure `backend/config/env.js` loads from the correct path
- Check that all required variables are defined in the root `.env`
- Verify Joi validation schema includes your variables

### Frontend Issues

- Ensure variables start with `REACT_APP_`
- Check that `frontend/.env` was generated correctly
- Restart the React development server after changes

### Contracts Issues

- Verify `hardhat.config.js` and `hardhat.config.ts` load from root
- Check that contract addresses are properly set
- Ensure private keys and RPC URLs are correct

## Migration from Separate .env Files

If you're migrating from separate `.env` files:

1. **Backup existing files**:
   ```bash
   cp backend/.env backend/.env.backup
   cp frontend/.env frontend/.env.backup
   cp contracts/.env contracts/.env.backup
   ```

2. **Merge variables** into the root `.env` file

3. **Update configurations** (already done in this setup)

4. **Test the setup**:
   ```bash
   npm run sync-env
   npm run dev:backend
   npm run dev:frontend
   ```

5. **Remove old files** (optional):
   ```bash
   rm backend/.env.backup
   rm frontend/.env.backup
   rm contracts/.env.backup
   ```

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique secrets for production
- Rotate API keys and secrets regularly
- Consider using environment-specific `.env` files for different deployments
- Use a secrets management service for production environments

---

For more information, see the main project documentation or contact the development team.