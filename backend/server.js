const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_UPLOAD_KEY = process.env.ADMIN_UPLOAD_KEY || 'admin123';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function extractDriveFileId(rawUrl) {
  try {
    const url = new URL(String(rawUrl));
    if (!url.hostname.includes('drive.google.com')) return null;
    const idFromQuery = url.searchParams.get('id');
    if (idFromQuery) return idFromQuery;
    const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    if (pathMatch && pathMatch[1]) return pathMatch[1];
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

const mimeByExt = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
};

function guessMime(fileName = '') {
  const ext = path.extname(String(fileName)).toLowerCase();
  return mimeByExt[ext] || 'application/octet-stream';
}

// Ensure any stored Cloudinary PDF URL points to the raw delivery endpoint.
function normalizeCloudinaryPdfUrl(url = '') {
  if (!url) return url;
  const lower = url.toLowerCase();
  if (!lower.endsWith('.pdf')) return url;
  if (url.includes('/raw/upload/')) return url;
  if (url.includes('/image/upload/')) return url.replace('/image/upload/', '/raw/upload/');
  return url;
}

function buildSignedPdfUrl(publicId = '') {
  if (!publicId) return '';
  const baseId = publicId.toLowerCase().endsWith('.pdf') ? publicId.slice(0, -4) : publicId;
  const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  return cloudinary.utils.private_download_url(baseId, 'pdf', {
    resource_type: 'raw',
    attachment: false,
    expires_at: expiresAt
  });
}

async function uploadToCloudinary(localPath, originalName) {
  const folder = process.env.CLOUDINARY_FOLDER || undefined;
  const res = await cloudinary.uploader.upload(localPath, {
    folder,
    resource_type: 'raw', // keep PDFs as raw files for direct download
    type: 'upload',
    use_filename: true,
    unique_filename: true,
    overwrite: false
  });
  return { url: res.secure_url || res.url, publicId: res.public_id };
}

// ---- Storage for temporary uploads (files removed after upload) ----
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedExt = new Set(['.pdf']);
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
    if (!allowedExt.has(ext)) return cb(new Error('Invalid file type'));
    cb(null, true);
  }
});

// ---- Postgres ----
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.POSTGRES_SSL === 'false' ? false : { rejectUnauthorized: false }
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS papers (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      university TEXT NOT NULL DEFAULT '',
      course TEXT NOT NULL DEFAULT '',
      department TEXT NOT NULL DEFAULT '',
      semester INTEGER NOT NULL DEFAULT 0,
      subject TEXT NOT NULL,
      year INTEGER NOT NULL,
      examType TEXT NOT NULL,
      fileName TEXT NOT NULL DEFAULT '',
      driveUrl TEXT NOT NULL DEFAULT '',
      fileUrl TEXT NOT NULL DEFAULT '',
      filePublicId TEXT NOT NULL DEFAULT '',
      uploadedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS competitive_papers (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      examName TEXT NOT NULL,
      year INTEGER NOT NULL,
      fileName TEXT NOT NULL DEFAULT '',
      driveUrl TEXT NOT NULL DEFAULT '',
      fileUrl TEXT NOT NULL DEFAULT '',
      filePublicId TEXT NOT NULL DEFAULT '',
      uploadedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

initDb().catch((err) => {
  console.error('Database init failed:', err);
  process.exit(1);
});

// ---- Middleware ----
const allowedOrigins = new Set(['http://localhost:4200', 'https://ut-downloader-pyq.vercel.app']);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin) || origin.endsWith('.vercel.app')) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: false
  })
);
app.use(express.json());

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---- Routes ----
app.get(
  '/api/health',
  asyncHandler(async (_req, res) => {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  })
);

