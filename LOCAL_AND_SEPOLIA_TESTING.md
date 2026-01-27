# Local & Sepolia Testing Guide

**Complete step-by-step instructions for testing audit-ready contracts**

---

## Part 1: Local Testing (Localhost)

### 1.1 Prerequisites

```bash
# Install Docker & Docker Compose
docker --version     # >= 20.10
docker-compose --version  # >= 2.0

# Install Node.js
node --version       # >= 18.0
npm --version        # >= 9.0

# Clone repository
cd /workspaces/Blockchain
npm install
cd contracts && npm install
```

### 1.2 Start 7-Node IBFT Cluster

```bash
# From repository root
docker-compose -f docker-compose.audit-ready.yml up -d

# Wait for convergence (60 seconds)
sleep 60

# Verify all validators are healthy
echo "Checking validator health..."
for i in {1..7}; do
  PORT=$((8544+$i))
  RESPONSE=$(curl -s -X POST http://localhost:$PORT \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}')
  
  if echo "$RESPONSE" | grep -q "result"; then
    BLOCK=$(echo "$RESPONSE" | jq -r '.result' | xargs printf "%d")
    echo "✓ Validator $i: Block #$BLOCK"
  else
    echo "✗ Validator $i: FAILED"
    exit 1
  fi
done

echo ""
echo "✅ All validators healthy!"
```

### 1.3 Deploy Contracts

```bash
# Compile contracts
cd /workspaces/Blockchain/contracts
npx hardhat compile

# Expected output:
# Compiling 4 sources...
# ✓ Compiled 4 sources successfully

# Deploy to localhost
npx hardhat run scripts/deploy-audit-ready.js --network localhost

# Expected output:
# 1️⃣  Deploying PharmaToken (ERC-1155)...
#    ✓ PharmaToken deployed to: 0x...
# 2️⃣  Deploying AttributableActions (ALCOA+ compliance)...
#    ✓ AttributableActions deployed to: 0x...
# ... etc
# ✅ All contracts deployed successfully!
```

**Save deployment addresses:**
```bash
# Copy output addresses to a file
PHARMA_TOKEN=0x... # From output
ATTRIBUTABLE_ACTIONS=0x...
IOT_TRACKER=0x...
PRIVATE_LEDGER=0x...
SIGNATURE_SUITE=0x...
IDENTITY_VERIFICATION=0x...
EMERGENCY_RECOVERY=0x...

echo "Export these to your .env for testing:"
echo "REACT_APP_PHARMA_TOKEN=$PHARMA_TOKEN"
echo "REACT_APP_ATTRIBUTABLE_ACTIONS=$ATTRIBUTABLE_ACTIONS"
# etc.
```

### 1.4 Run Unit Tests

```bash
cd /workspaces/Blockchain/contracts

# Run all audit-ready tests
npx hardhat test test/audit-ready.test.js

# Expected output:
# PharbitChain - Audit-Ready Contracts
#   Asset Lifecycle - Mint to Burn
#     ✓ Should mint a batch (MANUFACTURER_ROLE only)
#     ✓ Should prevent non-manufacturers from minting
#     ✓ Should burn tokens when pharmacy consumes medicine
#     ✓ Should prevent double-spend of tokens
#   Dual-Signature Transfers
#     ✓ Should propose transfer requiring both party signatures
#     ✓ Should only complete transfer when both parties sign
#   ...
# 30 passing (2.5s)

# Expected: All 30 tests pass
```

### 1.5 Signature Meaning Test

Test that signatures properly document intent:

