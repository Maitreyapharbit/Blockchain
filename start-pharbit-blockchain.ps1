# Pharbit Blockchain - Complete Startup Script
# This script starts all services: Hardhat node, Backend, and Frontend

Write-Host "🚀 Starting Pharbit Blockchain Application..." -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Function to wait for a service to be ready
function Wait-ForService {
    param([string]$ServiceName, [int]$Port, [int]$TimeoutSeconds = 30)
    
    Write-Host "⏳ Waiting for $ServiceName to be ready on port $Port..." -ForegroundColor Yellow
    
    $timeout = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $timeout) {
        if (Test-Port -Port $Port) {
            Write-Host "✅ $ServiceName is ready!" -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 2
    }
    
    Write-Host "❌ $ServiceName failed to start within $TimeoutSeconds seconds" -ForegroundColor Red
    return $false
}

# Function to start a service in a new window
function Start-ServiceWindow {
    param([string]$ServiceName, [string]$Command, [string]$WorkingDirectory)
    
    Write-Host "🔄 Starting $ServiceName..." -ForegroundColor Cyan
    
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = "powershell.exe"
    $processInfo.Arguments = "-NoExit -Command `"cd '$WorkingDirectory'; Write-Host 'Starting $ServiceName...' -ForegroundColor Green; $Command`""
    $processInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Normal
    
    $process = [System.Diagnostics.Process]::Start($processInfo)
    
    if ($process) {
        Write-Host "✅ $ServiceName started in new window (PID: $($process.Id))" -ForegroundColor Green
        return $process
    } else {
        Write-Host "❌ Failed to start $ServiceName" -ForegroundColor Red
        return $null
    }
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "   Current directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "   Expected: Directory containing package.json" -ForegroundColor Yellow
    exit 1
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    @"
# PharbitChain Environment Variables
NODE_ENV=development
PORT=3000
HOST=localhost

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=eu-north-1
AWS_S3_BUCKET=your_s3_bucket

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_please_change_this_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Ethereum Configuration
ETHEREUM_RPC_URL=http://localhost:8545
ETHEREUM_RPC_URL_SEPOLIA=https://sepolia.infura.io/v3/your_project_id
ETHEREUM_RPC_URL_MAINNET=https://mainnet.infura.io/v3/your_project_id
PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# CORS Configuration
CORS_ORIGIN=http://localhost:3001
CORS_CREDENTIALS=true

# Health Check
HEALTH_CHECK_INTERVAL=30000

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your_session_secret_here

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=redis_password

# External APIs
INFURA_PROJECT_ID=your_infura_project_id
ALCHEMY_API_KEY=your_alchemy_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key

# React App Configuration
REACT_APP_ENV=development
REACT_APP_VERSION=1.0.0
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_API_TIMEOUT=10000
REACT_APP_ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
REACT_APP_CHAIN_ID=31337
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ .env file created" -ForegroundColor Green
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "   Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not available" -ForegroundColor Red
    exit 1
}

Write-Host "`n📦 Installing dependencies..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Install root dependencies
Write-Host "Installing root dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install root dependencies" -ForegroundColor Red
    exit 1
}

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location "backend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ".."

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location "frontend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ".."

# Install contracts dependencies
Write-Host "Installing contracts dependencies..." -ForegroundColor Yellow
Set-Location "contracts"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install contracts dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ".."

Write-Host "`n🔧 Starting Services..." -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

# Start Hardhat node
Write-Host "`n1️⃣ Starting Hardhat Blockchain Node..." -ForegroundColor Magenta
$hardhatProcess = Start-ServiceWindow -ServiceName "Hardhat Node" -Command "npx hardhat node" -WorkingDirectory "$(Get-Location)\contracts"

if (-not $hardhatProcess) {
    Write-Host "❌ Failed to start Hardhat node" -ForegroundColor Red
    exit 1
}

# Wait for Hardhat to be ready
if (-not (Wait-ForService -ServiceName "Hardhat Node" -Port 8545 -TimeoutSeconds 30)) {
    Write-Host "❌ Hardhat node failed to start" -ForegroundColor Red
    exit 1
}

