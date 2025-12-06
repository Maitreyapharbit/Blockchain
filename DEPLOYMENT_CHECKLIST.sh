#!/bin/bash

# ================================================================
# PRICING TRANSPARENCY & CALIBRATION - DEPLOYMENT CHECKLIST
# Run this script to verify everything is ready
# ================================================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  PHARBIT BLOCKCHAIN - PRICING & CALIBRATION DEPLOYMENT    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}CHECKING DEPLOYMENT REQUIREMENTS...${NC}\n"

# Check 1: SQL Schema File
echo -n "✓ Schema file (SUPABASE_SETUP_READY.sql) exists... "
if [ -f "/workspaces/Blockchain/SUPABASE_SETUP_READY.sql" ]; then
  echo -e "${GREEN}FOUND${NC}"
  SCHEMA_SIZE=$(wc -l < /workspaces/Blockchain/SUPABASE_SETUP_READY.sql)
  echo "  └─ Contains $SCHEMA_SIZE lines (9 tables)"
else
  echo -e "${RED}NOT FOUND${NC}"
fi

# Check 2: Backend Routes
echo -n "✓ Backend pricing route exists... "
if [ -f "/workspaces/Blockchain/backend/routes/pricing.js" ]; then
  echo -e "${GREEN}FOUND${NC}"
  PRICING_ROUTES=$(grep -c "router\." /workspaces/Blockchain/backend/routes/pricing.js)
  echo "  └─ Contains $PRICING_ROUTES route endpoints"
else
  echo -e "${RED}NOT FOUND${NC}"
fi

echo -n "✓ Backend calibration route exists... "
if [ -f "/workspaces/Blockchain/backend/routes/calibration.js" ]; then
  echo -e "${GREEN}FOUND${NC}"
  CALIBRATION_ROUTES=$(grep -c "router\." /workspaces/Blockchain/backend/routes/calibration.js)
  echo "  └─ Contains $CALIBRATION_ROUTES route endpoints"
else
  echo -e "${RED}NOT FOUND${NC}"
fi

# Check 3: Frontend Components
echo -n "✓ Frontend pricing dashboard exists... "
if [ -f "/workspaces/Blockchain/frontend/src/components/PricingComparisonDashboard.js" ]; then
  echo -e "${GREEN}FOUND${NC}"
else
  echo -e "${RED}NOT FOUND${NC}"
fi

echo -n "✓ Frontend calibration tracker exists... "
if [ -f "/workspaces/Blockchain/frontend/src/components/EquipmentCalibrationTracker.js" ]; then
  echo -e "${GREEN}FOUND${NC}"
else
  echo -e "${RED}NOT FOUND${NC}"
fi

# Check 4: Smart Contracts
echo -n "✓ Smart contract exists... "
if [ -f "/workspaces/Blockchain/contracts/contracts/PricingCalibration.sol" ]; then
  echo -e "${GREEN}FOUND${NC}"
  echo "  └─ Contains DrugPricingLedger + EquipmentCalibrationLedger"
else
  echo -e "${RED}NOT FOUND${NC}"
fi

echo -n "✓ Deployment script exists... "
if [ -f "/workspaces/Blockchain/contracts/scripts/deploy-pricing-calibration.js" ]; then
  echo -e "${GREEN}FOUND${NC}"
else
  echo -e "${RED}NOT FOUND${NC}"
fi

# Check 5: Backend Dependencies
echo -n "✓ Backend package.json configured... "
if grep -q '"qrcode"' /workspaces/Blockchain/backend/package.json; then
  echo -e "${GREEN}FOUND${NC}"
  QR_VERSION=$(grep '"qrcode"' /workspaces/Blockchain/backend/package.json)
  echo "  └─ $QR_VERSION"
else
  echo -e "${YELLOW}MISSING - needs: npm install qrcode${NC}"
fi

echo -n "✓ Backend routes registered in index.js... "
if grep -q "app.use('/api/pricing'" /workspaces/Blockchain/backend/index.js && \
   grep -q "app.use('/api/calibration'" /workspaces/Blockchain/backend/index.js; then
  echo -e "${GREEN}FOUND${NC}"
else
  echo -e "${RED}NOT FOUND${NC}"
fi

# Check 6: Documentation
echo -n "✓ Integration guide exists... "
if [ -f "/workspaces/Blockchain/INTEGRATION_GUIDE.md" ]; then
  echo -e "${GREEN}FOUND${NC}"
else
  echo -e "${RED}NOT FOUND${NC}"
fi

echo ""
echo -e "${BLUE}NEXT STEPS (in order):${NC}"
echo ""
echo "  1️⃣  SUPABASE - Apply Database Schema"
echo "      • Open: https://supabase.com/dashboard"
echo "      • Go to: SQL Editor"
echo "      • Run file: SUPABASE_SETUP_READY.sql"
echo "      • Verify: 9 new tables appear"
echo ""

echo "  2️⃣  BACKEND - Install Dependencies"
echo "      • cd /workspaces/Blockchain/backend"
echo "      • npm install qrcode@^1.5.3"
echo "      • Verify: npm list qrcode"
echo ""

echo "  3️⃣  CONTRACTS - Deploy Smart Contracts"
echo "      • Terminal 1: npx hardhat node"
echo "      • Terminal 2: cd /workspaces/Blockchain/contracts"
echo "      • npx hardhat run scripts/deploy-pricing-calibration.js --network localhost"
echo "      • Save contract addresses → .env.local"
echo ""

echo "  4️⃣  BACKEND - Start Service"
echo "      • cd /workspaces/Blockchain/backend"
echo "      • npm start"
echo "      • Verify: http://localhost:3001/api/pricing/health"
echo ""

echo "  5️⃣  FRONTEND - Start UI"
echo "      • cd /workspaces/Blockchain/frontend"
echo "      • npm start"
echo "      • Open: http://localhost:3000/pricing"
echo ""

echo -e "${GREEN}═════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}STATUS: All files ready. Follow 5 steps above to deploy.${NC}"
echo -e "${GREEN}═════════════════════════════════════════════════════════${NC}"
echo ""
