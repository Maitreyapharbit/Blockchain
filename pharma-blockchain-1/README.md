# Pharma Blockchain Project

This project implements a blockchain solution tailored for a pharmaceutical company. The blockchain is designed to enhance transparency, security, and traceability in pharmaceutical transactions.

## Project Structure

```
pharma-blockchain
├── src
│   ├── index.ts                # Entry point of the application
│   ├── blockchain
│   │   └── ledger.ts           # Manages the blockchain's ledger
│   ├── contracts
│   │   └── pharmaContract.ts    # Smart contract for the pharmaceutical company
│   └── types
│       └── index.ts            # Defines the structure of transactions and blocks
├── package.json                 # npm configuration file
├── tsconfig.json                # TypeScript configuration file
└── README.md                    # Project documentation
```

## Features

- **Ledger Management**: The `Ledger` class in `ledger.ts` manages the blockchain's ledger, allowing for the addition and retrieval of blocks.
- **Smart Contracts**: The `PharmaContract` class in `pharmaContract.ts` facilitates the creation and management of transactions within the blockchain.
- **Type Definitions**: The project includes type definitions for transactions and blocks to ensure type safety and clarity.

## Getting Started

To get started with the project, clone the repository and install the necessary dependencies:

```bash
git clone <repository-url>
cd pharma-blockchain
npm install
```

## Usage

To run the application, use the following command:

```bash
npm start
```

This will initialize the blockchain and set up the necessary configurations.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.