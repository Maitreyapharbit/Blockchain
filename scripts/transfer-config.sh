#!/bin/bash

# Ensure script is run with the EC2 instance IP as argument
if [ -z "$1" ]; then
    echo "Usage: $0 <ec2-instance-ip>"
    exit 1
fi

EC2_IP=$1

# Create encrypted env file
gpg --symmetric --cipher-algo AES256 backend/.env

# Copy files to EC2
scp backend/.env.gpg ubuntu@${EC2_IP}:/home/ubuntu/Blockchain/backend/
scp ecosystem.config.js ubuntu@${EC2_IP}:/home/ubuntu/Blockchain/

# Cleanup
rm backend/.env.gpg

echo "Files transferred successfully!"
echo "Next steps:"
echo "1. SSH into your EC2 instance"
echo "2. cd /home/ubuntu/Blockchain/backend"
echo "3. gpg --decrypt .env.gpg > .env"
echo "4. Start the application with: pm2 start ../ecosystem.config.js"