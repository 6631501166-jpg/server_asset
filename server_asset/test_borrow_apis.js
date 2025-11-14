require('dotenv').config();
const con = require('./db');

console.log('\n📋 Testing Borrowing Request APIs\n');
console.log('='.repeat(60));

// Test user (from earlier setup)
const testUserId = 9; // user@gmail.com

// Step 1: Create a test borrow request
console.log('\n1️⃣  Creating a test borrow request...');

const today = new Date().toISOString().split('T')[0];
const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const createBorrowSql = `
  INSERT INTO borrowing(borrower_id, asset_id, status, borrow_date, return_date)
  VALUES (?, ?, 'pending', ?, ?)
`;

con.query(createBorrowSql, [testUserId, 7, today, nextWeek], (err, result) => {
  if (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log('   ⚠️  Borrow request already exists, continuing with existing data...');
    } else {
      console.error('   ❌ Error:', err.message);
    }
  } else {
    console.log(`   ✅ Created borrowing request ID: ${result.insertId}`);
    console.log(`   📅 Borrow Date: ${today}`);
    console.log(`   📅 Return Date: ${nextWeek}`);
  }

  // Step 2: Test the APIs
  setTimeout(() => {
    console.log('\n' + '='.repeat(60));
    console.log('\n2️⃣  Testing API: GET /api/student/requests/:uid');
    console.log('   Endpoint: /api/student/requests/9\n');

    const requestsSql = `
      SELECT b.borrowing_id, b.status, b.borrow_date, b.return_date,
             a.asset_id, a.asset_code, a.asset_name,
             c.name AS category_name, c.image AS category_image
      FROM borrowing b
      JOIN asset a ON b.asset_id = a.asset_id
      JOIN category c ON a.category_id = c.category_id
      WHERE b.borrower_id = ? AND b.status IN ('pending', 'approved')
      ORDER BY b.borrow_date DESC
    `;

    con.query(requestsSql, [testUserId], (err, requests) => {
      if (err) {
        console.error('   ❌ Error:', err);
        return;
      }

      console.log(`   📦 Found ${requests.length} pending/approved request(s):\n`);
      
      requests.forEach((req, index) => {
        console.log(`   Request #${index + 1}:`);
        console.log(`   ├─ Borrowing ID: ${req.borrowing_id}`);
        console.log(`   ├─ Asset: ${req.asset_name} (${req.asset_code})`);
        console.log(`   ├─ Category: ${req.category_name}`);
        console.log(`   ├─ Category Image: ${req.category_image}`);
        console.log(`   ├─ Status: ${req.status}`);
        console.log(`   ├─ Borrow Date: ${req.borrow_date}`);
        console.log(`   └─ Return Date: ${req.return_date || 'Not specified'}\n`);
      });

      // Step 3: Test history API
      console.log('='.repeat(60));
      console.log('\n3️⃣  Testing API: GET /api/student/history/:uid');
      console.log('   Endpoint: /api/student/history/9\n');

      const historySql = `
        SELECT b.borrowing_id, b.status, b.borrow_date, b.return_date, b.returned_at,
               a.asset_id, a.asset_code, a.asset_name,
               c.name AS category_name, c.image AS category_image,
               u.first_name AS approver_first_name, u.last_name AS approver_last_name
        FROM borrowing b
        JOIN asset a ON b.asset_id = a.asset_id
        JOIN category c ON a.category_id = c.category_id
        LEFT JOIN users u ON b.approver_id = u.uid
        WHERE b.borrower_id = ?
        ORDER BY b.borrow_date DESC, b.borrowing_id DESC
      `;

      con.query(historySql, [testUserId], (err, history) => {
        if (err) {
          console.error('   ❌ Error:', err);
          process.exit(1);
        }

        console.log(`   📚 Found ${history.length} total borrowing record(s):\n`);
        
        history.forEach((item, index) => {
          console.log(`   History #${index + 1}:`);
          console.log(`   ├─ Borrowing ID: ${item.borrowing_id}`);
          console.log(`   ├─ Asset: ${item.asset_name} (${item.asset_code})`);
          console.log(`   ├─ Category: ${item.category_name}`);
          console.log(`   ├─ Category Image: ${item.category_image}`);
          console.log(`   ├─ Status: ${item.status}`);
          console.log(`   ├─ Borrow Date: ${item.borrow_date}`);
          console.log(`   ├─ Return Date: ${item.return_date || 'Not specified'}`);
          console.log(`   ├─ Returned At: ${item.returned_at || 'Not returned yet'}`);
          console.log(`   └─ Approver: ${item.approver_first_name || 'Pending approval'}\n`);
        });

        console.log('='.repeat(60));
        console.log('\n✅ API Testing Complete!\n');
        console.log('📡 Available Endpoints:');
        console.log('   GET  /api/student/requests/:uid     - Get pending/approved requests');
        console.log('   GET  /api/student/history/:uid      - Get all borrowing history');
        console.log('   PUT  /api/student/cancel/:borrowingId - Cancel a pending request\n');
        
        process.exit(0);
      });
    });
  }, 500);
});
