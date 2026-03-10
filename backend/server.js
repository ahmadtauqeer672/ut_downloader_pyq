const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_UPLOAD_KEY = process.env.ADMIN_UPLOAD_KEY || 'admin123';

function extractDriveFileId(rawUrl) {
  try {
    const url = new URL(String(rawUrl));
    if (!url.hostname.includes('drive.google.com')) {
      return null;
    }

    const idFromQuery = url.searchParams.get('id');
    if (idFromQuery) {
      return idFromQuery;
    }

    const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1];
    }

    return null;
  } catch (_error) {
    return null;
  }
}

function toDriveDownloadUrl(rawUrl) {
  const fileId = extractDriveFileId(rawUrl);
  if (!fileId) return String(rawUrl);
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const db = new sqlite3.Database(path.join(__dirname, 'pyq.db'));
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      university TEXT NOT NULL DEFAULT '',
      course TEXT NOT NULL DEFAULT '',
      department TEXT NOT NULL DEFAULT '',
      semester INTEGER NOT NULL DEFAULT 0,
      subject TEXT NOT NULL,
      year INTEGER NOT NULL,
      examType TEXT NOT NULL,
      fileName TEXT NOT NULL,
      driveUrl TEXT NOT NULL DEFAULT '',
      uploadedAt TEXT NOT NULL
    )
  `);

  db.all('PRAGMA table_info(papers)', (err, columns) => {
    if (err || !columns) return;

    const columnNames = new Set(columns.map((col) => col.name));
    if (!columnNames.has('university')) {
      db.run("ALTER TABLE papers ADD COLUMN university TEXT NOT NULL DEFAULT ''");
    }
    if (!columnNames.has('course')) {
      db.run("ALTER TABLE papers ADD COLUMN course TEXT NOT NULL DEFAULT ''");
    }
    if (!columnNames.has('department')) {
      db.run("ALTER TABLE papers ADD COLUMN department TEXT NOT NULL DEFAULT ''");
    }
    if (!columnNames.has('semester')) {
      db.run("ALTER TABLE papers ADD COLUMN semester INTEGER NOT NULL DEFAULT 0");
    }
    if (!columnNames.has('driveUrl')) {
      db.run("ALTER TABLE papers ADD COLUMN driveUrl TEXT NOT NULL DEFAULT ''");
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS competitive_papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      examName TEXT NOT NULL,
      year INTEGER NOT NULL,
      fileName TEXT NOT NULL,
      driveUrl TEXT NOT NULL DEFAULT '',
      uploadedAt TEXT NOT NULL
    )
  `);
});

const allowedOrigins = new Set([
  'http://localhost:4200',
  'https://ut-downloader-pyq.vercel.app'
]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: false
  })
);
app.use(express.json());

const allowedExt = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExt.has(ext)) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/papers', (req, res) => {
  const { university = '', course = '', department = '', semester = '', subject = '', year = '' } = req.query;
  let sql = 'SELECT * FROM papers WHERE 1=1';
  const params = [];

  if (university) {
    sql += ' AND university LIKE ?';
    params.push(`%${university}%`);
  }

  if (course) {
    sql += ' AND course LIKE ?';
    params.push(`%${course}%`);
  }

  if (department) {
    sql += ' AND department LIKE ?';
    params.push(`%${department}%`);
  }

  if (semester && /^\d+$/.test(semester)) {
    sql += ' AND semester = ?';
    params.push(Number(semester));
  }

  if (subject) {
    sql += ' AND subject LIKE ?';
    params.push(`%${subject}%`);
  }

  if (year && /^\d+$/.test(year)) {
    sql += ' AND year = ?';
    params.push(Number(year));
  }

  sql += ' ORDER BY year DESC, uploadedAt DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch papers' });
    }
    res.json(rows);
  });
});

