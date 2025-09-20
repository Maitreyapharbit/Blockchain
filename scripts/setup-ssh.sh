#!/bin/bash

# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Create config file for easy SSH access
cat > ~/.ssh/config << EOL
Host blockchain-ec2
    HostName YOUR_EC2_IP_HERE
    User ubuntu
    IdentityFile ~/.ssh/blockchain.pem
    StrictHostKeyChecking no
EOL

chmod 600 ~/.ssh/config

# Set proper permissions for key
chmod 400 ~/.ssh/blockchain.pem

echo "SSH configuration completed!"
echo "You can now connect using: ssh blockchain-ec2"