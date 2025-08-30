export class PharmaContract {
    private transactions: Map<string, any>;

    constructor() {
        this.transactions = new Map();
    }

    createTransaction(transaction: any): string {
        const transactionId = this.generateTransactionId();
        this.transactions.set(transactionId, transaction);
        return transactionId;
    }

    getTransaction(transactionId: string): any | null {
        return this.transactions.get(transactionId) || null;
    }

    private generateTransactionId(): string {
        return 'tx-' + Math.random().toString(36).substr(2, 9);
    }
}