```bash
# Create test file: tests/test-signature-suite.js
cat > /workspaces/Blockchain/contracts/test/test-signature-suite.js << 'EOF'
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SignatureSuite - FDA 21 CFR Part 11 Compliance", () => {
  let signatureSuite;
  let owner, signer, verifier;

  before(async () => {
    [owner, signer, verifier] = await ethers.getSigners();
    
    const SignatureSuite = await ethers.getContractFactory("SignatureSuite");
    signatureSuite = await SignatureSuite.deploy();
    await signatureSuite.waitForDeployment();
  });

  it("Should register signer identity (Employee ID required)", async () => {
    // Register signer with explicit employee ID
    const tx = await signatureSuite.registerAndVerifySignerIdentity(
      signer.address,
      "LAB-TECH-00123",           // Employee ID (FDA requirement)
      "PFIZER-MANUFACTURING-01",  // Organization (FDA requirement)
      "Quality Assurance Manager", // Job title (FDA requirement)
      Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 // 1 year
    );

    expect(tx).to.emit(signatureSuite, "SignerVerified");
    
    // Verify identity is registered
    const identity = await signatureSuite.getSignerIdentity(signer.address);
    expect(identity.employeeId).to.equal("LAB-TECH-00123");
    expect(identity.isVerified).to.be.true;
  });

  it("Should require explicit intent statement on signature", async () => {
    // Prepare document
    const documentHash = ethers.keccak256(
      ethers.toUtf8Bytes("batch-12345-manufacturing-record")
    );

    // Create signature WITH INTENT
    const intentStatement = "I verify batch #12345 meets all FDA quality standards";
    const signingReason = "Passed temperature monitoring and sterility checks";

    // Sign the message
    const messageHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "string", "string"],
        [documentHash, intentStatement, signingReason]
      )
    );
    
    const signature = await signer.signMessage(
      ethers.getBytes(messageHash)
    );

    // Create signature on blockchain
    const tx = await signatureSuite.createSignature(
      documentHash,
      0, // BATCH_VERIFICATION intent
      intentStatement,
      signingReason,
      signature,
      0  // Permanent (never expires)
    );

    expect(tx).to.emit(signatureSuite, "SignatureCreated");

    // Verify signature is recorded
    const signatures = await signatureSuite.getDocumentSignatures(documentHash);
    expect(signatures.length).to.equal(1);
    expect(signatures[0].intentStatement).to.equal(intentStatement);
    expect(signatures[0].signingReason).to.equal(signingReason);
  });

  it("Should prevent unauthorized signers", async () => {
    const documentHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
    
    // Try to sign without being registered
    const unregisteredSigner = (await ethers.getSigners())[5];
    
    const tx = signatureSuite.createSignature(
      documentHash,
      0,
      "Invalid signature",
      "Not authorized",
      "0x",
      0
    );

    await expect(tx).to.be.revertedWith("Signer not authorized");
  });
});
EOF

# Run the test
npx hardhat test test/test-signature-suite.js
```

Expected output:
```
SignatureSuite - FDA 21 CFR Part 11 Compliance
  ✓ Should register signer identity (Employee ID required)
  ✓ Should require explicit intent statement on signature
  ✓ Should prevent unauthorized signers

3 passing (456ms)
```

### 1.6 Identity Verification Test

