const fs = require('fs');
const path = require('path');

const COVERAGE_FILE = path.join(__dirname, '..', 'coverage', 'coverage-final.json');
const TARGET = 80; // percent

if (!fs.existsSync(COVERAGE_FILE)) {
  console.error('Coverage file not found:', COVERAGE_FILE);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(COVERAGE_FILE, 'utf8'));
let totalCovered = 0;
let total = 0;

for (const [file, info] of Object.entries(data)) {
  if (!file.startsWith('contracts/')) continue; // ignore other files
  if (file.includes('/test/')) continue; // skip test helper contracts

  const l = info.l || {};
  for (const [line, count] of Object.entries(l)) {
    total++;
    if (count > 0) totalCovered++;
  }
}

const pct = (totalCovered / total) * 100;
console.log(`Coverage lines: ${pct.toFixed(2)}% (threshold ${TARGET}%)`);
if (pct < TARGET) {
  console.error('Coverage threshold not met');
  process.exit(2);
}
process.exit(0);
