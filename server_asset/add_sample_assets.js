require('dotenv').config();
const con = require('./db');

const sampleAssets = [
  // Macbook category (assuming category_id = 1)
  { category_id: 1, asset_code: 'Mac-1', asset_name: 'Macbook Pro M1', status: 'available' },
  { category_id: 1, asset_code: 'Mac-2', asset_name: 'Macbook Pro', status: 'pending' },
  { category_id: 1, asset_code: 'Mac-3', asset_name: 'Macbook Pro', status: 'disable' },
  { category_id: 1, asset_code: 'Mac-4', asset_name: 'Macbook Air M2', status: 'available' },
  
  // iPad category (assuming category_id = 2)
  { category_id: 2, asset_code: 'iPad-1', asset_name: 'iPad Pro 12.9', status: 'available' },
  { category_id: 2, asset_code: 'iPad-2', asset_name: 'iPad Air', status: 'available' },
  { category_id: 2, asset_code: 'iPad-3', asset_name: 'iPad Mini', status: 'available' },
  
  // PlayStation category (assuming category_id = 3)
  { category_id: 3, asset_code: 'PS-1', asset_name: 'PlayStation 5', status: 'available' },
  { category_id: 3, asset_code: 'PS-2', asset_name: 'PlayStation 5 Digital', status: 'available' },
  { category_id: 3, asset_code: 'PS-3', asset_name: 'PlayStation 4 Pro', status: 'available' },
  
  // VR category (assuming category_id = 4)
  { category_id: 4, asset_code: 'VR-1', asset_name: 'Meta Quest 3', status: 'available' },
  { category_id: 4, asset_code: 'VR-2', asset_name: 'PlayStation VR2', status: 'available' },
  { category_id: 4, asset_code: 'VR-3', asset_name: 'HTC Vive Pro', status: 'available' }
];

// First, let's check existing categories
const checkCategoriesSql = "SELECT category_id, name FROM category ORDER BY category_id";

con.query(checkCategoriesSql, (err, categories) => {
  if (err) {
    console.error('❌ Error fetching categories:', err);
    process.exit(1);
  }

  console.log('\n📋 Current categories:');
  categories.forEach(cat => {
    console.log(`   ID ${cat.category_id}: ${cat.name}`);
  });

  // Check if assets already exist
  const checkAssetsSql = "SELECT COUNT(*) as count FROM asset";
  con.query(checkAssetsSql, (err, result) => {
    if (err) {
      console.error('❌ Error checking assets:', err);
      process.exit(1);
    }

    const existingCount = result[0].count;
    console.log(`\n📦 Existing assets in database: ${existingCount}`);

    if (existingCount > 0) {
      console.log('\n⚠️  Assets already exist. Do you want to:');
      console.log('   1. Keep existing and add new ones');
      console.log('   2. Clear all and insert fresh data');
      console.log('\n💡 To clear and insert fresh data, run:');
      console.log('   DELETE FROM asset; (in your database)');
      console.log('   Then run this script again.\n');
      
      // Insert anyway (will add to existing)
      insertAssets();
    } else {
      insertAssets();
    }
  });
});

function insertAssets() {
  console.log('\n🚀 Inserting sample assets...\n');

  let completed = 0;
  let errors = 0;

  sampleAssets.forEach((asset, index) => {
    const sql = `
      INSERT INTO asset (category_id, asset_code, asset_name, status)
      VALUES (?, ?, ?, ?)
    `;
    
    con.query(sql, [asset.category_id, asset.asset_code, asset.asset_name, asset.status], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Skipped ${asset.asset_code}: Already exists`);
        } else {
          console.error(`❌ Error inserting ${asset.asset_code}:`, err.message);
          errors++;
        }
      } else {
        console.log(`✅ Added ${asset.asset_code}: ${asset.asset_name} (${asset.status})`);
      }
      
      completed++;
      
      if (completed === sampleAssets.length) {
        console.log('\n' + '='.repeat(50));
        console.log(`✅ Completed! Added ${completed - errors} assets`);
        if (errors > 0) {
          console.log(`⚠️  ${errors} errors occurred`);
        }
        console.log('='.repeat(50) + '\n');
        
        // Show final count
        con.query("SELECT COUNT(*) as total FROM asset", (err, result) => {
          if (!err) {
            console.log(`📦 Total assets in database: ${result[0].total}\n`);
          }
          process.exit(0);
        });
      }
    });
  });
}
