class Block {
    constructor(public index: number, public timestamp: number, public data: any, public previousHash: string) {}

    calculateHash(): string {
        return require('crypto').createHash('sha256').update(this.index + this.timestamp + JSON.stringify(this.data) + this.previousHash).digest('hex');
    }
}

class Ledger {
    private chain: Block[];

    constructor() {
        this.chain = [this.createGenesisBlock()];
    }

    private createGenesisBlock(): Block {
        return new Block(0, Date.now(), "Genesis Block", "0");
    }

    public addBlock(data: any): void {
        const newBlock = new Block(this.chain.length, Date.now(), data, this.getLatestBlock().calculateHash());
        this.chain.push(newBlock);
    }

    public getBlocks(): Block[] {
        return this.chain;
    }

    private getLatestBlock(): Block {
        return this.chain[this.chain.length - 1];
    }
}

export default Ledger;