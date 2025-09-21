@echo off
echo.
echo ===============================================
echo   Pharbit Blockchain - Quick Start Script
echo ===============================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo Error: Please run this script from the project root directory
    echo Current directory: %CD%
    echo Expected: Directory containing package.json
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Starting Pharbit Blockchain Application...
echo.

REM Start all services using npm run dev
echo Starting all services...
npm run dev

echo.
echo All services have stopped.
pause
