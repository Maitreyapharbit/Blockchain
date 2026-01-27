/**
 * Load Test: 100 TPS for 5 minutes on 7-node IBFT cluster
 * Test: Can the blockchain handle real-world pharmaceutical supply chain volume?
 */

const hre = require("hardhat");
const { ethers } = require("ethers");
const fs = require("fs");

// Configuration
const TEST_CONFIG = {
  durationSeconds: 300,        // 5 minutes
  targetTPS: 100,              // 100 transactions per second
  batchSize: 50,               // Send 50 txs at a time
  rpcEndpoints: [
    "http://localhost:8545",   // Validator 1
    "http://localhost:8546",   // Validator 2
    "http://localhost:8547",   // Validator 3
    "http://localhost:8548",   // Validator 4
    "http://localhost:8549",   // Validator 5
    "http://localhost:8550",   // Validator 6
    "http://localhost:8551",   // Validator 7
  ],
};

class LoadTester {
  constructor() {
    this.metrics = {
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      startTime: 0,
      endTime: 0,
      latencies: [],
      gasUsed: [],
      blockNumbers: [],
      errors: [],
    };
    this.providers = [];
    this.signers = [];
  }

  async initialize() {
    console.log("🔧 Initializing load test environment...");

    // Create providers for each validator
    for (const rpc of TEST_CONFIG.rpcEndpoints) {
      const provider = new ethers.JsonRpcProvider(rpc);
      this.providers.push(provider);
    }

    console.log(`✅ Connected to ${this.providers.length} validators`);

    // Create test signers from hardhat accounts
    const accounts = await hre.ethers.getSigners();
    this.signers = accounts.slice(0, Math.min(10, accounts.length));

    console.log(`✅ Test signers ready: ${this.signers.length} accounts`);
  }

  async checkPrerequisites() {
    console.log("\n📋 Checking prerequisites...");

    // Check all validators are healthy
    for (let i = 0; i < this.providers.length; i++) {
      try {
        const blockNumber = await this.providers[i].getBlockNumber();
        const gasPrice = await this.providers[i].getGasPrice();
        console.log(
          `  ✓ Validator ${i + 1}: Block #${blockNumber}, Gas: ${gasPrice} wei`
        );
      } catch (err) {
        console.error(`  ✗ Validator ${i + 1} unreachable: ${err.message}`);
        return false;
      }
    }

    // Check accounts have balance
    for (let i = 0; i < this.signers.length; i++) {
      const balance = await this.signers[i].provider.getBalance(
        this.signers[i].address
      );
      if (balance === 0n) {
        console.error(`  ✗ Account ${i} has zero balance`);
        return false;
      }
      console.log(
        `  ✓ Account ${i}: ${ethers.formatEther(balance)} ETH`
      );
    }

    return true;
  }

  async runLoadTest() {
    console.log("\n🚀 Starting load test...");
    console.log(`   Target: ${TEST_CONFIG.targetTPS} TPS for ${TEST_CONFIG.durationSeconds}s`);

    this.metrics.startTime = Date.now();
    const endTime = this.metrics.startTime + TEST_CONFIG.durationSeconds * 1000;

    let batchCount = 0;

    while (Date.now() < endTime) {
      const roundStartTime = Date.now();
      const txPromises = [];

      // Send batch of transactions
      for (let i = 0; i < TEST_CONFIG.batchSize; i++) {
        const signer = this.signers[i % this.signers.length];
        const provider = this.providers[i % this.providers.length];
        const signerWithProvider = signer.connect(provider);

        // Create simple transfer transaction (lowest gas, fastest execution)
        const recipientIndex = (i + 1) % this.signers.length;
        const recipient = this.signers[recipientIndex].address;

        const txPromise = this.sendTransaction(signerWithProvider, recipient, roundStartTime);
        txPromises.push(txPromise);
      }

      // Wait for batch to complete
      const results = await Promise.all(txPromises);
      results.forEach(result => {
        if (result.success) {
          this.metrics.successfulTransactions++;
        } else {
          this.metrics.failedTransactions++;
          this.metrics.errors.push(result.error);
        }
      });

      batchCount++;
      this.metrics.totalTransactions += TEST_CONFIG.batchSize;

      // Log progress every 30 seconds
      if (batchCount % 30 === 0) {
        const elapsed = (Date.now() - this.metrics.startTime) / 1000;
        const currentTPS = Math.round(this.metrics.successfulTransactions / elapsed);
        console.log(
          `  📊 Batch ${batchCount}: ${currentTPS} TPS (${this.metrics.successfulTransactions}/${this.metrics.totalTransactions} successful)`
        );
      }

      // Rate limiting: space out batches to achieve target TPS
      const batchDuration = Date.now() - roundStartTime;
      const targetBatchDuration = (TEST_CONFIG.batchSize / TEST_CONFIG.targetTPS) * 1000;
      if (batchDuration < targetBatchDuration) {
        await new Promise(resolve => 
          setTimeout(resolve, targetBatchDuration - batchDuration)
        );
      }
    }

    this.metrics.endTime = Date.now();
  }

