// Test login endpoint
const http = require('http');

// Test with username (you can change this to test email or uid)
const testData = {
  identifier: 'user',  // Can be: 'user' (username), 'user@gmail.com' (email), or '9' (uid)
  password: 'user123'
};

const data = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🧪 Testing login endpoint...');
console.log(`📝 Login with: ${testData.identifier}\n`);

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Status Message: ${res.statusMessage}\n`);

  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Response:');
    try {
      const parsed = JSON.parse(responseData);
      console.log(JSON.stringify(parsed, null, 2));
      console.log('\n✅ Login successful!');
      console.log(`User ID: ${parsed.uid}`);
      console.log(`Username: ${parsed.username}`);
      console.log(`Role: ${parsed.role}`);
      console.log(`Name: ${parsed.first_name} ${parsed.last_name}`);
    } catch (e) {
      console.log(responseData);
      if (res.statusCode !== 200) {
        console.log('\n❌ Login failed!');
      }
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Make sure the server is running: node app.js');
});

req.write(data);
req.end();
