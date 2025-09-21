# Pharbit Blockchain - Working Startup Script
Write-Host "🚀 Starting Pharbit Blockchain Application..." -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "   Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    $envContent = @"
NODE_ENV=development
PORT=3000
HOST=localhost
ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_CHAIN_ID=31337
"@
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ .env file created" -ForegroundColor Green
}

# Copy .env to backend directory
if (Test-Path ".env") {
    Copy-Item ".env" "backend\.env" -Force
    Write-Host "✅ .env copied to backend directory" -ForegroundColor Green
}

Write-Host "`n🔄 Starting all services..." -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "This will start:" -ForegroundColor Yellow
Write-Host "  • Hardhat blockchain node (port 8545)" -ForegroundColor White
Write-Host "  • Backend API server (port 3000)" -ForegroundColor White
Write-Host "  • Frontend React app (port 3001)" -ForegroundColor White
Write-Host ""

# Start all services
Write-Host "🚀 Starting services..." -ForegroundColor Green
npm run dev