  async sendTransaction(signer, recipient, batchStartTime) {
    try {
      const txStartTime = Date.now();

      // Send simple transfer (0.001 ETH)
      const tx = await signer.sendTransaction({
        to: recipient,
        value: ethers.parseEther("0.001"),
        gasLimit: 21000,
      });

      const txSentTime = Date.now();

      // Wait for receipt
      const receipt = await tx.wait();
      const txConfirmedTime = Date.now();

      if (!receipt) {
        return {
          success: false,
          error: "No receipt",
        };
      }

      this.metrics.latencies.push(txConfirmedTime - txStartTime);
      this.metrics.gasUsed.push(receipt.gasUsed.toString());
      this.metrics.blockNumbers.push(receipt.blockNumber);

      return {
        success: true,
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        latency: txConfirmedTime - txStartTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async checkConsensusHealth() {
    console.log("\n🔍 Checking consensus health after load test...");

    const blockNumbers = [];
    for (let i = 0; i < this.providers.length; i++) {
      const blockNumber = await this.providers[i].getBlockNumber();
      blockNumbers.push(blockNumber);
      console.log(`  Validator ${i + 1}: Block #${blockNumber}`);
    }

    const maxBlock = Math.max(...blockNumbers);
    const minBlock = Math.min(...blockNumbers);
    const divergence = maxBlock - minBlock;

    if (divergence > 3) {
      console.warn(`  ⚠️  CONSENSUS DIVERGENCE: ${divergence} blocks difference`);
      return false;
    } else {
      console.log(`  ✅ Consensus healthy: ${divergence} block divergence (acceptable)`);
      return true;
    }
  }

  analyzeResults() {
    console.log("\n📈 Load Test Results:");

    const duration = (this.metrics.endTime - this.metrics.startTime) / 1000;
    const actualTPS = Math.round(this.metrics.successfulTransactions / duration);
    const successRate = 
      (this.metrics.successfulTransactions / this.metrics.totalTransactions) * 100;

    console.log(`\n  Total Transactions: ${this.metrics.totalTransactions}`);
    console.log(`  Successful: ${this.metrics.successfulTransactions}`);
    console.log(`  Failed: ${this.metrics.failedTransactions}`);
    console.log(`  Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`  Duration: ${duration.toFixed(1)}s`);
    console.log(`  Actual TPS: ${actualTPS}`);
    console.log(`  Target TPS: ${TEST_CONFIG.targetTPS}`);
    console.log(`  TPS Achievement: ${((actualTPS / TEST_CONFIG.targetTPS) * 100).toFixed(1)}%`);

    const avgLatency =
      this.metrics.latencies.reduce((a, b) => a + b, 0) /
      this.metrics.latencies.length;
    const maxLatency = Math.max(...this.metrics.latencies);
    const minLatency = Math.min(...this.metrics.latencies);

    console.log(`\n  Latency:`);
    console.log(`    Average: ${avgLatency.toFixed(0)}ms`);
    console.log(`    Min: ${minLatency.toFixed(0)}ms`);
    console.log(`    Max: ${maxLatency.toFixed(0)}ms`);
    console.log(`    P95: ${this.percentile(this.metrics.latencies, 0.95).toFixed(0)}ms`);
    console.log(`    P99: ${this.percentile(this.metrics.latencies, 0.99).toFixed(0)}ms`);

    // Pass/Fail criteria
    console.log(`\n  ✅ PASS CRITERIA:`);
    console.log(`    [${actualTPS >= TEST_CONFIG.targetTPS ? "✓" : "✗"}] TPS >= ${TEST_CONFIG.targetTPS}`);
    console.log(`    [${successRate >= 95 ? "✓" : "✗"}] Success rate >= 95%`);
    console.log(`    [${avgLatency <= 1000 ? "✓" : "✗"}] Avg latency <= 1000ms`);
    console.log(`    [${maxLatency <= 5000 ? "✓" : "✗"}] Max latency <= 5000ms`);

    const allPassed =
      actualTPS >= TEST_CONFIG.targetTPS &&
      successRate >= 95 &&
      avgLatency <= 1000 &&
      maxLatency <= 5000;

    return {
      passed: allPassed,
      actualTPS,
      successRate,
      avgLatency,
      maxLatency,
    };
  }

  percentile(arr, p) {
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }

  saveReport() {
    const report = {
      testConfig: TEST_CONFIG,
      metrics: {
        ...this.metrics,
        latencies: undefined, // Too much data
        gasUsed: undefined,
        blockNumbers: undefined,
      },
      results: this.analyzeResults(),
      timestamp: new Date().toISOString(),
    };

    const filename = `load-test-report-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${filename}`);
  }
}

async function main() {
  const tester = new LoadTester();

  try {
    await tester.initialize();
    const ready = await tester.checkPrerequisites();

    if (!ready) {
      console.error("❌ Environment not ready for load test");
      process.exit(1);
    }

    await tester.runLoadTest();
    const consensusHealthy = await tester.checkConsensusHealth();

    if (!consensusHealthy) {
      console.warn("⚠️  Warning: Consensus divergence detected");
    }

    const results = tester.analyzeResults();
    tester.saveReport();

    if (results.passed) {
      console.log("\n✅ LOAD TEST PASSED! System ready for production.");
      process.exit(0);
    } else {
      console.log("\n❌ LOAD TEST FAILED. Review results above.");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Load test error:", error);
    process.exit(1);
  }
}

main();