app.get(
  '/api/papers',
  asyncHandler(async (req, res) => {
    const { university = '', course = '', department = '', semester = '', subject = '', year = '' } = req.query;
    let sql =
      'SELECT id, title, university, course, department, semester, subject, year, examtype AS "examType", filename AS "fileName", driveurl AS "driveUrl", fileurl AS "fileUrl", filepublicid AS "filePublicId", uploadedat AS "uploadedAt" FROM papers WHERE 1=1';
    const params = [];

    if (university) {
      params.push(`%${university}%`);
      sql += ` AND university ILIKE $${params.length}`;
    }
    if (course) {
      params.push(`%${course}%`);
      sql += ` AND course ILIKE $${params.length}`;
    }
    if (department) {
      params.push(`%${department}%`);
      sql += ` AND department ILIKE $${params.length}`;
    }
    if (semester && /^\d+$/.test(semester)) {
      params.push(Number(semester));
      sql += ` AND semester = $${params.length}`;
    }
    if (subject) {
      params.push(`%${subject}%`);
      sql += ` AND subject ILIKE $${params.length}`;
    }
    if (year && /^\d+$/.test(year)) {
      params.push(Number(year));
      sql += ` AND year = $${params.length}`;
    }

    sql += ' ORDER BY year DESC, uploadedAt DESC, id DESC';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  })
);

