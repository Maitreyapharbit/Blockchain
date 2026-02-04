PoC: bytes32 employeeId and consolidated contracts

What I implemented:
- Added optimized consolidated contracts: `Token.sol`, `Tracking.sol`, `AntiCounterfeiting.sol`, `PriceCalibration.sol`.
- Added PoC contracts `Token_PoC.sol` and `Tracking_PoC.sol` showing `bytes32` employeeId migration and minimized on-chain storage patterns.
- Added tests that measure gas used by `mintBatch` and `proposeDrugTransfer` in `test/poc-gas.test.js`.
- Added unit tests for the new contracts (`test/token.test.js`, `test/anti.test.js`, `test/price.test.js`).
- Added a lightweight deploy script `scripts/deploy-four.js` and a CI workflow `/.github/workflows/contracts-ci.yml` to run the tests on CI.

How to run locally (recommended):
1. cd contracts
2. npm ci
3. npx hardhat test test/poc-gas.test.js

Notes about failing tests in the current environment:
- Hardhat could not be executed in the current devcontainer because local installation resolution failed. If you run the steps above on your machine or in CI, the tests should run and produce gasUsed logs printed to stdout.

Next steps:
- If you want, I can open a PR that removes redundant contracts and updates the front-end and deployment scripts.
- I can also add `eth-gas-reporter` and CI gating to prevent regressions.
