// อิอิอิอิอิอิอิ
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const argon2 = require('@node-rs/argon2');
const multer = require('multer');
const path = require('path');
const db = require('./db');
const os = require('os');

// ✅ สร้าง app ก่อน แล้วค่อยใช้ middleware
const app = express();

app.use(cors());          // CORS
app.use(express.json());  // JSON body

// static files
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// ===================== FILE UPLOAD =====================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath =
      file.fieldname === 'category_image'
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
  limits: { fileSize: 5 * 1024 * 1024 }
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
app.get('/api/student/assets', (req, res) => {
  const sql = `
    SELECT a.*, c.name AS category_name, c.image AS category_image
    FROM asset a
    JOIN category c ON a.category_id = c.category_id
    WHERE a.status = 'available' AND c.is_active = 1
    ORDER BY c.name, a.asset_name
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('DB Error /api/student/assets:', err);
      return res.status(500).send('DB Error');
    }

    const baseURL = getServerBaseURL();
    const result = rows.map((a) => ({
      ...a,
      category_image_url: `${baseURL}/images/categories/${a.category_image}`
    }));

    res.json(result);
  });
});

// GET ASSETS BY CATEGORY
app.get('/api/student/assets/category/:categoryId', (req, res) => {
  const sql = `
    SELECT a.*, c.name AS category_name, c.image AS category_image
    FROM asset a
    JOIN category c ON a.category_id = c.category_id
    WHERE a.category_id = ? AND a.status = 'available'
  `;

  db.all(sql, [req.params.categoryId], (err, rows) => {
    if (err) {
      console.error('DB Error /api/student/assets/category:', err);
      return res.status(500).send('DB Error');
    }

    const baseURL = getServerBaseURL();
    const result = rows.map((a) => ({
      ...a,
      category_image_url: `${baseURL}/images/categories/${a.category_image}`
    }));

    res.json(result);
  });
});

// GET ALL ACTIVE CATEGORIES
app.get('/api/student/categories', (req, res) => {
  db.all(
    'SELECT * FROM category WHERE is_active = 1 ORDER BY name',
    [],
    (err, rows) => {
      if (err) {
        console.error('DB Error /api/student/categories:', err);
        return res.status(500).send('DB Error');
      }

      const baseURL = getServerBaseURL();
      const result = rows.map((c) => ({
        ...c,
        imageUrl: `${baseURL}/images/categories/${c.image}`
      }));
      res.json(result);
    }
  );
});

// REQUEST TO BORROW
app.post('/api/student/borrow', (req, res) => {
  const { borrower_id, asset_id, borrow_date, return_date } = req.body;

  if (!borrower_id || !asset_id || !borrow_date)
    return res.status(400).send('Missing required fields');

  db.get('SELECT status FROM asset WHERE asset_id = ?', [asset_id], (err, asset) => {
    if (err) {
      console.error('DB Error /api/student/borrow (check asset):', err);
      return res.status(500).send('DB Error');
    }
    if (!asset) return res.status(404).send('Asset not found');
    if (asset.status !== 'available')
      return res.status(400).send('Asset not available');

    const sql = `
      INSERT INTO borrowing (borrower_id, asset_id, status, borrow_date, return_date)
      VALUES (?, ?, 'pending', ?, ?)
    `;

    db.run(
      sql,
      [borrower_id, asset_id, borrow_date, return_date || null],
      function (err2) {
        if (err2) {
          console.error('DB Error /api/student/borrow (insert):', err2);
          return res.status(500).send('DB Error');
        }

        db.run(
          'UPDATE asset SET status = \'pending\' WHERE asset_id = ?',
          [asset_id],
          (err3) => {
            if (err3) {
              console.error('DB Error /api/student/borrow (update asset):', err3);
              return res.status(500).send('DB Error');
            }
            res.json({
              message: 'Borrow request submitted',
              borrowing_id: this.lastID
            });
          }
        );
      }
    );
  });
});

// STUDENT HISTORY
app.get('/api/student/history/:uid', (req, res) => {
  const sql = `
    SELECT b.*, a.asset_code, a.asset_name, c.name AS category_name, c.image AS category_image
    FROM borrowing b
    JOIN asset a ON b.asset_id = a.asset_id
    JOIN category c ON a.category_id = c.category_id
    WHERE borrower_id = ?
    ORDER BY b.borrow_date DESC
  `;

  db.all(sql, [req.params.uid], (err, rows) => {
    if (err) {
      console.error('DB Error /api/student/history:', err);
      return res.status(500).send('DB Error');
    }

    const baseURL = getServerBaseURL();
    const history = rows.map((i) => ({
      ...i,
      category_image_url: `${baseURL}/images/categories/${i.category_image}`
    }));

    res.json(history);
  });
});

// GET PENDING / APPROVED REQUESTS
app.get('/api/student/requests/:uid', (req, res) => {
  const sql = `
    SELECT b.*, a.asset_name, a.asset_code, c.name AS category_name, c.image AS category_image
    FROM borrowing b
    JOIN asset a ON b.asset_id = a.asset_id
    JOIN category c ON a.category_id = c.category_id
    WHERE borrower_id = ? AND b.status IN ('pending','approved')
  `;

  db.all(sql, [req.params.uid], (err, rows) => {
    if (err) {
      console.error('DB Error /api/student/requests:', err);
      return res.status(500).send('DB Error');
    }

    const baseURL = getServerBaseURL();
    res.json(
      rows.map((i) => ({
        ...i,
        category_image_url: `${baseURL}/images/categories/${i.category_image}`
      }))
    );
  });
});

// CANCEL REQUEST
app.put('/api/student/cancel/:id', (req, res) => {
  const borrowingId = req.params.id;

  db.get(
    'SELECT asset_id, status FROM borrowing WHERE borrowing_id = ?',
    [borrowingId],
    (err, row) => {
      if (err) {
        console.error('DB Error /api/student/cancel (get):', err);
        return res.status(500).send('DB Error');
      }
      if (!row) return res.status(404).send('Not found');
      if (row.status !== 'pending')
        return res.status(400).send('Only pending can be cancelled');

      db.run(
        "UPDATE borrowing SET status='cancelled' WHERE borrowing_id = ?",
        [borrowingId],
        (err2) => {
          if (err2) {
            console.error('DB Error /api/student/cancel (update borrowing):', err2);
            return res.status(500).send('DB Error');
          }

          db.run(
            "UPDATE asset SET status='available' WHERE asset_id=?",
            [row.asset_id],
            (err3) => {
              if (err3) {
                console.error('DB Error /api/student/cancel (update asset):', err3);
                return res.status(500).send('DB Error');
              }
              res.json({ message: 'Cancelled' });
            }
          );
        }
      );
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

// DEV TOOL: GENERATE PASSWORD HASH
app.get('/api/password/:raw', (req, res) => {
  const raw = req.params.raw;            // เช่น 123456
  const hash = argon2.hashSync(raw);     // แปลงเป็น argon2 hash
  res.send(hash);                        // ส่ง hash กลับเป็น text
});

// LOGIN
app.post('/api/login', (req, res) => {
  const { email, username, uid, identifier, password } = req.body;

  // เลือกค่าที่ส่งมาจริง
  const loginValue = email || username || uid || identifier;
  if (!loginValue || !password) {
    return res.status(400).send('Missing login or password');
  }

  let sql = '';
  let params = [];

  // ตรวจว่าที่ส่งมาเป็น email หรือไม่
  if (email || (identifier && identifier.includes('@'))) {
    sql = 'SELECT * FROM users WHERE email = ?';
    params = [loginValue];
  }
  // ถ้าเป็นตัวเลข → uid
  else if (/^\d+$/.test(loginValue)) {
    sql = 'SELECT * FROM users WHERE uid = ?';
    params = [parseInt(loginValue, 10)];
  }
  // อย่างอื่นคือ username
  else {
    sql = 'SELECT * FROM users WHERE username = ?';
    params = [loginValue];
  }

  console.log('🔍 LOGIN SQL =', sql, 'PARAMS =', params);

  // Query user
  db.get(sql, params, (err, user) => {
    if (err) {
      console.error('DB Error /api/login:', err);
      return res.status(500).send('DB Error');
    }

    console.log('🔍 LOGIN USER =', user);

    if (!user) return res.status(401).send('Invalid credentials');

    const passwordMatch = argon2.verifySync(user.password, password);
    if (!passwordMatch) return res.status(401).send('Wrong password');

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

// 🔍 DEBUG: ดู user ทั้งหมดแบบสั้น ๆ
app.get('/api/debug/users', (req, res) => {
  db.all(
    'SELECT uid, email, username, role FROM users ORDER BY uid',
    [],
    (err, rows) => {
      if (err) {
        console.error('DB Error /api/debug/users:', err);
        return res.status(500).send('DB Error');
      }
      res.json(rows);
    }
  );
});


// 🔧 DEBUG ONE-SHOT: สร้าง lecturer ถ้ายังไม่มี
app.get('/api/debug/create-lecturer', (req, res) => {
  const email = 'lecturer01@example.com';

  // เช็คก่อนว่ามีอยู่แล้วรึยัง
  db.get('SELECT uid FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      console.error('DB Error /api/debug/create-lecturer (check):', err);
      return res.status(500).send('DB Error');
    }

    if (user) {
      return res.json({ message: 'Lecturer already exists', uid: user.uid });
    }

    const hash = argon2.hashSync('123456'); // password ที่จะใช้ล็อกอิน

    const sql = `
      INSERT INTO users (email, password, first_name, last_name, ph_num, username, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      sql,
      [
        email,
        hash,
        'Lecturer',
        'One',
        '0000000000',
        'lect01',
        'lecturer'
      ],
      function (err2) {
        if (err2) {
          console.error('DB Error /api/debug/create-lecturer (insert):', err2);
          return res.status(500).send('DB Error');
        }

        res.json({
          message: 'Lecturer created',
          uid: this.lastID,
          email,
          username: 'lect01',
          password: '123456'
        });
      }
    );
  });
});