app.post(
  '/api/papers',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const providedKey = req.header('x-admin-key') || req.body.adminKey;
    if (providedKey !== ADMIN_UPLOAD_KEY) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(401).json({ message: 'Invalid admin key' });
    }

    const { title, university, course, department = '', semester = '', subject, year, examType, driveUrl = '' } = req.body;
    const normalizedDriveUrl = String(driveUrl).trim();
    let driveUrlValue = normalizedDriveUrl;
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

    let fileUrl = '';
    let filePublicId = '';
    const storedFileName = req.file ? req.file.originalname : '';

    if (req.file) {
      try {
        const uploaded = await uploadToCloudinary(req.file.path, req.file.originalname);
        driveUrlValue = '';
        filePublicId = uploaded.publicId;
        fileUrl = uploaded.url;
      } catch (_err) {
        console.error('File upload failed (academic):', _err?.message || _err);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        const message = _err?.message || 'Failed to upload file';
        return res.status(500).json({ message });
      } finally {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      }
    }

    const stmt = `
      INSERT INTO papers (title, university, course, department, semester, subject, year, examType, fileName, driveUrl, fileUrl, filePublicId, uploadedAt)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const { rows } = await pool.query(stmt, [
      title.trim(),
      normalizedUniversity,
      normalizedCourse,
      normalizedDepartment,
      semesterValue,
      subject.trim(),
      Number(year),
      examType.trim(),
      storedFileName,
      driveUrlValue,
      fileUrl,
      filePublicId,
      new Date().toISOString()
    ]);

    res.status(201).json(rows[0]);
  })
);

app.get(
  '/api/papers/:id/preview',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid paper id' });

    const { rows } = await pool.query(
      'SELECT id, title, university, course, department, semester, subject, year, examtype AS "examType", filename AS "fileName", driveurl AS "driveUrl", fileurl AS "fileUrl", filepublicid AS "filePublicId", uploadedat AS "uploadedAt" FROM papers WHERE id = $1',
      [id]
    );
    const row = rows[0];
    if (!row) return res.status(404).json({ message: 'Paper not found' });

    if (row.driveUrl) return res.redirect(row.driveUrl);
    const signedUrl = buildSignedPdfUrl(row.filePublicId);
    if (signedUrl) return res.redirect(signedUrl);
    const fileUrl = normalizeCloudinaryPdfUrl(row.fileUrl);
    if (fileUrl) return res.redirect(fileUrl);

    if (!row.fileName) return res.status(404).json({ message: 'File not found on server' });

    const absPath = path.join(uploadDir, row.fileName);
    if (!fs.existsSync(absPath)) return res.status(404).json({ message: 'File not found on server' });

    const ext = path.extname(row.fileName).toLowerCase();
    const mimeByExt = { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
    if (mimeByExt[ext]) {
      res.type(mimeByExt[ext]);
      res.setHeader('Content-Disposition', `inline; filename="${row.fileName}"`);
    }
    return res.sendFile(absPath);
  })
);

app.get(
  '/api/papers/:id/download',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid paper id' });

    const { rows } = await pool.query(
      'SELECT id, title, university, course, department, semester, subject, year, examtype AS "examType", filename AS "fileName", driveurl AS "driveUrl", fileurl AS "fileUrl", filepublicid AS "filePublicId", uploadedat AS "uploadedAt" FROM papers WHERE id = $1',
      [id]
    );
    const row = rows[0];
    if (!row) return res.status(404).json({ message: 'Paper not found' });

    if (row.driveUrl) return res.redirect(toDriveDownloadUrl(row.driveUrl));
    const signedUrl = buildSignedPdfUrl(row.filePublicId);
    if (signedUrl) return res.redirect(signedUrl);
    const fileUrl = normalizeCloudinaryPdfUrl(row.fileUrl);
    if (fileUrl) return res.redirect(fileUrl);

    if (!row.fileName) return res.status(404).json({ message: 'File not found on server' });

    const absPath = path.join(uploadDir, row.fileName);
    if (!fs.existsSync(absPath)) return res.status(404).json({ message: 'File not found on server' });

    return res.download(absPath, row.fileName);
  })
);

app.delete(
  '/api/papers/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid paper id' });

    const providedKey = req.header('x-admin-key') || req.query.adminKey;
    if (providedKey !== ADMIN_UPLOAD_KEY) return res.status(401).json({ message: 'Invalid admin key' });

    const { rows } = await pool.query(
      'SELECT id, title, university, course, department, semester, subject, year, examtype AS "examType", filename AS "fileName", driveurl AS "driveUrl", fileurl AS "fileUrl", filepublicid AS "filePublicId", uploadedat AS "uploadedAt" FROM papers WHERE id = $1',
      [id]
    );
    const row = rows[0];
    if (!row) return res.status(404).json({ message: 'Paper not found' });

    await pool.query('DELETE FROM papers WHERE id = $1', [id]);
    const absPath = path.join(uploadDir, row.fileName);
    if (row.fileName && fs.existsSync(absPath)) {
      try {
        fs.unlinkSync(absPath);
      } catch (_err) {
        // ignore
      }
    }

    return res.json({ message: 'Paper deleted successfully' });
  })
);

app.get(
  '/api/competitive-exams',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query('SELECT DISTINCT examName FROM competitive_papers ORDER BY examName ASC');
    res.json(rows.map((r) => r.examname));
  })
);

app.get(
  '/api/competitive-papers',
  asyncHandler(async (req, res) => {
    const { examName = '', year = '' } = req.query;
    let sql =
      'SELECT id, title, examname AS "examName", year, filename AS "fileName", driveurl AS "driveUrl", fileurl AS "fileUrl", filepublicid AS "filePublicId", uploadedat AS "uploadedAt" FROM competitive_papers WHERE 1=1';
    const params = [];

    if (examName) {
      params.push(String(examName).trim().toUpperCase());
      sql += ` AND examName = $${params.length}`;
    }

    if (year && /^\d{4}$/.test(String(year))) {
      params.push(Number(year));
      sql += ` AND year = $${params.length}`;
    }

    sql += ' ORDER BY year DESC, uploadedAt DESC, id DESC';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  })
);

app.post(
  '/api/competitive-papers',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const providedKey = req.header('x-admin-key') || req.body.adminKey;
    if (providedKey !== ADMIN_UPLOAD_KEY) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(401).json({ message: 'Invalid admin key' });
    }

    const { title, examName, year, driveUrl = '' } = req.body;
    const normalizedDriveUrl = String(driveUrl).trim();
    let driveUrlValue = normalizedDriveUrl;
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
    let fileUrl = '';
    let filePublicId = '';
    const storedFileName = req.file ? req.file.originalname : '';

    if (req.file) {
      try {
        const uploaded = await uploadToCloudinary(req.file.path, req.file.originalname);
        driveUrlValue = '';
        filePublicId = uploaded.publicId;
        fileUrl = uploaded.url;
      } catch (_err) {
        console.error('File upload failed (competitive):', _err?.message || _err);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        const message = _err?.message || 'Failed to upload file';
        return res.status(500).json({ message });
      } finally {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      }
    }

    const stmt = `
      INSERT INTO competitive_papers (title, examName, year, fileName, driveUrl, fileUrl, filePublicId, uploadedAt)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const { rows } = await pool.query(stmt, [
      String(title).trim(),
      normalizedExamName,
      Number(year),
      storedFileName,
      driveUrlValue,
      fileUrl,
      filePublicId,
      new Date().toISOString()
    ]);

    res.status(201).json(rows[0]);
  })
);

