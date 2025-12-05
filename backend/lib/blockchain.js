const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const CHAIN_PATH = path.join(process.cwd(), 'data', 'blockchain.json');

function getChain() {
  if (!fs.existsSync(CHAIN_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(CHAIN_PATH, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveChain(chain) {
  fs.writeFileSync(CHAIN_PATH, JSON.stringify(chain, null, 2));
}

function createAndBroadcastTx(tx) {
  // Add hash, timestamp, and persist
  const chain = getChain();
  const txData = {
    ...tx,
    timestamp: tx.timestamp || new Date().toISOString(),
    hash: crypto.createHash('sha256').update(JSON.stringify(tx)).digest('hex'),
    index: chain.length
  };
  chain.push(txData);
  saveChain(chain);
  // TODO: broadcast to P2P (not implemented here)
  return txData;
}

// Transaction type schemas
// PRICE_UPDATE: { type: 'PRICE_UPDATE', drugId, oldPrice, newPrice, actor, notes, fileHash, fileUrl }
// CALIBRATION_EVENT: { type: 'CALIBRATION_EVENT', equipmentId, calibrationDate, actor, notes, fileHash, fileUrl }

module.exports = { getChain, createAndBroadcastTx };
