// Script to add test user to database
const argon2 = require('@node-rs/argon2');
const con = require('./db');

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

// Hash the password
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
      console.log('❌ User already exists with this email or username');
    } else {
      console.error('❌ Database error:', err.message);
    }
    con.end();
    process.exit(1);
  }

  console.log('✅ Test user added successfully!');
  console.log('📧 Email:', testUser.email);
  console.log('👤 Username:', testUser.username);
  console.log('🔑 Password:', testUser.password);
  console.log('🆔 User ID:', result.insertId);
  console.log('👥 Role:', testUser.role);

  con.end();
  process.exit(0);
});
