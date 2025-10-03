#!/bin/bash

# Stop all services
./stop-all.sh

# Remove all node_modules directories
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Remove all log files
rm -f logs/*.log

# Clean frontend build artifacts
rm -rf frontend/build
rm -rf frontend/.next
rm -rf frontend/.cache

# Clean contract artifacts
rm -rf contracts/artifacts
rm -rf contracts/cache
rm -rf contracts/typechain-types

# Remove lock files
rm -f */package-lock.json
rm -f */yarn.lock
rm -f */pnpm-lock.yaml

# Remove environment files except root .env
find . -name ".env" ! -path "./.env" -type f -delete

echo "Cleanup complete!"