app.post('/api/papers', upload.single('file'), (req, res) => {
  const providedKey = req.header('x-admin-key') || req.body.adminKey;
  if (providedKey !== ADMIN_UPLOAD_KEY) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(401).json({ message: 'Invalid admin key' });
  }

  const { title, university, course, department = '', semester = '', subject, year, examType, driveUrl = '' } = req.body;
  const normalizedDriveUrl = String(driveUrl).trim();
  const hasLocalFile = Boolean(req.file);
  const hasDriveUrl = Boolean(normalizedDriveUrl);

  if (!title || !university || !course || !subject || !year || !examType) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!hasLocalFile && !hasDriveUrl) {
    return res.status(400).json({ message: 'Upload a file or provide a Google Drive link' });
  }

  if (hasDriveUrl && !extractDriveFileId(normalizedDriveUrl)) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'Provide a valid Google Drive file link' });
  }

  if (!/^\d+$/.test(String(year))) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'Year must be numeric' });
  }

  const normalizedUniversity = String(university).trim();
  const normalizedCourse = String(course).trim().toUpperCase();
  const normalizedDepartment = String(department).trim().toUpperCase();
  const requiresDeptSem = normalizedCourse === 'BTECH';
  if (requiresDeptSem && (!normalizedDepartment || !semester)) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'Department and semester are required for BTECH' });
  }

  let semesterValue = 0;
  if (semester !== '') {
    if (!/^\d+$/.test(String(semester)) || Number(semester) < 1 || Number(semester) > 8) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Semester must be between 1 and 8' });
    }
    semesterValue = Number(semester);
  }

  const stmt = `
    INSERT INTO papers (title, university, course, department, semester, subject, year, examType, fileName, driveUrl, uploadedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    stmt,
    [
      title.trim(),
      normalizedUniversity,
      normalizedCourse,
      normalizedDepartment,
      semesterValue,
      subject.trim(),
      Number(year),
      examType.trim(),
      req.file ? req.file.filename : '',
      normalizedDriveUrl,
      new Date().toISOString()
    ],
    function onInsert(err) {
      if (err) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(500).json({ message: 'Failed to save paper' });
      }

      res.status(201).json({
        id: this.lastID,
        title,
        university: normalizedUniversity,
        course: normalizedCourse,
        department: normalizedDepartment,
        semester: semesterValue,
        subject,
        year: Number(year),
        examType,
        fileName: req.file ? req.file.filename : '',
        driveUrl: normalizedDriveUrl
      });
    }
  );
});

app.get('/api/papers/:id/preview', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  db.get('SELECT * FROM papers WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to load paper' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    if (row.driveUrl) {
      return res.redirect(row.driveUrl);
    }

    if (!row.fileName) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    const absPath = path.join(uploadDir, row.fileName);
    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    const ext = path.extname(row.fileName).toLowerCase();
    const mimeByExt = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg'
    };

    if (mimeByExt[ext]) {
      res.type(mimeByExt[ext]);
      res.setHeader('Content-Disposition', `inline; filename=\"${row.fileName}\"`);
    }

    return res.sendFile(absPath);
  });
});

app.get('/api/papers/:id/download', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  db.get('SELECT * FROM papers WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to load paper' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    if (row.driveUrl) {
      return res.redirect(toDriveDownloadUrl(row.driveUrl));
    }

    if (!row.fileName) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    const absPath = path.join(uploadDir, row.fileName);
    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.download(absPath, row.fileName);
  });
});

app.delete('/api/papers/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  const providedKey = req.header('x-admin-key') || req.query.adminKey;
  if (providedKey !== ADMIN_UPLOAD_KEY) {
    return res.status(401).json({ message: 'Invalid admin key' });
  }

  db.get('SELECT * FROM papers WHERE id = ?', [id], (findErr, row) => {
    if (findErr) {
      return res.status(500).json({ message: 'Failed to load paper' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    db.run('DELETE FROM papers WHERE id = ?', [id], function onDelete(deleteErr) {
      if (deleteErr) {
        return res.status(500).json({ message: 'Failed to delete paper' });
      }

      if (row.fileName) {
        const absPath = path.join(uploadDir, row.fileName);
        if (fs.existsSync(absPath)) {
          try {
            fs.unlinkSync(absPath);
          } catch (_unlinkErr) {
            // Keep API success if DB row is deleted and file cleanup fails.
          }
        }
      }

      return res.json({ message: 'Paper deleted successfully' });
    });
  });
});

app.get('/api/competitive-exams', (_req, res) => {
  const sql = 'SELECT DISTINCT examName FROM competitive_papers ORDER BY examName ASC';
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch competitive exams' });
    }
    return res.json(rows.map((row) => row.examName));
  });
});

app.get('/api/competitive-papers', (req, res) => {
  const { examName = '', year = '' } = req.query;
  let sql = 'SELECT * FROM competitive_papers WHERE 1=1';
  const params = [];

  if (examName) {
    sql += ' AND examName = ?';
    params.push(String(examName).trim().toUpperCase());
  }

  if (year && /^\d+$/.test(String(year))) {
    sql += ' AND year = ?';
    params.push(Number(year));
  }

  sql += ' ORDER BY year DESC, uploadedAt DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch competitive papers' });
    }
    return res.json(rows);
  });
});