// REGISTER
app.post('/api/register', (req, res) => {
  const { email, password, first_name, last_name, ph_num, username } = req.body;
  if (!email || !password || !first_name || !username)
    return res.status(400).send('Missing fields');

  const hash = argon2.hashSync(password);

  const sql = `
    INSERT INTO users (email, password, first_name, last_name, ph_num, username)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [email, hash, first_name, last_name, ph_num, username],
    function (err) {
      if (err) {
        console.error('DB Error /api/register:', err);
        return res.status(500).send('DB Error');
      }
      res.json({ message: 'Registered', uid: this.lastID });
    }
  );
});

// ============================================================
//                    LECTURER API ZONE
// ============================================================

// ดึงคำขอยืมทั้งหมดที่ยัง pending (ให้ Aj. เห็น)
app.get('/api/lecturer/requests', (req, res) => {
  const sql = `
    SELECT 
      b.borrowing_id,
      b.borrower_id,
      b.asset_id,
      b.status,
      b.borrow_date,
      b.return_date,
      u.first_name AS borrower_first_name,
      u.last_name AS borrower_last_name,
      a.asset_name,
      a.asset_code,
      c.name AS category_name,
      c.image AS category_image
    FROM borrowing b
    JOIN users u   ON b.borrower_id = u.uid
    JOIN asset a   ON b.asset_id   = a.asset_id
    JOIN category c ON a.category_id = c.category_id
    WHERE b.status = 'pending'
    ORDER BY b.borrow_date ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('DB Error /api/lecturer/requests:', err);
      return res.status(500).send('DB Error');
    }

    const baseURL = getServerBaseURL();
    const result = rows.map(r => ({
      ...r,
      category_image_url: `${baseURL}/images/categories/${r.category_image}`
    }));

    res.json(result);
  });
});