```bash
# Create test file: tests/test-identity-verification.js
cat > /workspaces/Blockchain/contracts/test/test-identity-verification.js << 'EOF'
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IdentityVerification - Multi-Step Verification", () => {
  let identityVerification;
  let owner, applicant, verifier1, verifier2, complianceOfficer;

  before(async () => {
    [owner, applicant, verifier1, verifier2, complianceOfficer] = 
      await ethers.getSigners();
    
    const IdentityVerification = 
      await ethers.getContractFactory("IdentityVerification");
    identityVerification = await IdentityVerification.deploy();
    await identityVerification.waitForDeployment();

    // Setup verifier roles
    await identityVerification.registerVerifier(verifier1.address);
    await identityVerification.registerVerifier(verifier2.address);
    await identityVerification.registerComplianceOfficer(
      complianceOfficer.address
    );
  });

  it("Should require verification before role assignment", async () => {
    // Step 1: Applicant submits request
    const tx = await identityVerification
      .connect(applicant)
      .requestIdentityVerification(
        "CVS Pharmacy Inc.",
        "DEA-CVS-123456",
        "PHARMACY",
        "QmXxxx..." // IPFS hash
      );

    expect(tx).to.emit(identityVerification, "VerificationRequested");

    // Step 2: Verifier 1 completes BASIC checks
    await identityVerification
      .connect(verifier1)
      .completeVerificationStep(
        applicant.address,
        1, // BASIC level
        "QmBasicCheck...",
        "Email and phone verified"
      );

    // Step 3: Verifier 2 completes STANDARD checks
    await identityVerification
      .connect(verifier2)
      .completeVerificationStep(
        applicant.address,
        2, // STANDARD level
        "QmLicenseCheck...",
        "Business license verified"
      );

    // Step 4: Compliance officer approves
    const approveTx = await identityVerification
      .connect(complianceOfficer)
      .approveForRoleAssignment(
        applicant.address,
        "PHARMACY",
        365 // Valid 1 year
      );

    expect(approveTx).to.emit(identityVerification, "EntityApproved");

    // Verify: Entity is now approved for role assignment
    const isApproved = await identityVerification.isApprovedForRole(
      applicant.address
    );
    expect(isApproved).to.be.true;
  });

  it("Should track full verification history", async () => {
    // Applicant requests
    await identityVerification
      .connect(applicant)
      .requestIdentityVerification(
        "Test Pharmacy",
        "DEA-TEST-999",
        "PHARMACY",
        "Qm..."
      );

    // Verify through steps
    await identityVerification
      .connect(verifier1)
      .completeVerificationStep(
        applicant.address,
        1, // BASIC
        "Qm1",
        ""
      );

    // Get history
    const (level, verifiers, dates, documents) = 
      await identityVerification.getVerificationHistory(
        applicant.address
      );

    expect(level).to.equal(1); // BASIC
    expect(verifiers.length).to.equal(1);
    expect(verifiers[0]).to.equal(verifier1.address);
  });
});
EOF

npx hardhat test test/test-identity-verification.js
```

### 1.7 Load Test (100 TPS)

```bash
cd /workspaces/Blockchain

# Run 5-minute load test
node tests/load-test.js

# Expected output shows:
# ✅ LOAD TEST PASSED! System ready for production.
# 
# Actual TPS: 99.5 (vs target 100)
# Success Rate: 99.50%
# Avg Latency: 245ms
# Max Latency: 892ms
```

### 1.8 Privacy Audit

```bash
# Test that batch prices are NOT visible publicly
node tests/private-leak-audit.js

# Expected output:
# ✅ PRIVACY AUDIT PASSED: Tessera is working correctly
#    • Batch prices are NOT visible on public block explorer
#    • Only authorized parties can see pricing data
```

### 1.9 Consensus Health Check

```bash
# After all tests, verify consensus is healthy
curl -s http://localhost:3001/health | jq .

# Expected:
# {
#   "status": "HEALTHY",
#   "healthyValidators": 7,
#   "blockDivergence": 0,
#   "consensusHealthy": true
# }
```

### 1.10 Cleanup (Local Testing)

```bash
# Stop all validators and services
docker-compose -f docker-compose.audit-ready.yml down

# Remove volumes (fresh start next time)
docker-compose -f docker-compose.audit-ready.yml down -v
```

---

## Part 2: Sepolia Testnet Deployment

### 2.1 Prerequisites

```bash
# 1. Get Sepolia ETH (free)
# Visit: https://www.alchemy.com/faucets/ethereum-sepolia
# or: https://www.infura.io/faucet/sepolia
# Send to your deployer address (need ~0.5 ETH for all deployments)

# 2. Get RPC URL
# Infura: https://infura.io → Create project → Copy Sepolia RPC URL
# Alchemy: https://alchemy.com → Create app → Copy Sepolia RPC URL

# 3. Get Etherscan API key (optional, for verification)
# https://etherscan.io → Sign up → Create API key

# 4. Create .env file
cat > /workspaces/Blockchain/.env << 'EOF'
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
SEPOLIA_PRIVATE_KEY=0x... # Your deployer private key (with Sepolia ETH)
ETHERSCAN_API_KEY=... # Optional, for contract verification
EOF

# 5. Verify RPC is working
curl -X POST https://sepolia.infura.io/v3/YOUR_INFURA_KEY \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Should return: {"jsonrpc":"2.0","result":"0x...","id":1}
```

