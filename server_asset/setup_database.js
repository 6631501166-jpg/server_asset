// Script to setup database and add test user
const mysql = require("mysql2");
const argon2 = require('@node-rs/argon2');

// First connection without database to create it
const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
});

console.log('🔧 Setting up database...\n');

// Create database
con.query('CREATE DATABASE IF NOT EXISTS asset_management', (err) => {
  if (err) {
    console.error('❌ Error creating database:', err.message);
    con.end();
    process.exit(1);
  }

  console.log('✅ Database "asset_management" created/verified');

  // Use the database
  con.query('USE asset_management', (err) => {
    if (err) {
      console.error('❌ Error selecting database:', err.message);
      con.end();
      process.exit(1);
    }

    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        uid INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100),
        ph_num VARCHAR(20),
        username VARCHAR(100) UNIQUE NOT NULL,
        profile_img VARCHAR(255) DEFAULT 'default.png',
        role ENUM('student', 'admin', 'staff') DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    con.query(createUsersTable, (err) => {
      if (err) {
        console.error('❌ Error creating users table:', err.message);
        con.end();
        process.exit(1);
      }

      console.log('✅ Users table created/verified\n');

      // Add test user
      const testUser = {
        email: 'user@gmail.com',
        password: 'user123',
        first_name: 'Test',
        last_name: 'User',
        ph_num: null,
        username: 'user',
        profile_img: 'default.png',
        role: 'student'
      };

      const hashedPassword = argon2.hashSync(testUser.password);

      const sql = `
        INSERT INTO users(email, password, first_name, last_name, ph_num, username, profile_img, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      con.query(sql, [
        testUser.email,
        hashedPassword,
        testUser.first_name,
        testUser.last_name,
        testUser.ph_num,
        testUser.username,
        testUser.profile_img,
        testUser.role
      ], (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            console.log('⚠️  User already exists with this email or username\n');
            
            // Show existing user
            con.query('SELECT uid, email, username, first_name, last_name, role FROM users WHERE email = ?', 
              [testUser.email], 
              (err, users) => {
                if (!err && users.length > 0) {
                  console.log('📋 Existing user details:');
                  console.log('   🆔 User ID:', users[0].uid);
                  console.log('   📧 Email:', users[0].email);
                  console.log('   👤 Username:', users[0].username);
                  console.log('   👥 Role:', users[0].role);
                }
                con.end();
                process.exit(0);
              }
            );
          } else {
            console.error('❌ Database error:', err.message);
            con.end();
            process.exit(1);
          }
        } else {
          console.log('✅ Test user added successfully!\n');
          console.log('📋 Login credentials:');
          console.log('   📧 Email:', testUser.email);
          console.log('   👤 Username:', testUser.username);
          console.log('   🔑 Password:', testUser.password);
          console.log('   🆔 User ID:', result.insertId);
          console.log('   👥 Role:', testUser.role);
          
          con.end();
          process.exit(0);
        }
      });
    });
  });
});
