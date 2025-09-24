#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Installing prerequisites for Blockchain project...${NC}"

# Check if script is run with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run this script with sudo${NC}"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Node.js
install_nodejs() {
    echo -e "${YELLOW}Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
}

# Function to install Git
install_git() {
    echo -e "${YELLOW}Installing Git...${NC}"
    apt-get install -y git
}

# Install system dependencies
echo -e "${YELLOW}Updating package lists...${NC}"
apt-get update

# Install curl if not present
if ! command_exists curl; then
    apt-get install -y curl
fi

# Install Node.js if not present
if ! command_exists node; then
    install_nodejs
fi

# Install Git if not present
if ! command_exists git; then
    install_git
fi

# Install VS Code if not present
if ! command_exists code; then
    echo -e "${YELLOW}Installing Visual Studio Code...${NC}"
    apt-get install -y software-properties-common apt-transport-https wget
    wget -q https://packages.microsoft.com/keys/microsoft.asc -O- | apt-key add -
    add-apt-repository "deb [arch=amd64] https://packages.microsoft.com/repos/vscode stable main"
    apt-get update
    apt-get install -y code
fi

# Install VS Code extensions
echo -e "${YELLOW}Installing VS Code extensions...${NC}"
code --install-extension JuanBlanco.solidity
code --install-extension ms-vscode.vscode-node-azure-pack
code --install-extension ms-azuretools.vscode-docker
code --install-extension eamodio.gitlens

# Install global npm packages
echo -e "${YELLOW}Installing global npm packages...${NC}"
npm install -g hardhat-cli typescript ts-node

# Create project directories if they don't exist
mkdir -p contracts backend frontend

# Install project dependencies
echo -e "${YELLOW}Installing project dependencies...${NC}"

# Root directory
npm install

# Contracts directory
cd contracts
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-ethers ethers
npm install --save-dev @nomiclabs/hardhat-ethers @nomiclabs/hardhat-waffle ethereum-waffle chai
npm install @openzeppelin/contracts

# Backend directory
cd ../backend
npm install

# Frontend directory
cd ../frontend
npm install

# Return to root
cd ..

# Copy environment files
echo -e "${YELLOW}Setting up environment files...${NC}"
if [ -f "docker.env" ]; then
    cp docker.env backend/.env
    cp docker.env contracts/.env
    cp docker.env frontend/.env
fi

# Verify installations
echo -e "${YELLOW}Verifying installations...${NC}"
declare -A tools=(
    ["Node.js"]="node --version"
    ["npm"]="npm --version"
    ["Git"]="git --version"
    ["Hardhat"]="npx hardhat --version"
)

for tool in "${!tools[@]}"; do
    echo -e "${YELLOW}Checking $tool...${NC}"
    if ! eval "${tools[$tool]}" > /dev/null 2>&1; then
        echo -e "${RED}Warning: $tool verification failed${NC}"
    fi
done

echo -e "\n${GREEN}Installation complete!${NC}"
echo -e "${YELLOW}Please check the output above for any errors and refer to PREREQUISITES.md for troubleshooting.${NC}"