### 2.2 Deploy to Sepolia

```bash
cd /workspaces/Blockchain/contracts

# Compile (if not done)
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy-sepolia.js --network sepolia

# Expected output:
# 🚀 Deploying to Sepolia Testnet
# ═══════════════════════════════════════════════════════════
# 
# 📡 Network: sepolia (Chain ID: 11155111)
# 👤 Deployer: 0xYourAddress
# 💰 Balance: 0.75 ETH
# 
# 1️⃣  Deploying SignatureSuite...
#    ✓ SignatureSuite: 0x...
# 2️⃣  Deploying IdentityVerification...
#    ✓ IdentityVerification: 0x...
# ... etc
# 
# 🎉 DEPLOYMENT COMPLETE!
# 📄 Deployment info saved to: sepolia-deployment-1705969234567.json
```

### 2.3 Verify Contracts on Etherscan (Optional)

```bash
# Get addresses from sepolia-deployment-TIMESTAMP.json
SIGNATURE_SUITE=0x... # From output
PHARMA_TOKEN=0x...
# etc.

# Verify SignatureSuite
npx hardhat verify \
  --network sepolia \
  $SIGNATURE_SUITE \
  --contract contracts/SignatureSuite.sol:SignatureSuite

# Verify PharmaToken
npx hardhat verify \
  --network sepolia \
  $PHARMA_TOKEN \
  "ipfs://" "$EMERGENCY_RECOVERY" \
  --contract contracts/PharmaToken.sol:PharmaToken

# Expected output for each:
# Successfully submitted contract for verification on etherscan.
# Waiting for etherscan to process submission...
# Contract successfully verified on Etherscan.
```

### 2.4 Test Deployment on Sepolia

```bash
# Create test script: test-sepolia-deployment.js
cat > /workspaces/Blockchain/tests/test-sepolia-deployment.js << 'EOF'
const { ethers } = require("ethers");
const deployment = require("../sepolia-deployment-TIMESTAMP.json");

async function testDeployment() {
  // Connect to Sepolia
  const provider = new ethers.JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL
  );

  console.log("🔍 Testing Sepolia Deployment...\n");

  // Test each contract is callable
  const contracts = [
    { name: "SignatureSuite", address: deployment.contracts.SignatureSuite },
    { name: "PharmaToken", address: deployment.contracts.PharmaToken },
    { name: "IdentityVerification", address: deployment.contracts.IdentityVerification },
    { name: "EmergencyRecovery", address: deployment.contracts.EmergencyRecovery },
  ];

  for (const contract of contracts) {
    try {
      const code = await provider.getCode(contract.address);
      
      if (code === "0x") {
        console.log(`❌ ${contract.name}: No code at address`);
      } else {
        console.log(`✓ ${contract.name}: Verified on Sepolia`);
        console.log(`  Address: ${contract.address}`);
        console.log(`  Code size: ${(code.length - 2) / 2} bytes\n`);
      }
    } catch (err) {
      console.error(`✗ ${contract.name}: ${err.message}`);
    }
  }

  console.log("✅ Sepolia Deployment Test Complete!");
  console.log("\n📊 Contract Addresses:");
  for (const contract of contracts) {
    console.log(
      `${contract.name.padEnd(25)}: ${contract.address}`
    );
  }

  console.log("\n🔗 View on Etherscan:");
  for (const contract of contracts) {
    console.log(
      `   https://sepolia.etherscan.io/address/${contract.address}`
    );
  }
}

testDeployment().catch(console.error);
EOF

