#!/usr/bin/env node

const http = require('http');

console.log('🔍 Testing port configuration...\n');

// Test function
function testPort(port, service) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      console.log(`✅ ${service} is running on port ${port}`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${service} is NOT running on port ${port}`);
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      console.log(`⏰ ${service} timeout on port ${port}`);
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('Testing expected port configuration:');
  console.log('Frontend should be on port 3000');
  console.log('Backend should be on port 3001');
  console.log('Blockchain should be on port 8545\n');
  
  const results = await Promise.all([
    testPort(3000, 'Frontend'),
    testPort(3001, 'Backend'),
    testPort(8545, 'Blockchain')
  ]);
  
  console.log('\n📊 Results:');
  console.log(`Frontend (3000): ${results[0] ? '✅' : '❌'}`);
  console.log(`Backend (3001): ${results[1] ? '✅' : '❌'}`);
  console.log(`Blockchain (8545): ${results[2] ? '✅' : '❌'}`);
  
  if (results[0] && results[1] && results[2]) {
    console.log('\n🎉 All services are running on the correct ports!');
  } else {
    console.log('\n⚠️  Some services are not running or on wrong ports.');
    console.log('Run ./start-all.sh to start all services.');
  }
}

runTests().catch(console.error);