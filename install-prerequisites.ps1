# PowerShell script to install prerequisites for Blockchain project
Write-Host "Installing prerequisites for Blockchain project..." -ForegroundColor Green

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Please run this script as Administrator" -ForegroundColor Red
    exit 1
}

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Install Chocolatey if not installed
if (-not (Test-Command -cmdname 'choco')) {
    Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
}

# Install Node.js if not installed
if (-not (Test-Command -cmdname 'node')) {
    Write-Host "Installing Node.js..." -ForegroundColor Yellow
    choco install nodejs-lts -y
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine")
}

# Install Git if not installed
if (-not (Test-Command -cmdname 'git')) {
    Write-Host "Installing Git..." -ForegroundColor Yellow
    choco install git -y
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine")
}

# Install Visual Studio Code if not installed
if (-not (Test-Command -cmdname 'code')) {
    Write-Host "Installing Visual Studio Code..." -ForegroundColor Yellow
    choco install vscode -y
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine")
}

# Install VS Code extensions
Write-Host "Installing VS Code extensions..." -ForegroundColor Yellow
code --install-extension JuanBlanco.solidity
code --install-extension ms-vscode.vscode-node-azure-pack
code --install-extension ms-azuretools.vscode-docker
code --install-extension eamodio.gitlens

# Install global npm packages
Write-Host "Installing global npm packages..." -ForegroundColor Yellow
npm install -g hardhat-cli typescript ts-node

# Create project directories if they don't exist
$directories = @("contracts", "backend", "frontend")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir
    }
}

# Install project dependencies
Write-Host "Installing project dependencies..." -ForegroundColor Yellow

# Root directory
npm install

# Contracts directory
Set-Location contracts
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-ethers ethers
npm install --save-dev @nomiclabs/hardhat-ethers @nomiclabs/hardhat-waffle ethereum-waffle chai
npm install @openzeppelin/contracts

# Backend directory
Set-Location ../backend
npm install

# Frontend directory
Set-Location ../frontend
npm install

# Return to root
Set-Location ..

# Copy environment files
Write-Host "Setting up environment files..." -ForegroundColor Yellow
if (Test-Path "docker.env") {
    Copy-Item "docker.env" "backend\.env" -Force
    Copy-Item "docker.env" "contracts\.env" -Force
    Copy-Item "docker.env" "frontend\.env" -Force
}

# Verify installations
Write-Host "Verifying installations..." -ForegroundColor Yellow
$tools = @{
    "Node.js" = "node --version"
    "npm" = "npm --version"
    "Git" = "git --version"
    "Hardhat" = "npx hardhat --version"
}

foreach ($tool in $tools.GetEnumerator()) {
    Write-Host "Checking $($tool.Key)..." -ForegroundColor Yellow
    try {
        Invoke-Expression $tool.Value
    }
    catch {
        Write-Host "Warning: $($tool.Key) verification failed" -ForegroundColor Red
    }
}

Write-Host "`nInstallation complete!" -ForegroundColor Green
Write-Host "Please check the output above for any errors and refer to PREREQUISITES.md for troubleshooting." -ForegroundColor Yellow