# Run test
SEPOLIA_RPC_URL=https://... node tests/test-sepolia-deployment.js
```

### 2.5 Sample Interactions on Sepolia

```bash
# Create interaction script: scripts/interact-sepolia.js
cat > /workspaces/Blockchain/scripts/interact-sepolia.js << 'EOF'
const { ethers } = require("ethers");
const deployment = require("../contracts/scripts/../sepolia-deployment-TIMESTAMP.json");

const IDENTITY_VERIFICATION_ABI = [
  "function requestIdentityVerification(string,string,string,string)",
  "function isApprovedForRole(address) view returns (bool)",
  "function getEntityIdentity(address) view returns (tuple)",
];

async function main() {
  // Setup
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const signer = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);

  const identityVerification = new ethers.Contract(
    deployment.contracts.IdentityVerification,
    IDENTITY_VERIFICATION_ABI,
    signer
  );

  console.log("Interacting with Sepolia Deployment...\n");

  // Example 1: Request identity verification
  console.log("1️⃣  Requesting identity verification for CVS Pharmacy...");
  
  const tx = await identityVerification.requestIdentityVerification(
    "CVS Pharmacy Inc.",
    "DEA-CVS-123456",
    "PHARMACY",
    "QmXxxx..." // IPFS hash of supporting docs
  );

  const receipt = await tx.wait();
  console.log(`   ✓ Transaction: ${receipt.hash}`);
  console.log(`   ✓ Block: ${receipt.blockNumber}`);
  console.log(`   ✓ Gas used: ${receipt.gasUsed.toString()}\n`);

  // Example 2: Check if approved
  console.log("2️⃣  Checking approval status...");
  const isApproved = await identityVerification.isApprovedForRole(
    signer.address
  );
  console.log(`   Approved: ${isApproved}\n`);

  console.log("✅ Sepolia interaction complete!");
}

main().catch(console.error);
EOF

# Run interaction
SEPOLIA_RPC_URL=... SEPOLIA_PRIVATE_KEY=... node scripts/interact-sepolia.js
```

---

## Part 3: Comparison: Local vs Sepolia

| Aspect | Local | Sepolia |
|--------|-------|---------|
| **Speed** | Instant (< 5s/tx) | ~12s/tx |
| **Cost** | Free | ~0.005 ETH/tx |
| **Network** | Single machine | Real Ethereum testnet |
| **Use Case** | Development & testing | Pre-submission verification |
| **Nodes** | 7 (docker) | Sepolia public network |
| **Permanence** | Resets on restart | Permanent (6 months+) |
| **FDA Relevance** | Low | High |
| **Testing Speed** | Fast (minutes) | Slow (hours) |

**Recommendation:**
1. Use **Local** for rapid development and iteration
2. Use **Sepolia** for final FDA submission materials
3. Test on both before official submission

---

## Part 4: Troubleshooting

### Local Issues

**Problem:** Validators won't start
```bash
# Solution
docker-compose -f docker-compose.audit-ready.yml down -v
docker-compose -f docker-compose.audit-ready.yml up -d
sleep 60
```

**Problem:** Consensus divergence during load test
```bash
# Solution: Increase request timeout
# Edit docker-compose.audit-ready.yml
# Change:
# "blockperiodseconds": 12
# "requesttimeoutseconds": 25  # ← Increase to 25
```

### Sepolia Issues

**Problem:** "Insufficient funds" error
```bash
# Solution: Get more Sepolia ETH
# https://www.alchemy.com/faucets/ethereum-sepolia
# Send 0.5+ ETH to your deployer address
```

**Problem:** "Block Explorer says contract not verified"
```bash
# Solution: Run hardhat verify command
npx hardhat verify --network sepolia 0xADDRESS
```

---

## Next Steps

After successful local and Sepolia testing:

1. ✅ Complete load test report
2. ✅ Complete privacy audit report  
3. ✅ Document identity verification process
4. ✅ Test emergency recovery procedure
5. ✅ Schedule FDA pre-submission meeting
6. ✅ Share this document + test results with FDA

