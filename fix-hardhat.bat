@echo off
echo 🔧 Fixing Hardhat installation...

REM Navigate to contracts directory
cd contracts

REM Install Hardhat locally
echo 📦 Installing Hardhat locally...
npm install hardhat@^2.22.0

REM Verify installation
echo ✅ Verifying Hardhat installation...
npx hardhat --version

echo 🎉 Hardhat is now installed locally!
echo You can now run ./quick-start-local.sh again

cd ..
pause