// อนุมัติคำขอยืม
app.put('/api/lecturer/approve/:id', (req, res) => {
  const borrowingId = req.params.id;
  const lecturerId = req.body.lecturer_id || null; // ถ้ายังไม่ใช้จะปล่อย null ก็ได้

  // อัปเดต borrowing -> approved, ใส่ approver_id, approved_at
  const sqlBorrowing = `
    UPDATE borrowing
    SET status = 'approved',
        approver_id = ?,
        approved_at = CURRENT_TIMESTAMP
    WHERE borrowing_id = ? AND status = 'pending'
  `;

  db.run(sqlBorrowing, [lecturerId, borrowingId], function (err) {
    if (err) {
      console.error('DB Error /api/lecturer/approve (borrowing):', err);
      return res.status(500).send('DB Error');
    }
    if (this.changes === 0) {
      return res.status(400).send('Cannot approve this request');
    }

    // ดึง asset_id เพื่ออัปเดตสถานะ asset เป็น 'borrowed'
    db.get(
      'SELECT asset_id FROM borrowing WHERE borrowing_id = ?',
      [borrowingId],
      (err2, row) => {
        if (err2 || !row) {
          if (err2) {
            console.error('DB Error /api/lecturer/approve (get asset):', err2);
          }
          return res.json({ message: 'Approved, but asset not updated' });
        }

        db.run(
          "UPDATE asset SET status = 'borrowed' WHERE asset_id = ?",
          [row.asset_id],
          (err3) => {
            if (err3) {
              console.error('DB Error /api/lecturer/approve (update asset):', err3);
              // ไม่ block การตอบกลับ
            }
            res.json({ message: 'Request approved', borrowing_id: borrowingId });
          }
        );
      }
    );
  });
});

