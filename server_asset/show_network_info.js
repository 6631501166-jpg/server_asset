// Script to display server network information
require('dotenv').config();
const os = require('os');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;

console.log('\n🌐 Server Network Configuration\n');
console.log('═'.repeat(50));
console.log(`📋 Configuration from .env file:`);
console.log(`   HOST: ${HOST}`);
console.log(`   PORT: ${PORT}`);
console.log('═'.repeat(50));

// Get network interfaces
const interfaces = os.networkInterfaces();
const addresses = [];

for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    // Skip internal and non-IPv4 addresses
    if (iface.family === 'IPv4' && !iface.internal) {
      addresses.push({
        name: name,
        address: iface.address
      });
    }
  }
}

console.log('\n📡 Your Server will be accessible at:\n');
console.log('   Local Access:');
console.log(`   • http://localhost:${PORT}`);
console.log(`   • http://127.0.0.1:${PORT}`);

if (addresses.length > 0) {
  console.log('\n   Network Access:');
  addresses.forEach(addr => {
    console.log(`   • http://${addr.address}:${PORT} (${addr.name})`);
  });
}

console.log('\n📱 For Flutter App Configuration:\n');
console.log('   iOS Simulator:');
console.log(`   • http://localhost:${PORT}/api`);
console.log(`   • http://127.0.0.1:${PORT}/api`);

console.log('\n   Android Emulator:');
console.log(`   • http://10.0.2.2:${PORT}/api`);

if (addresses.length > 0) {
  console.log('\n   Physical Device (same WiFi):');
  addresses.forEach(addr => {
    console.log(`   • http://${addr.address}:${PORT}/api`);
  });
}

console.log('\n' + '═'.repeat(50) + '\n');