# Start Backend
Write-Host "`n2️⃣ Starting Backend Server..." -ForegroundColor Magenta
$backendProcess = Start-ServiceWindow -ServiceName "Backend Server" -Command "npm run dev" -WorkingDirectory "$(Get-Location)\backend"

if (-not $backendProcess) {
    Write-Host "❌ Failed to start backend server" -ForegroundColor Red
    exit 1
}

# Wait for Backend to be ready
if (-not (Wait-ForService -ServiceName "Backend Server" -Port 3000 -TimeoutSeconds 30)) {
    Write-Host "❌ Backend server failed to start" -ForegroundColor Red
    exit 1
}

# Start Frontend
Write-Host "`n3️⃣ Starting Frontend Application..." -ForegroundColor Magenta
$frontendProcess = Start-ServiceWindow -ServiceName "Frontend Application" -Command "npm start" -WorkingDirectory "$(Get-Location)\frontend"

if (-not $frontendProcess) {
    Write-Host "❌ Failed to start frontend application" -ForegroundColor Red
    exit 1
}

# Wait for Frontend to be ready
if (-not (Wait-ForService -ServiceName "Frontend Application" -Port 3001 -TimeoutSeconds 60)) {
    Write-Host "❌ Frontend application failed to start" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 All Services Started Successfully!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Web Interface: http://localhost:3001" -ForegroundColor Cyan
Write-Host "🔗 Backend API: http://localhost:3000" -ForegroundColor Cyan
Write-Host "⛓️  Blockchain: http://localhost:8545" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Service Status:" -ForegroundColor Yellow
Write-Host "  ✅ Hardhat Node (PID: $($hardhatProcess.Id))" -ForegroundColor Green
Write-Host "  ✅ Backend Server (PID: $($backendProcess.Id))" -ForegroundColor Green
Write-Host "  ✅ Frontend App (PID: $($frontendProcess.Id))" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "  • Open http://localhost:3001 in your browser" -ForegroundColor White
Write-Host "  • Connect MetaMask to localhost:8545" -ForegroundColor White
Write-Host "  • Use Chain ID: 31337" -ForegroundColor White
Write-Host "  • Press Ctrl+C to stop all services" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop all services, close this window or press Ctrl+C" -ForegroundColor Red

# Keep the script running and monitor services
Write-Host "`n🔍 Monitoring services... (Press Ctrl+C to stop all)" -ForegroundColor Yellow

try {
    while ($true) {
        Start-Sleep -Seconds 10
        
        # Check if services are still running
        $hardhatRunning = $hardhatProcess -and !$hardhatProcess.HasExited
        $backendRunning = $backendProcess -and !$backendProcess.HasExited
        $frontendRunning = $frontendProcess -and !$frontendProcess.HasExited
        
        if (-not $hardhatRunning) {
            Write-Host "⚠️  Hardhat node has stopped" -ForegroundColor Yellow
        }
        if (-not $backendRunning) {
            Write-Host "⚠️  Backend server has stopped" -ForegroundColor Yellow
        }
        if (-not $frontendRunning) {
            Write-Host "⚠️  Frontend application has stopped" -ForegroundColor Yellow
        }
        
        if (-not ($hardhatRunning -or $backendRunning -or $frontendRunning)) {
            Write-Host "❌ All services have stopped" -ForegroundColor Red
            break
        }
    }
} catch {
    Write-Host "`n🛑 Stopping all services..." -ForegroundColor Yellow
} finally {
    # Cleanup
    if ($hardhatProcess -and !$hardhatProcess.HasExited) {
        Write-Host "Stopping Hardhat node..." -ForegroundColor Yellow
        $hardhatProcess.Kill()
    }
    if ($backendProcess -and !$backendProcess.HasExited) {
        Write-Host "Stopping Backend server..." -ForegroundColor Yellow
        $backendProcess.Kill()
    }
    if ($frontendProcess -and !$frontendProcess.HasExited) {
        Write-Host "Stopping Frontend application..." -ForegroundColor Yellow
        $frontendProcess.Kill()
    }
    
    Write-Host "`n✅ All services stopped. Goodbye!" -ForegroundColor Green
}
