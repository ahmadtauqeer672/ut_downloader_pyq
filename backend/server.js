const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'change-this-secret';

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

// Build a public raw URL from a publicId (no signature, uses the latest version).
function buildPublicRawUrl(publicId = '') {
  if (!publicId) return '';
  return cloudinary.url(publicId, { resource_type: 'raw', type: 'upload', secure: true });
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
const allowedOrigins = new Set([
  'http://localhost:4200',
  'https://ut-downloader-pyq.vercel.app',
  'https://utpaper.in',
  'https://www.utpaper.in'
]);

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

function signAdminToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(body).digest('hex');
  return `${body}.${signature}`;
}

function verifyAdminToken(token = '') {
  if (!token || !token.includes('.')) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(body).digest('hex');
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload?.userId || !payload?.exp) return null;
    if (Date.now() >= Number(payload.exp)) return null;
    return payload;
  } catch (_error) {
    return null;
  }
}

function readBearerToken(req) {
  const authHeader = String(req.header('authorization') || '');
  if (!authHeader.startsWith('Bearer ')) return '';
  return authHeader.slice('Bearer '.length).trim();
}

function requireAdminAuth(req, res, next) {
  const session = verifyAdminToken(readBearerToken(req));
  if (!session) {
    return res.status(401).json({ message: 'Admin login required' });
  }

  req.adminSession = session;
  next();
}

// ---- Routes ----
app.get(
  '/api/health',
  asyncHandler(async (_req, res) => {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  })
);

app.post(
  '/api/admin/login',
  asyncHandler(async (req, res) => {
    const userId = String(req.body?.userId || '').trim();
    const password = String(req.body?.password || '');

    if (userId !== ADMIN_USER_ID || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Invalid user ID or password' });
    }

    const expiresAt = Date.now() + 1000 * 60 * 60 * 12;
    const token = signAdminToken({ userId: ADMIN_USER_ID, exp: expiresAt });
    res.json({ token, userId: ADMIN_USER_ID, expiresAt });
  })
);

app.get(
  '/api/papers',
  asyncHandler(async (req, res) => {
    const {
      title = '',
      university = '',
      course = '',
      department = '',
      semester = '',
      subject = '',
      examType = '',
      year = '',
      limit = '',
      offset = '',
      paginate = 'false'
    } = req.query;

    const shouldPaginate = String(paginate).toLowerCase() === 'true';

    const selectBase =
      'SELECT id, title, university, course, department, semester, subject, year, examtype AS "examType", filename AS "fileName", driveurl AS "driveUrl", fileurl AS "fileUrl", filepublicid AS "filePublicId", uploadedat AS "uploadedAt"';
    let sql = ' FROM papers WHERE 1=1';
    const params = [];

    if (title) {
      params.push(`%${title}%`);
      sql += ` AND title ILIKE $${params.length}`;
    }
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
    if (examType) {
      params.push(`%${examType}%`);
      sql += ` AND examtype ILIKE $${params.length}`;
    }
    if (year && /^\d+$/.test(year)) {
      params.push(Number(year));
      sql += ` AND year = $${params.length}`;
    }

    const orderClause = ' ORDER BY year DESC, uploadedAt DESC, id DESC';

    if (shouldPaginate) {
      const parsedLimit = Number(limit);
      const parsedOffset = Number(offset);
      const limitValue = Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 20, 1), 100);
      const offsetValue = Math.max(Number.isFinite(parsedOffset) ? parsedOffset : 0, 0);

      const limitIndex = params.length + 1;
      const offsetIndex = params.length + 2;
      params.push(limitValue, offsetValue);

      const paginatedSql = `
        ${selectBase}, COUNT(*) OVER() AS "totalCount"
        ${sql}
        ${orderClause}
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `;

      const { rows } = await pool.query(paginatedSql, params);
      const total = rows[0]?.totalCount ? Number(rows[0].totalCount) : 0;
      const items = rows.map(({ totalCount, ...rest }) => rest);
      const hasMore = offsetValue + items.length < total;
      return res.json({
        items,
        total,
        limit: limitValue,
        offset: offsetValue,
        hasMore,
        nextOffset: hasMore ? offsetValue + limitValue : null
      });
    }

    const { rows } = await pool.query(`${selectBase}${sql}${orderClause}`, params);
    res.json(rows);
  })
);

