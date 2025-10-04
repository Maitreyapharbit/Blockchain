Run the Pharbit Blockchain project on Windows and macOS

This document explains quick steps to run the repository on Windows (cmd or PowerShell) and macOS (bash/zsh). It uses the repository's top-level `start-pharbit.js` script which coordinates starting Hardhat, backend, and frontend.

Prerequisites (both platforms)
- Node.js (v18+ recommended) installed and on PATH: https://nodejs.org/
- npm
- git (if cloning the repo)

Windows (PowerShell)
1. Open PowerShell and navigate to the project root (folder containing `package.json`).
2. Install dependencies (only needed first time):

```powershell
npm install
```

3. Run the startup script:

```powershell
.\start-all.ps1
```

This will install dependencies if missing and then run `node start-pharbit.js` which starts Hardhat, backend and frontend.

Windows (cmd)
1. Open Command Prompt, cd to project root.
2. Install dependencies and run:

```cmd
npm install
start-all.bat
```

macOS (bash/zsh)
1. Open Terminal and cd to project root.
2. Install dependencies and run the node script:

```bash
npm install
node start-pharbit.js
```

Notes and troubleshooting
- If ports 3000/3001/8545 are already in use, stop the processes that are using them or change ports in `.env`.
- If `node start-pharbit.js` falls back to sequential startup it will show messages in the console; use Ctrl+C to stop all child processes.
- For Codespaces or other preview/proxy environments, you may need to set `REACT_APP_WS_URL` and `REACT_APP_API_URL` in `.env` for the correct preview host; otherwise the frontend will attempt to derive the host from `window.location`.

If you prefer, I can also add ready-to-use `.vscode/tasks.json` launch tasks or platform-specific docker-compose profiles to make running even easier. Let me know which you prefer.