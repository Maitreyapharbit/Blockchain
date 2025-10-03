# PharbitChain Development Environment Startup Script
Write-Host "🚀 Starting PharbitChain Development Environment..." -ForegroundColor Green
Write-Host "📋 Including Recall Management & Anti-Counterfeiting Features" -ForegroundColor Magenta
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Create necessary directories
Write-Host "📁 Creating necessary directories..." -ForegroundColor Blue
New-Item -ItemType Directory -Force -Path "logs" | Out-Null
New-Item -ItemType Directory -Force -Path "backend\logs" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend\logs" | Out-Null

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        return $connection -ne $null
    }
    catch {
        return $false
    }
}

# Function to kill processes on a port
function Stop-ProcessOnPort {
    param([int]$Port)
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        foreach ($pid in $processes) {
            if ($pid -gt 0) {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        }
    }
    catch {
        # Ignore errors
    }
}

# Free up commonly used ports
Write-Host "🔧 Checking and freeing up ports..." -ForegroundColor Blue
$ports = @(3000, 3001, 8545)
foreach ($port in $ports) {
    if (Test-Port -Port $port) {
        Write-Host "⚠️ Port $port is in use. Freeing it..." -ForegroundColor Yellow
        Stop-ProcessOnPort -Port $port
        Start-Sleep -Seconds 2
    }
}

# Start Hardhat blockchain node
Write-Host "⛓️ Starting Hardhat blockchain node..." -ForegroundColor Cyan
Set-Location "contracts"

# Ensure dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing Hardhat dependencies..." -ForegroundColor Blue
    npm install --force
}

# Start Hardhat node
Write-Host "🚀 Starting Hardhat node..." -ForegroundColor Blue
Start-Process -FilePath "npx" -ArgumentList "hardhat", "node" -WindowStyle Hidden -RedirectStandardOutput "..\logs\hardhat-node.log" -RedirectStandardError "..\logs\hardhat-node.log"
Start-Sleep -Seconds 5

# Wait for Hardhat node to be ready
Write-Host "⏳ Waiting for Hardhat node to be ready..." -ForegroundColor Blue
$maxAttempts = 30
$attempt = 1
while ($attempt -le $maxAttempts) {
    if (Test-Port -Port 8545) {
        Write-Host "✅ Hardhat node is ready!" -ForegroundColor Green
        break
    }
    Write-Host "Attempt $attempt/$maxAttempts - waiting for Hardhat node..." -ForegroundColor Blue
    Start-Sleep -Seconds 2
    $attempt++
}

if ($attempt -gt $maxAttempts) {
    Write-Host "❌ Hardhat node failed to start after $maxAttempts attempts" -ForegroundColor Red
    Write-Host "Check logs\hardhat-node.log for details" -ForegroundColor Yellow
    exit 1
}

# Deploy smart contracts
Write-Host "📜 Deploying smart contracts..." -ForegroundColor Blue
Write-Host "Compiling contracts..." -ForegroundColor Blue
npx hardhat compile > ..\logs\contract-compile.log 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Contracts compiled successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Contract compilation failed" -ForegroundColor Red
    Write-Host "Check logs\contract-compile.log for details" -ForegroundColor Yellow
    exit 1
}

Write-Host "Deploying to local network..." -ForegroundColor Blue
npx hardhat run scripts\deploy.js --network hardhat > ..\logs\contract-deploy.log 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Smart contracts deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Contract deployment failed" -ForegroundColor Red
    Write-Host "Check logs\contract-deploy.log for details" -ForegroundColor Yellow
    exit 1
}

Set-Location ".."

# Start backend server
Write-Host "🔧 Starting backend server..." -ForegroundColor Cyan
Set-Location "backend"

# Ensure dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Blue
    npm install --force
}

# Create .env if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating backend .env file..." -ForegroundColor Yellow
    $envContent = @"
# Backend Configuration
NODE_ENV=development
PORT=3001
HOST=localhost
CORS_ORIGIN=http://localhost:3000

