import { Ledger } from './blockchain/ledger';
import { PharmaContract } from './contracts/pharmaContract';

const initBlockchain = () => {
    const ledger = new Ledger();
    const pharmaContract = new PharmaContract();

    // Setup initial state or configurations if necessary
    console.log('Blockchain initialized for the pharmaceutical company.');
    return { ledger, pharmaContract };
};

const { ledger, pharmaContract } = initBlockchain();