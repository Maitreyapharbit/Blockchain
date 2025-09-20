#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: $0 <ec2-ip-address>"
    exit 1
fi

EC2_IP=$1

echo "Setting up SSH..."
sed -i "s/YOUR_EC2_IP_HERE/$EC2_IP/" ~/.ssh/config

echo "Installing dependencies locally..."
npm install
cd backend && npm install
cd ../contracts && npm install
cd ..

echo "Deploying to EC2..."
rsync -avz --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'logs' \
    -e "ssh -i ~/.ssh/blockchain.pem" \
    ./ ubuntu@$EC2_IP:/home/ubuntu/Blockchain/

echo "Setting up remote environment..."
ssh blockchain-ec2 << 'EOF'
    cd /home/ubuntu/Blockchain
    npm install
    cd backend && npm install
    cd ../contracts && npm install
    cd ..
    
    # Install PM2 if not installed
    which pm2 || npm install -g pm2
    
    # Start services
    pm2 start ecosystem.config.js
    pm2 save
    
    # Show status
    pm2 status
EOF

echo "Deployment completed!"
echo "To check logs: ssh blockchain-ec2 'pm2 logs'"
echo "To monitor: ssh blockchain-ec2 'pm2 monit'"