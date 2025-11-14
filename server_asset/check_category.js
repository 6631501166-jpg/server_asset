// Check category table structure and data
const mysql = require("mysql2");

const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'asset_management'
});

console.log('🔍 Checking category table...\n');

// Get table structure
con.query('DESCRIBE category', (err, structure) => {
  if (err) {
    console.error('❌ Error:', err.message);
    con.end();
    return;
  }

  console.log('📋 Table Structure:');
  console.table(structure);

  // Get all data
  con.query('SELECT * FROM category', (err, data) => {
    if (err) {
      console.error('❌ Error:', err.message);
      con.end();
      return;
    }

    console.log('\n📊 Category Data:');
    console.table(data);

    con.end();
  });
});
