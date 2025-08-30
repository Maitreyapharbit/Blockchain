export interface Transaction {
    id: string;
    sender: string;
    recipient: string;
    amount: number;
    timestamp: Date;
}

export interface Block {
    index: number;
    timestamp: Date;
    transactions: Transaction[];
    previousHash: string;
    hash: string;
}