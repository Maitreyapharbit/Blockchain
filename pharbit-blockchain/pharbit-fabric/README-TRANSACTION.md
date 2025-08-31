# Creating Your Transaction Block

Welcome to the Pharbit Blockchain Transaction System! This guide will help you create a transaction block with your specific details.

## 🎯 Your Transaction Details

**Sender:** `0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b`  
**Receiver:** `6M3uvRFJSR3hcJab22fSAQGUgXxiMKgdg225k3Pq9qpR`  
**Quantity:** `10`

## 🚀 Quick Start (Recommended)

The easiest way to create your transaction block:

```bash
# Navigate to the project directory
cd pharbit-blockchain/pharbit-fabric

# Make scripts executable
chmod +x quick-start-transaction.sh

# Run the transaction creation script
./quick-start-transaction.sh
```

This will:
1. Set up the Hyperledger Fabric network
2. Install all dependencies
3. Create accounts for sender and receiver
4. Execute your transaction (creates a block)
5. Show transaction history and account balances

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

### 3. Create Your Transaction

```bash
cd client
npm install
node create-transaction.js
```

## 🎯 Understanding Your Transaction Block

When you run the script, it creates a block containing:

```json
{
  "id": "TX_1705312345678901234",
  "sender": "0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b",
  "receiver": "6M3uvRFJSR3hcJab22fSAQGUgXxiMKgdg225k3Pq9qpR",
  "quantity": 10,
  "timestamp": "2024-01-15T10:30:00Z",
  "status": "Completed",
  "blockHash": "",
  "txHash": "0x1705312345678901234"
}
```

## 🔗 Transaction Flow

The system creates multiple blocks to demonstrate the blockchain:

1. **Block 1**: Create sender account with balance 100.0
2. **Block 2**: Create receiver account with balance 50.0
3. **Block 3**: Execute your transaction (10 units from sender to receiver)
4. **Block 4**: Additional transaction (5 units)
5. **Block 5**: Additional transaction (2 units back)
6. **Block 6**: Additional transaction (8 units)

Each operation creates a new block in the chain!

## 🛠️ Available Functions

Your transaction chaincode supports these operations (each creates a block):

### Create Account
```javascript
await contract.submitTransaction('CreateAccount',
    '0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b',  // Address
    100.0                                            // Initial Balance
);
```

### Create Transaction
```javascript
await contract.submitTransaction('CreateTransaction',
    '0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b',                    // Sender
    '6M3uvRFJSR3hcJab22fSAQGUgXxiMKgdg225k3Pq9qpR',                  // Receiver
    10                                                                // Quantity
);
```

### Query Operations
```javascript
// Get specific transaction
const transaction = await contract.evaluateTransaction('GetTransaction', 'TX_123');

// Get account balance
const account = await contract.evaluateTransaction('GetAccount', '0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b');

// Get all transactions
const allTransactions = await contract.evaluateTransaction('GetAllTransactions');

// Get all accounts
const allAccounts = await contract.evaluateTransaction('GetAllAccounts');

// Get transaction history
const history = await contract.evaluateTransaction('GetTransactionHistory', 'TX_123');
```

## 🔍 Viewing Your Transaction

After creating your transaction, you can see:

1. **Transaction Details**: ID, sender, receiver, quantity, timestamp
2. **Account Balances**: Before and after the transaction
3. **Transaction History**: All transactions in the blockchain
4. **Block Information**: Each transaction creates a new block

## 📊 Expected Results

After running your transaction, you should see:

### Account Balances:
- **Sender** (`0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b`): 90.0 (100.0 - 10.0)
- **Receiver** (`6M3uvRFJSR3hcJab22fSAQGUgXxiMKgdg225k3Pq9qpR`): 60.0 (50.0 + 10.0)

### Transaction Details:
- **Transaction ID**: `TX_1705312345678901234`
- **Status**: `Completed`
- **Amount**: `10`
- **Timestamp**: Current time
- **TX Hash**: Unique transaction hash

## 🎉 Congratulations!

You've successfully created your transaction block! Here's what you've accomplished:

✅ **Set up a Hyperledger Fabric network**  
✅ **Created accounts for sender and receiver**  
✅ **Executed your specific transaction**  
✅ **Created a block in the blockchain**  
✅ **Demonstrated balance transfers**  

## 🚀 Next Steps

Now that you have your transaction block, you can:

1. **Create more transactions** - Send different amounts between accounts
2. **Monitor account balances** - Check balance changes over time
3. **View transaction history** - See all transactions in the blockchain
4. **Build a web interface** - Create a UI to interact with your blockchain
5. **Add more accounts** - Create additional user accounts

## 🆘 Troubleshooting

### Common Issues:

**Insufficient balance:**
```
Error: insufficient balance. Sender has 90.0, trying to send 100.0
```
Solution: Ensure sender has sufficient balance before transaction.

**Account not found:**
```
Error: account with address 0x... does not exist
```
Solution: Create the account first using `CreateAccount`.

**Network connection issues:**
```bash
docker-compose restart
```

**Permission issues:**
```bash
chmod +x *.sh
```

## 📚 Learn More

- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Blockchain Transactions](https://www.ibm.com/topics/blockchain-transactions)
- [Smart Contracts](https://www.ibm.com/topics/smart-contracts)

---

**Your transaction is ready to be created! 🚀**