require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require('hardhat-gas-reporter');
require('solidity-coverage');
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yulDetails: {
            optimizerSteps: "u",
          },
        },
      },
    },
  },

  networks: {
    // Local development - single node (for initial testing)
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
      timeout: 60000,
    },

    // 7-node IBFT 2.0 development cluster
    ibft_7node: {
      url: process.env.IBFT_PRIMARY_RPC || "http://validator-1:8545",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 31337,
      timeout: 60000,
      gasPrice: 0,
    },

    // Fallback to backup validator
    ibft_7node_failover: {
      url: process.env.IBFT_BACKUP_RPC || "http://validator-2:8545",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 31337,
      timeout: 60000,
      gasPrice: 0,
    },

    // Sepolia testnet for public testing
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/" + (process.env.INFURA_API_KEY || ""),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      timeout: 60000,
    },

    // Mainnet (when ready)
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/" + (process.env.ALCHEMY_API_KEY || ""),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1,
      timeout: 60000,
    },
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  mocha: {
    timeout: 40000,
  },

  // TypeScript support
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },

  // Configure solhint linter
  solhint: {
    defaultConfig: {
      rules: {
        "compiler-version": ["error", "^0.8.20"],
        "func-visibility": ["warn"],
        "no-simple-event-func-name": "off",
      },
    },
  },
};
