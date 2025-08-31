#!/bin/bash

echo "🚀 Pharbit Blockchain - First Block Creation"
echo "============================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Hyperledger Fabric binaries are available
if [ ! -f "./bin/fabric-ca-client" ]; then
    echo "📥 Downloading Hyperledger Fabric binaries..."
    curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.2.12 1.5.5
    echo "✅ Fabric binaries downloaded"
fi

# Set environment variables
export PATH=${PWD}/bin:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}/config

echo "🔧 Setting up the network..."
echo ""

# Generate crypto materials
if [ ! -d "./crypto-config" ]; then
    echo "🔐 Generating crypto materials..."
    cryptogen generate --config=./crypto-config.yaml
    echo "✅ Crypto materials generated"
fi

# Generate genesis block
if [ ! -f "./channel-artifacts/genesis.block" ]; then
    echo "📦 Creating channel artifacts directory..."
    mkdir -p channel-artifacts
    
    echo "🏗️  Generating genesis block..."
    configtxgen -profile TwoOrgsOrdererGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block
    echo "✅ Genesis block created"
fi

# Generate channel configuration
if [ ! -f "./channel-artifacts/channel.tx" ]; then
    echo "📋 Generating channel configuration..."
    configtxgen -profile TwoOrgsChannel -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID mychannel
    echo "✅ Channel configuration created"
fi

# Start the network
echo "🌐 Starting the network..."
docker-compose -f docker-compose.yaml up -d
echo "✅ Network started"

# Wait for network to be ready
echo "⏳ Waiting for network to be ready..."
sleep 10

# Create and join channel
echo "🔗 Creating and joining channel..."
docker exec cli peer channel create -o orderer.pharbit.com:7050 -c mychannel -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/channel.tx
docker exec cli peer channel join -b mychannel.block

echo "✅ Channel created and joined"

# Install and instantiate chaincode
echo "📦 Installing chaincode..."
docker exec cli peer chaincode install -n medicine-tracking -v 1.0 -p github.com/medicine-tracking

echo "🚀 Instantiating chaincode..."
docker exec cli peer chaincode instantiate -o orderer.pharbit.com:7050 -C mychannel -n medicine-tracking -v 1.0 -c '{"Args":[]}' -P "AND ('PharmaCorpMSP.peer')"

echo "✅ Chaincode instantiated"

echo ""
echo "🎉 Your blockchain network is ready!"
echo ""
echo "To create your first block, run:"
echo "  cd client"
echo "  npm install"
echo "  node create-first-block.js"
echo ""
echo "Or use the quick start command:"
echo "  ./quick-start.sh"