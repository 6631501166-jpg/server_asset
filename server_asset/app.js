// ============================================
// app.js (SQLite Version) – READY TO USE
// ============================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');          // ต้องประกาศก่อนใช้
const argon2 = require('@node-rs/argon2');
const multer = require('multer');
const path = require('path');
const db = require('./db');
const os = require('os');

// ✅ สร้าง app ก่อน แล้วค่อยใช้ middleware
const app = express();

app.use(cors());                       // ใช้หลังประกาศ app
app.use(express.json());               // JSON middleware


app.use('/images', express.static(path.join(__dirname, 'public/images')));

// ===================== FILE UPLOAD =====================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = file.fieldname === 'category_image'
      ? 'public/images/categories'
      : 'public/images/assets';
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + '-' + Date.now() + path.extname(file.originalname)
    );
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ===================== NETWORK BASE URL =====================
function getServerBaseURL() {
  const PORT = process.env.PORT || 3000;
  const interfaces = os.networkInterfaces();

  for (const iface of Object.values(interfaces).flat()) {
    if (iface.family === 'IPv4' && !iface.internal) {
      return `http://${iface.address}:${PORT}`;
    }
  }
  return `http://localhost:${PORT}`;
}

// ============================================================
//                    STUDENT API ZONE
// ============================================================