app.get(
  '/api/competitive-papers/:id/preview',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid paper id' });

    const { rows } = await pool.query(
      'SELECT id, title, examname AS "examName", year, filename AS "fileName", driveurl AS "driveUrl", fileurl AS "fileUrl", filepublicid AS "filePublicId", uploadedat AS "uploadedAt" FROM competitive_papers WHERE id = $1',
      [id]
  );
  const row = rows[0];
  if (!row) return res.status(404).json({ message: 'Paper not found' });

    if (row.driveUrl) return res.redirect(row.driveUrl);
    const signedUrl = buildSignedPdfUrl(row.filePublicId);
    if (signedUrl) return res.redirect(signedUrl);
    const fileUrl = normalizeCloudinaryPdfUrl(row.fileUrl);
    if (fileUrl) return res.redirect(fileUrl);

    if (!row.fileName) return res.status(404).json({ message: 'File not found on server' });

    const absPath = path.join(uploadDir, row.fileName);
    if (!fs.existsSync(absPath)) return res.status(404).json({ message: 'File not found on server' });

    const ext = path.extname(row.fileName).toLowerCase();
    const mimeByExt = { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
    if (mimeByExt[ext]) {
      res.type(mimeByExt[ext]);
      res.setHeader('Content-Disposition', `inline; filename="${row.fileName}"`);
    }
    return res.sendFile(absPath);
  })
);

app.get(
  '/api/competitive-papers/:id/download',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid paper id' });

    const { rows } = await pool.query(
      'SELECT id, title, examname AS "examName", year, filename AS "fileName", driveurl AS "driveUrl", fileurl AS "fileUrl", filepublicid AS "filePublicId", uploadedat AS "uploadedAt" FROM competitive_papers WHERE id = $1',
      [id]
    );
    const row = rows[0];
    if (!row) return res.status(404).json({ message: 'Paper not found' });

    if (row.driveUrl) return res.redirect(toDriveDownloadUrl(row.driveUrl));
    const signedUrl = buildSignedPdfUrl(row.filePublicId);
    if (signedUrl) return res.redirect(signedUrl);
    const fileUrl = normalizeCloudinaryPdfUrl(row.fileUrl);
    if (fileUrl) return res.redirect(fileUrl);

    if (!row.fileName) return res.status(404).json({ message: 'File not found on server' });

    const absPath = path.join(uploadDir, row.fileName);
    if (!fs.existsSync(absPath)) return res.status(404).json({ message: 'File not found on server' });

    return res.download(absPath, row.fileName);
  })
);

app.delete(
  '/api/competitive-papers/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid paper id' });

    const providedKey = req.header('x-admin-key') || req.query.adminKey;
    if (providedKey !== ADMIN_UPLOAD_KEY) return res.status(401).json({ message: 'Invalid admin key' });

    const { rows } = await pool.query(
      'SELECT id, title, examname AS "examName", year, filename AS "fileName", driveurl AS "driveUrl", fileurl AS "fileUrl", filepublicid AS "filePublicId", uploadedat AS "uploadedAt" FROM competitive_papers WHERE id = $1',
      [id]
    );
    const row = rows[0];
    if (!row) return res.status(404).json({ message: 'Paper not found' });

    await pool.query('DELETE FROM competitive_papers WHERE id = $1', [id]);
    const absPath = path.join(uploadDir, row.fileName);
    if (row.fileName && fs.existsSync(absPath)) {
      try {
        fs.unlinkSync(absPath);
      } catch (_err) {
        // ignore
      }
    }

    return res.json({ message: 'Competitive paper deleted successfully' });
  })
);

// ---- Error handling ----
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err.message === 'Invalid file type') {
    return res.status(400).json({ message: 'Only PDF files are allowed' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Unexpected server error' });
});

app.listen(PORT, () => {
  console.log(`PYQ backend running on http://localhost:${PORT}`);
});
