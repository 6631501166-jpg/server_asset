require('dotenv').config();
const con = require('./db');

con.query(
  'INSERT INTO asset (category_id, asset_code, asset_name, status) VALUES (1, ?, ?, ?)',
  ['Mac-3', 'Macbook Pro', 'maintenance'],
  (err) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('✅ Added Mac-3: Macbook Pro (maintenance)');
    }
    process.exit(0);
  }
);
