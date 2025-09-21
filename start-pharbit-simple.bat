@echo off
echo.
echo ===============================================
echo   Pharbit Blockchain - Simple Startup
echo ===============================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo Error: Please run this script from the project root directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    (
        echo NODE_ENV=development
        echo PORT=3000
        echo HOST=localhost
        echo ETHEREUM_RPC_URL=http://localhost:8545
        echo REACT_APP_API_URL=http://localhost:3000/api
        echo REACT_APP_ETHEREUM_RPC_URL=http://localhost:8545
        echo REACT_APP_CHAIN_ID=31337
    ) > .env
    echo .env file created
)

REM Copy .env to backend directory
if exist ".env" (
    copy ".env" "backend\.env" >nul 2>&1
    echo .env copied to backend directory
)

echo.
echo Starting all services...
echo This will start:
echo   • Hardhat blockchain node (port 8545)
echo   • Backend API server (port 3000)
echo   • Frontend React app (port 3001)
echo.
echo Press Ctrl+C to stop all services
echo.

REM Start all services using npm run dev
npm run dev

echo.
echo All services have stopped.
pause
