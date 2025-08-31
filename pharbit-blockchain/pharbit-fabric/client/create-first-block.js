const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function createFirstBlock() {
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
        const contract = network.getContract('medicine-tracking');

        console.log('\n=== Creating Your First Block ===');
        console.log('Creating a new medicine batch...');

        // Create the first medicine batch (this will create a block)
        const result = await contract.submitTransaction('CreateMedicineBatch',
            'MED001',                    // ID
            'Aspirin 500mg',             // Name
            'BATCH-2024-001',            // Batch Number
            'PharmaCorp',                // Manufacturer
            '2024-01-15',                // Manufacture Date
            '2026-01-15',                // Expiry Date
            '25.5',                      // Temperature
            'Manufacturing Facility A'   // Location
        );

        console.log('✅ First block created successfully!');
        console.log('Transaction ID:', result.toString());

        // Query the created medicine
        console.log('\n=== Querying the Created Block ===');
        const medicine = await contract.evaluateTransaction('GetMedicine', 'MED001');
        console.log('Medicine details:', JSON.parse(medicine.toString()));

        // Get all medicines
        console.log('\n=== All Blocks in the Chain ===');
        const allMedicines = await contract.evaluateTransaction('GetAllMedicines');
        console.log('All medicines:', JSON.parse(allMedicines.toString()));

        // Disconnect from the gateway
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to create first block: ${error}`);
        process.exit(1);
    }
}

// Function to create additional blocks for demonstration
async function createAdditionalBlocks() {
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
        const contract = network.getContract('medicine-tracking');

        console.log('\n=== Creating Additional Blocks ===');

        // Create second medicine batch
        await contract.submitTransaction('CreateMedicineBatch',
            'MED002',
            'Paracetamol 500mg',
            'BATCH-2024-002',
            'PharmaCorp',
            '2024-01-16',
            '2026-01-16',
            '24.0',
            'Manufacturing Facility B'
        );
        console.log('✅ Block 2 created: Paracetamol batch');

        // Update location (creates another block)
        await contract.submitTransaction('UpdateMedicineLocation',
            'MED001',
            'Distribution Center',
            '22.0'
        );
        console.log('✅ Block 3 created: Location update');

        // Transfer ownership (creates another block)
        await contract.submitTransaction('TransferMedicine',
            'MED001',
            'MediDistributor',
            'In Transit'
        );
        console.log('✅ Block 4 created: Ownership transfer');

        // Get medicine history
        console.log('\n=== Block History ===');
        const history = await contract.evaluateTransaction('GetMedicineHistory', 'MED001');
        const historyArray = JSON.parse(history.toString());
        console.log(`Medicine MED001 has ${historyArray.length} blocks in its history:`);
        historyArray.forEach((block, index) => {
            console.log(`Block ${index + 1}: ${block.Status} at ${block.Location}`);
        });

        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to create additional blocks: ${error}`);
        process.exit(1);
    }
}

// Main execution
async function main() {
    console.log('🚀 Starting Pharbit Blockchain - First Block Creation');
    console.log('==================================================');
    
    await createFirstBlock();
    await createAdditionalBlocks();
    
    console.log('\n🎉 Congratulations! You have successfully created your first blocks!');
    console.log('Your blockchain now contains multiple blocks with medicine tracking data.');
    console.log('Each transaction creates a new block in the chain.');
}

// Run the application
if (require.main === module) {
    main();
}

module.exports = { createFirstBlock, createAdditionalBlocks };