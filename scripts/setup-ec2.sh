#!/bin/bash

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -p pm2

# Install Nginx
sudo apt install -y nginx

# Setup application directory
cd /home/ubuntu
git clone https://github.com/Maitreyapharbit/Blockchain.git blockchain
cd blockchain

# Install dependencies
npm install

# Copy Nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/pharbit-blockchain
sudo ln -s /etc/nginx/sites-available/pharbit-blockchain /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Copy systemd service file
sudo cp pharbit-blockchain.service /etc/systemd/system/

# Set up environment variables
echo "AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
AWS_REGION=${AWS_REGION}
AWS_S3_BUCKET=${AWS_S3_BUCKET}
NODE_ENV=production
PORT=3002" > .env

# Start services
sudo systemctl daemon-reload
sudo systemctl enable pharbit-blockchain
sudo systemctl start pharbit-blockchain
sudo systemctl restart nginx

# Set up SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx --non-interactive --agree-tos --email your-email@example.com -d pharbit-blockchain-server.com

echo "Setup completed successfully!"