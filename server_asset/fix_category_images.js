// Fix category image paths in database
const mysql = require("mysql2");

const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'asset_management'
});

console.log('🔧 Fixing category image paths...\n');

const updates = [
  { id: 1, image: 'macbook.png' },
  { id: 2, image: 'ipad.png' },
  { id: 3, image: 'playstation.png' },
  { id: 4, image: 'vr.png' }
];

let completed = 0;

updates.forEach(update => {
  con.query(
    'UPDATE category SET image = ? WHERE category_id = ?',
    [update.image, update.id],
    (err, result) => {
      if (err) {
        console.error(`❌ Error updating ${update.image}:`, err.message);
      } else {
        console.log(`✅ Updated category ${update.id}: ${update.image}`);
      }
      
      completed++;
      if (completed === updates.length) {
        // Show results
        con.query('SELECT category_id, name, image FROM category', (err, categories) => {
          if (!err) {
            console.log('\n📊 Updated Categories:');
            console.table(categories);
          }
          con.end();
        });
      }
    }
  );
});