app.post(
  '/api/papers',
  requireAdminAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
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
        fileUrl = normalizeCloudinaryPdfUrl(uploaded.url);
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

app.put(
  '/api/papers/:id',
  requireAdminAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Invalid paper id' });
    }

    const existingResp = await pool.query(
      'SELECT id, title, university, course, department, semester, subject, year, examtype AS "examType", filename AS "fileName", driveurl AS "driveUrl", fileurl AS "fileUrl", filepublicid AS "filePublicId", uploadedat AS "uploadedAt" FROM papers WHERE id = $1',
      [id]
    );
    const existing = existingResp.rows[0];
    if (!existing) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Paper not found' });
    }

    const { title, university, course, department = '', semester = '', subject, year, examType, driveUrl = '' } = req.body;
    const normalizedDriveUrl = String(driveUrl).trim();
    const hasExistingSource = Boolean(existing.driveUrl || existing.fileUrl || existing.filePublicId || existing.fileName);

    if (!title || !university || !course || !subject || !year || !examType) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!req.file && !normalizedDriveUrl && !hasExistingSource) {
      return res.status(400).json({ message: 'Upload a file or provide a Google Drive link' });
    }

    if (normalizedDriveUrl && !extractDriveFileId(normalizedDriveUrl)) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Provide a valid Google Drive file link' });
    }

    if (!/^\d+$/.test(String(year))) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Year must be numeric' });
    }

    const normalizedUniversity = String(university).trim();
    const normalizedCourse = String(course).trim().toUpperCase();
    const normalizedDepartment = String(department).trim().toUpperCase();
    const requiresDeptSem = normalizedCourse === 'BTECH';
    if (requiresDeptSem && (!normalizedDepartment || !semester)) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Department and semester are required for BTECH' });
    }

    let semesterValue = 0;
    if (requiresDeptSem) {
      if (!/^\d+$/.test(String(semester)) || Number(semester) < 1 || Number(semester) > 8) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Semester must be between 1 and 8' });
      }
      semesterValue = Number(semester);
    }

    let fileNameValue = existing.fileName || '';
    let driveUrlValue = existing.driveUrl || '';
    let fileUrlValue = existing.fileUrl || '';
    let filePublicIdValue = existing.filePublicId || '';

    if (req.file) {
      try {
        const uploaded = await uploadToCloudinary(req.file.path, req.file.originalname);
        fileNameValue = req.file.originalname;
        driveUrlValue = '';
        fileUrlValue = normalizeCloudinaryPdfUrl(uploaded.url);
        filePublicIdValue = uploaded.publicId;
      } catch (_err) {
        console.error('File update failed (academic):', _err?.message || _err);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        const message = _err?.message || 'Failed to upload file';
        return res.status(500).json({ message });
      } finally {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      }
    } else if (normalizedDriveUrl) {
      fileNameValue = '';
      driveUrlValue = normalizedDriveUrl;
      fileUrlValue = '';
      filePublicIdValue = '';
    }

    const { rows } = await pool.query(
      `UPDATE papers
       SET title = $1,
           university = $2,
           course = $3,
           department = $4,
           semester = $5,
           subject = $6,
           year = $7,
           examType = $8,
           fileName = $9,
           driveUrl = $10,
           fileUrl = $11,
           filePublicId = $12
       WHERE id = $13
       RETURNING id, title, university, course, department, semester, subject, year, examtype AS "examType", filename AS "fileName", driveurl AS "driveUrl", fileurl AS "fileUrl", filepublicid AS "filePublicId", uploadedat AS "uploadedAt"`,
      [
        String(title).trim(),
        normalizedUniversity,
        normalizedCourse,
        requiresDeptSem ? normalizedDepartment : '',
        semesterValue,
        String(subject).trim(),
        Number(year),
        String(examType).trim(),
        fileNameValue,
        driveUrlValue,
        fileUrlValue,
        filePublicIdValue,
        id
      ]
    );

    return res.json(rows[0]);
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
    const fileUrl = normalizeCloudinaryPdfUrl(row.fileUrl);
    if (fileUrl) return res.redirect(fileUrl);
    const publicRaw = buildPublicRawUrl(row.filePublicId);
    if (publicRaw) return res.redirect(publicRaw);

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
    const fileUrl = normalizeCloudinaryPdfUrl(row.fileUrl);
    if (fileUrl) return res.redirect(fileUrl);
    const publicRaw = buildPublicRawUrl(row.filePublicId);
    if (publicRaw) return res.redirect(publicRaw);

    if (!row.fileName) return res.status(404).json({ message: 'File not found on server' });

    const absPath = path.join(uploadDir, row.fileName);
    if (!fs.existsSync(absPath)) return res.status(404).json({ message: 'File not found on server' });

    return res.download(absPath, row.fileName);
  })
);