// GET ALL AVAILABLE ASSETS
app.get("/api/student/assets", (req, res) => {
  const sql = `
    SELECT a.*, c.name AS category_name, c.image AS category_image
    FROM asset a
    JOIN category c ON a.category_id = c.category_id
    WHERE a.status = 'available' AND c.is_active = 1
    ORDER BY c.name, a.asset_name
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).send("DB Error");

    const baseURL = getServerBaseURL();
    const result = rows.map(a => ({
      ...a,
      category_image_url: `${baseURL}/images/categories/${a.category_image}`
    }));

    res.json(result);
  });
});

// GET ASSETS BY CATEGORY
app.get("/api/student/assets/category/:categoryId", (req, res) => {
  const sql = `
    SELECT a.*, c.name AS category_name, c.image AS category_image
    FROM asset a
    JOIN category c ON a.category_id = c.category_id
    WHERE a.category_id = ? AND a.status = 'available'
  `;

  db.all(sql, [req.params.categoryId], (err, rows) => {
    if (err) return res.status(500).send("DB Error");

    const baseURL = getServerBaseURL();
    const result = rows.map(a => ({
      ...a,
      category_image_url: `${baseURL}/images/categories/${a.category_image}`
    }));

    res.json(result);
  });
});

// GET ALL ACTIVE CATEGORIES
app.get("/api/student/categories", (req, res) => {
  db.all(
    "SELECT * FROM category WHERE is_active = 1 ORDER BY name",
    [],
    (err, rows) => {
      if (err) return res.status(500).send("DB Error");

      const baseURL = getServerBaseURL();
      const result = rows.map(c => ({
        ...c,
        imageUrl: `${baseURL}/images/categories/${c.image}`
      }));
      res.json(result);
    }
  );
});

// REQUEST TO BORROW
app.post("/api/student/borrow", (req, res) => {
  const { borrower_id, asset_id, borrow_date, return_date } = req.body;

  if (!borrower_id || !asset_id || !borrow_date)
    return res.status(400).send("Missing required fields");

  db.get(
    "SELECT status FROM asset WHERE asset_id = ?",
    [asset_id],
    (err, asset) => {
      if (err) return res.status(500).send("DB Error");
      if (!asset) return res.status(404).send("Asset not found");
      if (asset.status !== "available")
        return res.status(400).send("Asset not available");

      const sql = `
        INSERT INTO borrowing (borrower_id, asset_id, status, borrow_date, return_date)
        VALUES (?, ?, 'pending', ?, ?)
      `;

      db.run(sql, [borrower_id, asset_id, borrow_date, return_date || null], function (err2) {
        if (err2) return res.status(500).send("DB Error");

        db.run(
          "UPDATE asset SET status = 'pending' WHERE asset_id = ?",
          [asset_id],
          () => {
            res.json({ message: "Borrow request submitted", borrowing_id: this.lastID });
          }
        );
      });
    }
  );
});

// STUDENT HISTORY
app.get("/api/student/history/:uid", (req, res) => {
  const sql = `
    SELECT b.*, a.asset_code, a.asset_name, c.name AS category_name, c.image AS category_image
    FROM borrowing b
    JOIN asset a ON b.asset_id = a.asset_id
    JOIN category c ON a.category_id = c.category_id
    WHERE borrower_id = ?
    ORDER BY b.borrow_date DESC
  `;

  db.all(sql, [req.params.uid], (err, rows) => {
    if (err) return res.status(500).send("DB Error");

    const baseURL = getServerBaseURL();
    const history = rows.map(i => ({
      ...i,
      category_image_url: `${baseURL}/images/categories/${i.category_image}`
    }));

    res.json(history);
  });
});

// GET PENDING / APPROVED REQUESTS
app.get("/api/student/requests/:uid", (req, res) => {
  const sql = `
    SELECT b.*, a.asset_name, a.asset_code, c.name AS category_name, c.image AS category_image
    FROM borrowing b
    JOIN asset a ON b.asset_id = a.asset_id
    JOIN category c ON a.category_id = c.category_id
    WHERE borrower_id = ? AND b.status IN ('pending','approved')
  `;

  db.all(sql, [req.params.uid], (err, rows) => {
    if (err) return res.status(500).send("DB Error");

    const baseURL = getServerBaseURL();
    res.json(
      rows.map(i => ({
        ...i,
        category_image_url: `${baseURL}/images/categories/${i.category_image}`
      }))
    );
  });
});

// CANCEL REQUEST
app.put("/api/student/cancel/:id", (req, res) => {
  const borrowingId = req.params.id;

  db.get(
    "SELECT asset_id, status FROM borrowing WHERE borrowing_id = ?",
    [borrowingId],
    (err, row) => {
      if (!row) return res.status(404).send("Not found");
      if (row.status !== "pending")
        return res.status(400).send("Only pending can be cancelled");

      db.run("UPDATE borrowing SET status='cancelled' WHERE borrowing_id = ?", [borrowingId]);

      // restore asset
      db.run("UPDATE asset SET status='available' WHERE asset_id=?", [row.asset_id]);

      res.json({ message: "Cancelled" });
    }
  );
});

// ============================================================
//                    COMMON APIS
// ============================================================

// UPLOAD CATEGORY IMAGE
app.post('/api/upload/category', upload.single('category_image'), (req, res) => {
  const base = getServerBaseURL();
  res.json({
    message: 'uploaded',
    filename: req.file.filename,
    imageUrl: `${base}/images/categories/${req.file.filename}`
  });
});

// UPLOAD ASSET IMAGE
app.post('/api/upload/asset', upload.single('asset_image'), (req, res) => {
  const base = getServerBaseURL();
  res.json({
    message: 'uploaded',
    filename: req.file.filename,
    imageUrl: `${base}/images/assets/${req.file.filename}`
  });
});

// LOGIN (BEST VERSION)
app.post("/api/login", (req, res) => {
  const { email, username, uid, identifier, password } = req.body;

  // เลือกค่าที่ส่งมาจริง
  const loginValue = email || username || uid || identifier;
  if (!loginValue || !password) {
    return res.status(400).send("Missing login or password");
  }

  let sql = "";
  let params = [];

  // ตรวจว่าที่ส่งมาเป็น email หรือไม่
  if (email || (identifier && identifier.includes("@"))) {
    sql = "SELECT * FROM users WHERE email = ?";
    params = [loginValue];
  }
  // ถ้าเป็นตัวเลข → uid
  else if (/^\d+$/.test(loginValue)) {
    sql = "SELECT * FROM users WHERE uid = ?";
    params = [parseInt(loginValue)];
  }
  // อย่างอื่นคือ username
  else {
    sql = "SELECT * FROM users WHERE username = ?";
    params = [loginValue];
  }

  // Query user
  db.get(sql, params, (err, user) => {
    if (!user) return res.status(401).send("Invalid credentials");

    const passwordMatch = argon2.verifySync(user.password, password);
    if (!passwordMatch) return res.status(401).send("Wrong password");

    res.json({
      uid: user.uid,
      username: user.username,
      role: user.role,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name
    });
  });
});


// REGISTER
app.post("/api/register", (req, res) => {
  const { email, password, first_name, last_name, ph_num, username } = req.body;
  if (!email || !password || !first_name || !username)
    return res.status(400).send("Missing fields");

  const hash = argon2.hashSync(password);

  const sql = `
    INSERT INTO users (email, password, first_name, last_name, ph_num, username)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [email, hash, first_name, last_name, ph_num, username], function (err) {
    if (err) return res.status(500).send("DB Error");
    res.json({ message: "Registered", uid: this.lastID });
  });
});

// ============================================================
//                    START SERVER
// ============================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  const url = getServerBaseURL();
  console.log(`🚀 Server running at ${url}`);
  console.log(`API Base URL for Flutter: ${url}/api`);
});
