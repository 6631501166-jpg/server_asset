// require('dotenv').config();
// const mysql = require("mysql2");

// const con = mysql.createConnection({
//     host: process.env.DB_HOST || 'localhost',
//     user: process.env.DB_USER || 'root',
//     password: process.env.DB_PASSWORD || '',
//     database: process.env.DB_NAME || 'assets'
// });

// module.exports = con;



// db.js - SQLite Version
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "asset_management.db");
const SCHEMA_FILE = path.join(__dirname, "schema.sql");

// Create database if not exists
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error("❌ Cannot open SQLite DB:", err);
    return;
  }
  console.log("📦 SQLite DB loaded:", DB_FILE);

  // Enable foreign keys
  db.run("PRAGMA foreign_keys = ON;");

  // Load schema.sql only if DB is empty
  db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='users'`, (err, row) => {
    if (!row) {
      console.log("📌 Importing schema.sql...");
      const schema = fs.readFileSync(SCHEMA_FILE, "utf8");
      db.exec(schema, (err2) => {
        if (err2) console.error("❌ Schema import error:", err2);
        else console.log("✅ Schema imported successfully!");
      });
    }
  });
});

module.exports = db;