# Database Configuration
DATABASE_URL=postgresql://localhost:5432/pharbit

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRY=24h

# Blockchain Configuration
ETHEREUM_RPC_URL=http://localhost:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
"@
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
}

# Start backend server
Write-Host "🚀 Starting backend server..." -ForegroundColor Blue
Start-Process -FilePath "node" -ArgumentList "simple-server.js" -WindowStyle Hidden -RedirectStandardOutput "..\logs\backend.log" -RedirectStandardError "..\logs\backend.log"
Start-Sleep -Seconds 3

# Wait for backend to be ready
Write-Host "⏳ Waiting for backend server..." -ForegroundColor Blue
$maxAttempts = 30
$attempt = 1
while ($attempt -le $maxAttempts) {
    if (Test-Port -Port 3001) {
        Write-Host "✅ Backend server is ready!" -ForegroundColor Green
        break
    }
    Write-Host "Attempt $attempt/$maxAttempts - waiting for backend..." -ForegroundColor Blue
    Start-Sleep -Seconds 2
    $attempt++
}

if ($attempt -gt $maxAttempts) {
    Write-Host "❌ Backend server failed to start after $maxAttempts attempts" -ForegroundColor Red
    Write-Host "Check logs\backend.log for details" -ForegroundColor Yellow
    exit 1
}

Set-Location ".."

# Start frontend
Write-Host "🌐 Starting frontend application..." -ForegroundColor Cyan
Set-Location "frontend"

# Ensure dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Blue
    npm install --force
}

# Create .env if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating frontend .env file..." -ForegroundColor Yellow
    $envContent = @"
# Frontend Configuration
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001

# Blockchain Configuration
REACT_APP_ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_CHAIN_ID=1337
REACT_APP_CHAIN_NAME="Hardhat Local"

# Development Configuration
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
"@
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
}

# Start frontend
Write-Host "🚀 Starting frontend application..." -ForegroundColor Blue
Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Hidden -RedirectStandardOutput "..\logs\frontend.log" -RedirectStandardError "..\logs\frontend.log"
Start-Sleep -Seconds 5

# Wait for frontend to be ready
Write-Host "⏳ Waiting for frontend application..." -ForegroundColor Blue
$maxAttempts = 30
$attempt = 1
while ($attempt -le $maxAttempts) {
    if (Test-Port -Port 3000) {
        Write-Host "✅ Frontend application is ready!" -ForegroundColor Green
        break
    }
    Write-Host "Attempt $attempt/$maxAttempts - waiting for frontend..." -ForegroundColor Blue
    Start-Sleep -Seconds 2
    $attempt++
}

if ($attempt -gt $maxAttempts) {
    Write-Host "❌ Frontend application failed to start after $maxAttempts attempts" -ForegroundColor Red
    Write-Host "Check logs\frontend.log for details" -ForegroundColor Yellow
    exit 1
}

Set-Location ".."

# Display success message
Write-Host ""
Write-Host "✨ PharbitChain Development Environment is now running!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Services:" -ForegroundColor Cyan
Write-Host "  - Hardhat Node: http://localhost:8545" -ForegroundColor White
Write-Host "  - Backend API: http://localhost:3001" -ForegroundColor White
Write-Host "  - Frontend App: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "🚨 Recall Management Features:" -ForegroundColor Magenta
Write-Host "  - API: http://localhost:3001/api/recalls" -ForegroundColor White
Write-Host "  - Health Check: http://localhost:3001/api/health" -ForegroundColor White
Write-Host ""
Write-Host "🛡️ Anti-Counterfeiting Features:" -ForegroundColor Magenta
Write-Host "  - API: http://localhost:3001/api/counterfeit" -ForegroundColor White
Write-Host "  - Verification: http://localhost:3001/api/counterfeit/verify" -ForegroundColor White
Write-Host ""
Write-Host "📝 Logs are available in the logs\ directory" -ForegroundColor Blue
Write-Host "🛑 To stop all services, close this window or press Ctrl+C" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to stop all services..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
