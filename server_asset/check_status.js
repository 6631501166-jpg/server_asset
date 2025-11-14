require('dotenv').config();
const con = require('./db');

con.query('SHOW COLUMNS FROM asset WHERE Field = "status"', (err, result) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
  process.exit(0);
});
