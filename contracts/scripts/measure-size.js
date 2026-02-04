const hre = require('hardhat');

async function main() {
  await hre.run('compile');
  const Token = await hre.artifacts.readArtifact('Token');
  const deployed = Token.deployedBytecode;
  const bytes = deployed.length / 2;
  console.log('Token deployed bytecode size (bytes):', bytes);
}

main().catch((e) => { console.error(e); process.exit(1); });