app.delete(
  '/api/papers/:id',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid paper id' });

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
  '/api/competitive-summary',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(`
      SELECT
        COALESCE(array_agg(examname ORDER BY examname), ARRAY[]::TEXT[]) AS exams,
        COALESCE(SUM(paper_count), 0)::INTEGER AS "totalCount"
      FROM (
        SELECT examname, COUNT(*)::INTEGER AS paper_count
        FROM competitive_papers
        GROUP BY examname
      ) grouped
    `);

    const summary = rows[0] || { exams: [], totalCount: 0 };
    res.json({
      exams: Array.isArray(summary.exams) ? summary.exams : [],
      totalCount: Number(summary.totalCount) || 0
    });
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
  requireAdminAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
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
        fileUrl = normalizeCloudinaryPdfUrl(uploaded.url);
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

app.put(
  '/api/competitive-papers/:id',
  requireAdminAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Invalid paper id' });
    }

    const existingResp = await pool.query(
      'SELECT id, title, examname AS "examName", year, filename AS "fileName", driveurl AS "driveUrl", fileurl AS "fileUrl", filepublicid AS "filePublicId", uploadedat AS "uploadedAt" FROM competitive_papers WHERE id = $1',
      [id]
    );
    const existing = existingResp.rows[0];
    if (!existing) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Paper not found' });
    }

    const { title, examName, year, driveUrl = '' } = req.body;
    const normalizedDriveUrl = String(driveUrl).trim();
    const hasExistingSource = Boolean(existing.driveUrl || existing.fileUrl || existing.filePublicId || existing.fileName);

    if (!title || !examName || !year) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Title, exam name and year are required' });
    }

    if (!req.file && !normalizedDriveUrl && !hasExistingSource) {
      return res.status(400).json({ message: 'Upload a file or provide a Google Drive link' });
    }

    if (normalizedDriveUrl && !extractDriveFileId(normalizedDriveUrl)) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Provide a valid Google Drive file link' });
    }

    if (!/^\d{4}$/.test(String(year))) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Year must be a 4-digit number' });
    }

    let fileNameValue = existing.fileName || '';
    let driveUrlValue = existing.driveUrl || '';
    let fileUrlValue = existing.fileUrl || '';
    let filePublicIdValue = existing.filePublicId || '';

    if (req.file) {
      try {
        const uploaded = await uploadToCloudinary(req.file.path, req.file.originalname);
        fileNameValue = req.file.originalname;
        driveUrlValue = '';
        fileUrlValue = normalizeCloudinaryPdfUrl(uploaded.url);
        filePublicIdValue = uploaded.publicId;
      } catch (_err) {
        console.error('File update failed (competitive):', _err?.message || _err);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        const message = _err?.message || 'Failed to upload file';
        return res.status(500).json({ message });
      } finally {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      }
    } else if (normalizedDriveUrl) {
      fileNameValue = '';
      driveUrlValue = normalizedDriveUrl;
      fileUrlValue = '';
      filePublicIdValue = '';
    }

    const { rows } = await pool.query(
      `UPDATE competitive_papers
       SET title = $1,
           examName = $2,
           year = $3,
           fileName = $4,
           driveUrl = $5,
           fileUrl = $6,
           filePublicId = $7
       WHERE id = $8
       RETURNING id, title, examname AS "examName", year, filename AS "fileName", driveurl AS "driveUrl", fileurl AS "fileUrl", filepublicid AS "filePublicId", uploadedat AS "uploadedAt"`,
      [
        String(title).trim(),
        String(examName).trim().toUpperCase(),
        Number(year),
        fileNameValue,
        driveUrlValue,
        fileUrlValue,
        filePublicIdValue,
        id
      ]
    );

    return res.json(rows[0]);
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
    const fileUrl = normalizeCloudinaryPdfUrl(row.fileUrl);
    if (fileUrl) return res.redirect(fileUrl);
    const publicRaw = buildPublicRawUrl(row.filePublicId);
    if (publicRaw) return res.redirect(publicRaw);

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
    const fileUrl = normalizeCloudinaryPdfUrl(row.fileUrl);
    if (fileUrl) return res.redirect(fileUrl);
    const publicRaw = buildPublicRawUrl(row.filePublicId);
    if (publicRaw) return res.redirect(publicRaw);

    if (!row.fileName) return res.status(404).json({ message: 'File not found on server' });

    const absPath = path.join(uploadDir, row.fileName);
    if (!fs.existsSync(absPath)) return res.status(404).json({ message: 'File not found on server' });

    return res.download(absPath, row.fileName);
  })
);

app.delete(
  '/api/competitive-papers/:id',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid paper id' });

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
