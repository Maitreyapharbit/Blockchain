// Auto-update .env for Codespaces preview host
const fs = require('fs');
const path = require('path');

// Try to detect Codespace host from environment
const codespaceName = process.env.CODESPACE_NAME || process.env.CODESPACES_NAME;
const port = process.env.PORT || 3000;
const apiPort = process.env.API_PORT || 3001;

if (!codespaceName) {
  console.error('Not running in a Codespace (CODESPACE_NAME not set).');
  process.exit(0);
}

const codespaceHost = `${codespaceName}-${apiPort}.app.github.dev`;
const wsUrl = `wss://${codespaceHost}/ws`;
const apiUrl = `https://${codespaceHost}/api`;

const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found at', envPath);
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8');

function setEnvVar(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  } else {
    return content + `\n${key}=${value}`;
  }
}

envContent = setEnvVar(envContent, 'REACT_APP_API_URL', apiUrl);
envContent = setEnvVar(envContent, 'REACT_APP_WS_URL', wsUrl);

fs.writeFileSync(envPath, envContent);
console.log('Updated .env for Codespace:');
console.log('REACT_APP_API_URL=' + apiUrl);
console.log('REACT_APP_WS_URL=' + wsUrl);
