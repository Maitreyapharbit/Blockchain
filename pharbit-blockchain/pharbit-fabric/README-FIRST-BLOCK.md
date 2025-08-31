# Creating Your First Block in Pharbit Blockchain

Welcome to the Pharbit Blockchain! This guide will help you create your first block in the pharmaceutical supply chain tracking system.

## 🎯 What is a Block?

In blockchain technology, a **block** is a collection of transactions that are grouped together and added to the blockchain. Each block contains:

- **Transaction data** (in our case, medicine tracking information)
- **Timestamp** (when the block was created)
- **Hash** (unique identifier for the block)
- **Previous block hash** (links to the previous block)

## 🏗️ Project Structure

```
pharbit-blockchain/pharbit-fabric/
├── chaincode/medicine-tracking/     # Smart contract (Go)
│   ├── medicine_tracking.go         # Main chaincode logic
│   └── go.mod                       # Go dependencies
├── client/                          # Client application (Node.js)
│   ├── create-first-block.js        # Script to create blocks
│   └── package.json                 # Node.js dependencies
├── config/                          # Network configuration
├── crypto-config/                   # Cryptographic materials
├── start-first-block.sh            # Network setup script
├── quick-start.sh                   # One-click setup
└── README-FIRST-BLOCK.md           # This file
```

## 🚀 Quick Start (Recommended)

The easiest way to create your first block:

```bash
# Navigate to the project directory
cd pharbit-blockchain/pharbit-fabric

# Make scripts executable
chmod +x quick-start.sh

# Run the quick start script
./quick-start.sh
```

This will:
1. Set up the Hyperledger Fabric network
2. Install all dependencies
3. Create your first block automatically

## 📋 Manual Setup

If you prefer to set up everything manually:

### 1. Prerequisites

- Docker and Docker Compose
- Node.js (v14 or higher)
- Go (v1.20 or higher)

### 2. Start the Network

```bash
cd pharbit-blockchain/pharbit-fabric
chmod +x start-first-block.sh
./start-first-block.sh
```

### 3. Create Your First Block

```bash
cd client
npm install
node create-first-block.js
```

## 🎯 Understanding Your First Block

When you run the script, it creates a block containing:

```json
{
  "id": "MED001",
  "name": "Aspirin 500mg",
  "batchNumber": "BATCH-2024-001",
  "manufacturer": "PharmaCorp",
  "manufactureDate": "2024-01-15T00:00:00Z",
  "expiryDate": "2026-01-15T00:00:00Z",
  "temperature": 25.5,
  "location": "Manufacturing Facility A",
  "status": "Manufactured",
  "owner": "PharmaCorp",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## 🔗 Block Chain Operations

The script creates multiple blocks to demonstrate the blockchain:

1. **Block 1**: Create Aspirin batch (MED001)
2. **Block 2**: Create Paracetamol batch (MED002)
3. **Block 3**: Update location of MED001
4. **Block 4**: Transfer ownership of MED001

Each operation creates a new block in the chain!

## 🛠️ Available Functions

Your chaincode supports these operations (each creates a block):

### Create Medicine Batch
```javascript
await contract.submitTransaction('CreateMedicineBatch',
    'MED001',                    // ID
    'Aspirin 500mg',             // Name
    'BATCH-2024-001',            // Batch Number
    'PharmaCorp',                // Manufacturer
    '2024-01-15',                // Manufacture Date
    '2026-01-15',                // Expiry Date
    '25.5',                      // Temperature
    'Manufacturing Facility A'   // Location
);
```

### Update Location
```javascript
await contract.submitTransaction('UpdateMedicineLocation',
    'MED001',                    // Medicine ID
    'Distribution Center',       // New Location
    '22.0'                       // New Temperature
);
```

### Transfer Ownership
```javascript
await contract.submitTransaction('TransferMedicine',
    'MED001',                    // Medicine ID
    'MediDistributor',           // New Owner
    'In Transit'                 // New Status
);
```

### Query Operations
```javascript
// Get specific medicine
const medicine = await contract.evaluateTransaction('GetMedicine', 'MED001');

// Get all medicines
const allMedicines = await contract.evaluateTransaction('GetAllMedicines');

// Get medicine history
const history = await contract.evaluateTransaction('GetMedicineHistory', 'MED001');
```

## 🔍 Viewing Your Blocks

After creating blocks, you can:

1. **Check the console output** - Shows transaction IDs and block details
2. **Query the blockchain** - Use the query functions to see stored data
3. **View block history** - See all changes made to a specific medicine

## 🎉 Congratulations!

You've successfully created your first block! Here's what you've accomplished:

✅ **Set up a Hyperledger Fabric network**  
✅ **Deployed a smart contract**  
✅ **Created your first block**  
✅ **Added multiple blocks to the chain**  
✅ **Demonstrated blockchain operations**  

## 🚀 Next Steps

Now that you have your first block, you can:

1. **Create more medicine batches** - Add different types of medicines
2. **Simulate supply chain movements** - Transfer medicines between organizations
3. **Monitor temperature changes** - Update temperature readings
4. **Build a web interface** - Create a UI to interact with your blockchain
5. **Add IoT integration** - Connect real sensors to update data automatically

## 🆘 Troubleshooting

### Common Issues:

**Docker not running:**
```bash
sudo systemctl start docker
```

**Port conflicts:**
```bash
docker-compose down
docker system prune -f
```

**Permission issues:**
```bash
chmod +x *.sh
```

**Network connection issues:**
```bash
docker-compose restart
```

## 📚 Learn More

- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Blockchain Basics](https://www.ibm.com/topics/what-is-blockchain)
- [Smart Contracts](https://www.ibm.com/topics/smart-contracts)

---

**Happy Blockchaining! 🚀**