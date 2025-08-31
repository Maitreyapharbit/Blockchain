const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function createTransaction() {
    try {
        // Load the network configuration
        const ccpPath = path.resolve(__dirname, '..', 'config', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network
        const contract = network.getContract('transaction-tracking');

        console.log('\n=== Creating Your First Transaction Block ===');
        console.log('==============================================');

        // Your specific transaction details
        const sender = '0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b';
        const receiver = '6M3uvRFJSR3hcJab22fSAQGUgXxiMKgdg225k3Pq9qpR';
        const quantity = 10;

        console.log('Transaction Details:');
        console.log(`Sender: ${sender}`);
        console.log(`Receiver: ${receiver}`);
        console.log(`Quantity: ${quantity}`);
        console.log('');

        // First, create accounts for sender and receiver with initial balances
        console.log('🔐 Setting up accounts...');
        
        try {
            // Create sender account with initial balance
            await contract.submitTransaction('CreateAccount', sender, 100.0);
            console.log(`✅ Sender account created with balance: 100.0`);
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('ℹ️  Sender account already exists');
            } else {
                throw error;
            }
        }

        try {
            // Create receiver account with initial balance
            await contract.submitTransaction('CreateAccount', receiver, 50.0);
            console.log(`✅ Receiver account created with balance: 50.0`);
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('ℹ️  Receiver account already exists');
            } else {
                throw error;
            }
        }

        // Get initial account balances
        console.log('\n📊 Initial Account Balances:');
        try {
            const senderAccount = await contract.evaluateTransaction('GetAccount', sender);
            const senderData = JSON.parse(senderAccount.toString());
            console.log(`Sender (${sender}): ${senderData.balance}`);
        } catch (error) {
            console.log(`Sender account not found or error: ${error.message}`);
        }

        try {
            const receiverAccount = await contract.evaluateTransaction('GetAccount', receiver);
            const receiverData = JSON.parse(receiverAccount.toString());
            console.log(`Receiver (${receiver}): ${receiverData.balance}`);
        } catch (error) {
            console.log(`Receiver account not found or error: ${error.message}`);
        }

        // Create the transaction (this creates a block)
        console.log('\n🚀 Creating transaction...');
        const result = await contract.submitTransaction('CreateTransaction', sender, receiver, quantity);

        console.log('✅ Transaction block created successfully!');
        console.log('Transaction ID:', result.toString());

        // Get final account balances
        console.log('\n📊 Final Account Balances:');
        try {
            const senderAccount = await contract.evaluateTransaction('GetAccount', sender);
            const senderData = JSON.parse(senderAccount.toString());
            console.log(`Sender (${sender}): ${senderData.balance}`);
        } catch (error) {
            console.log(`Error getting sender balance: ${error.message}`);
        }

        try {
            const receiverAccount = await contract.evaluateTransaction('GetAccount', receiver);
            const receiverData = JSON.parse(receiverAccount.toString());
            console.log(`Receiver (${receiver}): ${receiverData.balance}`);
        } catch (error) {
            console.log(`Error getting receiver balance: ${error.message}`);
        }

        // Get all transactions
        console.log('\n📋 All Transactions in the Blockchain:');
        const allTransactions = await contract.evaluateTransaction('GetAllTransactions');
        const transactions = JSON.parse(allTransactions.toString());
        
        if (transactions.length === 0) {
            console.log('No transactions found');
        } else {
            transactions.forEach((tx, index) => {
                console.log(`\nTransaction ${index + 1}:`);
                console.log(`  ID: ${tx.id}`);
                console.log(`  From: ${tx.sender}`);
                console.log(`  To: ${tx.receiver}`);
                console.log(`  Amount: ${tx.quantity}`);
                console.log(`  Status: ${tx.status}`);
                console.log(`  Timestamp: ${tx.timestamp}`);
                console.log(`  TX Hash: ${tx.txHash}`);
            });
        }

        // Get all accounts
        console.log('\n👥 All Accounts in the Blockchain:');
        const allAccounts = await contract.evaluateTransaction('GetAllAccounts');
        const accounts = JSON.parse(allAccounts.toString());
        
        if (accounts.length === 0) {
            console.log('No accounts found');
        } else {
            accounts.forEach((account, index) => {
                console.log(`\nAccount ${index + 1}:`);
                console.log(`  Address: ${account.address}`);
                console.log(`  Balance: ${account.balance}`);
                console.log(`  Created: ${account.created}`);
                console.log(`  Updated: ${account.updated}`);
            });
        }

        // Disconnect from the gateway
        await gateway.disconnect();

        console.log('\n🎉 Congratulations! Your transaction block has been created!');
        console.log('The blockchain now contains your transaction with the specified details.');

    } catch (error) {
        console.error(`Failed to create transaction: ${error}`);
        process.exit(1);
    }
}

// Function to create additional transactions for demonstration
async function createAdditionalTransactions() {
    try {
        const ccpPath = path.resolve(__dirname, '..', 'config', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('User identity not found. Please run registerUser.js first.');
            return;
        }

        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('transaction-tracking');

        console.log('\n=== Creating Additional Transaction Blocks ===');

        // Create additional transactions
        const transactions = [
            {
                sender: '0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b',
                receiver: '6M3uvRFJSR3hcJab22fSAQGUgXxiMKgdg225k3Pq9qpR',
                quantity: 5
            },
            {
                sender: '6M3uvRFJSR3hcJab22fSAQGUgXxiMKgdg225k3Pq9qpR',
                receiver: '0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b',
                quantity: 2
            },
            {
                sender: '0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b',
                receiver: '6M3uvRFJSR3hcJab22fSAQGUgXxiMKgdg225k3Pq9qpR',
                quantity: 8
            }
        ];

        for (let i = 0; i < transactions.length; i++) {
            const tx = transactions[i];
            console.log(`\nCreating transaction ${i + 2}: ${tx.quantity} from ${tx.sender.substring(0, 10)}... to ${tx.receiver.substring(0, 10)}...`);
            
            await contract.submitTransaction('CreateTransaction', tx.sender, tx.receiver, tx.quantity);
            console.log(`✅ Transaction block ${i + 2} created successfully!`);
        }

        // Get transaction history
        console.log('\n=== Transaction History ===');
        const allTransactions = await contract.evaluateTransaction('GetAllTransactions');
        const transactionsList = JSON.parse(allTransactions.toString());
        console.log(`Total transactions in blockchain: ${transactionsList.length}`);
        
        transactionsList.forEach((tx, index) => {
            console.log(`\nBlock ${index + 1}:`);
            console.log(`  Transaction ID: ${tx.id}`);
            console.log(`  From: ${tx.sender.substring(0, 20)}...`);
            console.log(`  To: ${tx.receiver.substring(0, 20)}...`);
            console.log(`  Amount: ${tx.quantity}`);
            console.log(`  Status: ${tx.status}`);
            console.log(`  TX Hash: ${tx.txHash}`);
        });

        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to create additional transactions: ${error}`);
        process.exit(1);
    }
}

// Main execution
async function main() {
    console.log('🚀 Starting Pharbit Blockchain - Transaction Creation');
    console.log('====================================================');
    
    await createTransaction();
    await createAdditionalTransactions();
    
    console.log('\n🎉 Congratulations! You have successfully created multiple transaction blocks!');
    console.log('Your blockchain now contains a complete transaction history.');
    console.log('Each transaction creates a new block in the chain.');
}

// Run the application
if (require.main === module) {
    main();
}

module.exports = { createTransaction, createAdditionalTransactions };