app.post('/api/competitive-papers', upload.single('file'), (req, res) => {
  const providedKey = req.header('x-admin-key') || req.body.adminKey;
  if (providedKey !== ADMIN_UPLOAD_KEY) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(401).json({ message: 'Invalid admin key' });
  }

  const { title, examName, year, driveUrl = '' } = req.body;
  const normalizedDriveUrl = String(driveUrl).trim();
  const hasLocalFile = Boolean(req.file);
  const hasDriveUrl = Boolean(normalizedDriveUrl);

  if (!title || !examName || !year) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'Title, exam name and year are required' });
  }

  if (!hasLocalFile && !hasDriveUrl) {
    return res.status(400).json({ message: 'Upload a file or provide a Google Drive link' });
  }

  if (hasDriveUrl && !extractDriveFileId(normalizedDriveUrl)) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'Provide a valid Google Drive file link' });
  }

  if (!/^\d{4}$/.test(String(year))) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'Year must be a 4-digit number' });
  }

  const normalizedExamName = String(examName).trim().toUpperCase();
  const stmt = `
    INSERT INTO competitive_papers (title, examName, year, fileName, driveUrl, uploadedAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(
    stmt,
    [
      String(title).trim(),
      normalizedExamName,
      Number(year),
      req.file ? req.file.filename : '',
      normalizedDriveUrl,
      new Date().toISOString()
    ],
    function onInsert(err) {
      if (err) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(500).json({ message: 'Failed to save competitive paper' });
      }

      return res.status(201).json({
        id: this.lastID,
        title: String(title).trim(),
        examName: normalizedExamName,
        year: Number(year),
        fileName: req.file ? req.file.filename : '',
        driveUrl: normalizedDriveUrl
      });
    }
  );
});

app.get('/api/competitive-papers/:id/preview', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  db.get('SELECT * FROM competitive_papers WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to load paper' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    if (row.driveUrl) {
      return res.redirect(row.driveUrl);
    }

    if (!row.fileName) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    const absPath = path.join(uploadDir, row.fileName);
    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    const ext = path.extname(row.fileName).toLowerCase();
    const mimeByExt = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg'
    };

    if (mimeByExt[ext]) {
      res.type(mimeByExt[ext]);
      res.setHeader('Content-Disposition', `inline; filename=\"${row.fileName}\"`);
    }

    return res.sendFile(absPath);
  });
});

app.get('/api/competitive-papers/:id/download', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  db.get('SELECT * FROM competitive_papers WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to load paper' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    if (row.driveUrl) {
      return res.redirect(toDriveDownloadUrl(row.driveUrl));
    }

    if (!row.fileName) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    const absPath = path.join(uploadDir, row.fileName);
    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    return res.download(absPath, row.fileName);
  });
});

app.delete('/api/competitive-papers/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  const providedKey = req.header('x-admin-key') || req.query.adminKey;
  if (providedKey !== ADMIN_UPLOAD_KEY) {
    return res.status(401).json({ message: 'Invalid admin key' });
  }

  db.get('SELECT * FROM competitive_papers WHERE id = ?', [id], (findErr, row) => {
    if (findErr) {
      return res.status(500).json({ message: 'Failed to load paper' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    db.run('DELETE FROM competitive_papers WHERE id = ?', [id], function onDelete(deleteErr) {
      if (deleteErr) {
        return res.status(500).json({ message: 'Failed to delete paper' });
      }

      if (row.fileName) {
        const absPath = path.join(uploadDir, row.fileName);
        if (fs.existsSync(absPath)) {
          try {
            fs.unlinkSync(absPath);
          } catch (_unlinkErr) {
            // Keep API success if DB row is deleted and file cleanup fails.
          }
        }
      }

      return res.json({ message: 'Competitive paper deleted successfully' });
    });
  });
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err.message === 'Invalid file type') {
    return res.status(400).json({ message: 'Allowed types: pdf, jpg, jpeg, png, doc, docx' });
  }
  res.status(500).json({ message: 'Unexpected server error' });
});

app.listen(PORT, () => {
  console.log(`PYQ backend running on http://localhost:${PORT}`);
});