// ปฏิเสธคำขอยืม
app.put('/api/lecturer/reject/:id', (req, res) => {
  const borrowingId = req.params.id;
  const lecturerId = req.body.lecturer_id || null;
  const reason = req.body.reason || null;

  // ดึง asset_id ก่อน
  db.get(
    'SELECT asset_id, status FROM borrowing WHERE borrowing_id = ?',
    [borrowingId],
    (err, row) => {
      if (err) {
        console.error('DB Error /api/lecturer/reject (get):', err);
        return res.status(500).send('DB Error');
      }
      if (!row) return res.status(404).send('Request not found');
      if (row.status !== 'pending')
        return res.status(400).send('Only pending requests can be rejected');

      // update borrowing -> rejected
      const sqlBorrowing = `
        UPDATE borrowing
        SET status = 'rejected',
            approver_id = ?,
            approved_at = CURRENT_TIMESTAMP
        WHERE borrowing_id = ?
      `;

      db.run(sqlBorrowing, [lecturerId, borrowingId], function (err2) {
        if (err2) {
          console.error('DB Error /api/lecturer/reject (update borrowing):', err2);
          return res.status(500).send('DB Error');
        }

        // คืน asset ให้ available
        db.run(
          "UPDATE asset SET status = 'available' WHERE asset_id = ?",
          [row.asset_id],
          (err3) => {
            if (err3) {
              console.error('DB Error /api/lecturer/reject (update asset):', err3);
            }

            // บันทึกลง approval_history (optional)
            db.run(
              `
              INSERT INTO approval_history (borrowing_id, lecturer_id, action, comment)
              VALUES (?, ?, 'rejected', ?)
            `,
              [borrowingId, lecturerId, reason],
              (err4) => {
                if (err4) {
                  console.error('DB Error /api/lecturer/reject (history):', err4);
                }

                res.json({
                  message: 'Request rejected',
                  borrowing_id: borrowingId,
                  reason: reason
                });
              }
            );
          }
        );
      });
    }
  );
});

// 4) History ของ Lecturer
app.get('/api/lecturer/history/:lecturerId', (req, res) => {
  const lecturerId = req.params.lecturerId;

  const sql = `
    SELECT
      b.borrowing_id,
      b.asset_id,
      b.borrower_id,
      b.approver_id,
      b.status,
      b.borrow_date,
      b.return_date,
      b.returned_at,
      b.approved_at,
      a.asset_code,
      a.asset_name,
      u.first_name || ' ' || IFNULL(u.last_name, '') AS borrower_name
    FROM borrowing b
    JOIN asset a ON b.asset_id = a.asset_id
    JOIN users u ON b.borrower_id = u.uid
    WHERE b.approver_id = ?
      AND b.status IN ('approved','rejected','returned')
    ORDER BY b.approved_at DESC, b.borrow_date DESC
  `;

  db.all(sql, [lecturerId], (err, rows) => {
    if (err) {
      console.error('DB Error /api/lecturer/history:', err);
      return res.status(500).send('DB Error');
    }
    res.json(rows);
  });
});

// 5) Dashboard ข้อมูลสรุป
app.get('/api/lecturer/dashboard/:lecturerId', (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM asset) AS total_assets,
      (SELECT COUNT(*) FROM asset WHERE status = 'available') AS available,
      (SELECT COUNT(*) FROM asset WHERE status = 'borrowed') AS borrowed,
      (SELECT COUNT(*) FROM asset WHERE status = 'disabled') AS disabled,
      (SELECT COUNT(*) FROM borrowing WHERE status = 'pending') AS pending_requests,
      (SELECT COUNT(*) FROM borrowing WHERE status = 'approved') AS approved_requests,
      (SELECT COUNT(*) FROM borrowing WHERE status = 'rejected') AS rejected_requests
  `;

  db.get(sql, [], (err, row) => {
    if (err) {
      console.error('DB Error /api/lecturer/dashboard:', err);
      return res.status(500).send('DB Error');
    }
    res.json(row);
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
