const crypto = require('crypto');
const multer = require('multer');

// Test series: candidate accounts, mock tests, attempts and admin management.
// Registered from server.js via registerTestSeriesRoutes(app, deps).

const STUDENT_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEST_KINDS = new Set(['exam', 'subject', 'pyq']);
const DIFFICULTIES = new Set(['EASY', 'MEDIUM', 'HARD']);

async function initTestSeriesDb(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS test_series (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      exam_name TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      is_published BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query("ALTER TABLE test_series ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT ''");
  await pool.query("ALTER TABLE test_series ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT ''");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tests (
      id SERIAL PRIMARY KEY,
      series_id INTEGER NOT NULL REFERENCES test_series(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'exam',
      category TEXT NOT NULL DEFAULT '',
      language TEXT NOT NULL DEFAULT 'English',
      difficulty TEXT NOT NULL DEFAULT 'MEDIUM',
      duration_minutes INTEGER NOT NULL DEFAULT 30,
      marks_per_question NUMERIC NOT NULL DEFAULT 1,
      negative_marks NUMERIC NOT NULL DEFAULT 0,
      is_featured BOOLEAN NOT NULL DEFAULT FALSE,
      is_published BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
      position INTEGER NOT NULL DEFAULT 0,
      question TEXT NOT NULL,
      options JSONB NOT NULL,
      correct_index INTEGER NOT NULL,
      explanation TEXT NOT NULL DEFAULT ''
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS attempts (
      id SERIAL PRIMARY KEY,
      test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      answers JSONB NOT NULL DEFAULT '{}'::jsonb,
      score NUMERIC NOT NULL DEFAULT 0,
      max_score NUMERIC NOT NULL DEFAULT 0,
      correct INTEGER NOT NULL DEFAULT 0,
      wrong INTEGER NOT NULL DEFAULT 0,
      skipped INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      time_taken_seconds INTEGER NOT NULL DEFAULT 0,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      submitted_at TIMESTAMPTZ
    );
  `);

  // Questions/options copied from PDFs can carry formula images.
  await pool.query("ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT ''");
  await pool.query("ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_images JSONB NOT NULL DEFAULT '[]'::jsonb");

  await pool.query('CREATE INDEX IF NOT EXISTS tests_series_idx ON tests(series_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS questions_test_idx ON questions(test_id, position)');
  await pool.query('CREATE INDEX IF NOT EXISTS attempts_test_idx ON attempts(test_id, submitted_at)');
  await pool.query('CREATE INDEX IF NOT EXISTS attempts_student_idx ON attempts(student_id)');
}

// ---- Passwords and tokens ----
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored = '') {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

function createTokenHelpers(secret) {
  const sign = (body) => crypto.createHmac('sha256', secret).update(`student:${body}`).digest('hex');

  return {
    signStudentToken(payload) {
      const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
      return `${body}.${sign(body)}`;
    },
    verifyStudentToken(token = '') {
      const [body, signature] = String(token).split('.');
      if (!body || !signature) return null;
      const expected = sign(body);
      if (signature.length !== expected.length) return null;
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
      try {
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        if (!payload?.studentId || !payload?.exp || Date.now() >= Number(payload.exp)) return null;
        return payload;
      } catch (_error) {
        return null;
      }
    }
  };
}

// Small in-memory limiter so login/register cannot be brute-forced quickly.
const authAttempts = new Map();
function isRateLimited(key, limit = 10, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const entry = authAttempts.get(key);
  if (!entry || now - entry.start > windowMs) {
    authAttempts.set(key, { start: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}

// ---- Helpers ----
function slugify(input = '') {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toInt(value, fallback = 0) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
}

const TEST_COLUMNS = `
  t.id, t.series_id AS "seriesId", t.title, t.kind, t.category, t.language, t.difficulty,
  t.duration_minutes AS "durationMinutes", t.marks_per_question::float AS "marksPerQuestion",
  t.negative_marks::float AS "negativeMarks", t.is_featured AS "isFeatured", t.is_published AS "isPublished",
  t.sort_order AS "sortOrder", t.created_at AS "createdAt",
  (SELECT COUNT(*)::int FROM questions q WHERE q.test_id = t.id) AS "questionCount",
  (SELECT COUNT(*)::int FROM attempts a WHERE a.test_id = t.id AND a.submitted_at IS NOT NULL) AS "attemptCount"
`;

const SERIES_COLUMNS = `
  s.id, s.slug, s.title, s.exam_name AS "examName", s.category, s.description, s.is_published AS "isPublished",
  s.logo_url AS "ownLogoUrl",
  -- A series without its own logo reuses the logo of another series with the same exam name.
  COALESCE(NULLIF(s.logo_url, ''), (
    SELECT o.logo_url FROM test_series o
    WHERE o.logo_url <> '' AND s.exam_name <> '' AND LOWER(TRIM(o.exam_name)) = LOWER(TRIM(s.exam_name))
    ORDER BY o.id LIMIT 1
  ), '') AS "logoUrl",
  s.created_at AS "createdAt"
`;

function seriesStatsSql(publishedOnly) {
  const testFilter = publishedOnly ? 'AND t.is_published' : '';
  return `
    (SELECT COUNT(*)::int FROM tests t WHERE t.series_id = s.id ${testFilter}) AS "testCount",
    (SELECT COUNT(*)::int FROM tests t WHERE t.series_id = s.id AND t.kind = 'exam' ${testFilter}) AS "examTestCount",
    (SELECT COUNT(*)::int FROM tests t WHERE t.series_id = s.id AND t.kind = 'subject' ${testFilter}) AS "subjectTestCount",
    (SELECT COUNT(*)::int FROM tests t WHERE t.series_id = s.id AND t.kind = 'pyq' ${testFilter}) AS "pyqTestCount",
    (SELECT COUNT(DISTINCT a.student_id)::int FROM attempts a JOIN tests t ON t.id = a.test_id
      WHERE t.series_id = s.id AND a.submitted_at IS NOT NULL) AS "studentCount"
  `;
}

function parseTestInput(body = {}) {
  const title = String(body.title || '').trim();
  if (!title) return { error: 'Test title is required' };

  const kind = String(body.kind || 'exam').toLowerCase();
  if (!TEST_KINDS.has(kind)) return { error: 'Test type must be exam, subject or pyq' };

  const difficulty = String(body.difficulty || 'MEDIUM').toUpperCase();
  if (!DIFFICULTIES.has(difficulty)) return { error: 'Difficulty must be EASY, MEDIUM or HARD' };

  const durationMinutes = toInt(body.durationMinutes, 0);
  if (durationMinutes < 1 || durationMinutes > 600) return { error: 'Duration must be between 1 and 600 minutes' };

  const marksPerQuestion = toNumber(body.marksPerQuestion, 1);
  const negativeMarks = toNumber(body.negativeMarks, 0);
  if (marksPerQuestion <= 0) return { error: 'Marks per question must be more than 0' };
  if (negativeMarks < 0) return { error: 'Negative marks cannot be below 0' };

  return {
    value: {
      title,
      kind,
      category: String(body.category || '').trim(),
      language: String(body.language || 'English').trim() || 'English',
      difficulty,
      durationMinutes,
      marksPerQuestion,
      negativeMarks,
      isFeatured: toBool(body.isFeatured, false),
      isPublished: toBool(body.isPublished, true),
      sortOrder: toInt(body.sortOrder, 0)
    }
  };
}

function cleanImageUrl(value) {
  const url = String(value || '').trim();
  return /^https:\/\/[^\s]+$/.test(url) ? url : '';
}

function parseQuestionInput(body = {}) {
  const question = String(body.question || '').trim();
  // Images are optional; undefined means "leave as is" when editing an existing question.
  const imageUrl = body.imageUrl === undefined ? undefined : cleanImageUrl(body.imageUrl);
  if (!question && !imageUrl) return { error: 'Question text is required' };

  const options = Array.isArray(body.options) ? body.options.map((item) => String(item ?? '').trim()) : [];
  const optionImages = Array.isArray(body.optionImages)
    ? options.map((_, i) => cleanImageUrl(body.optionImages[i]))
    : undefined;
  const filled = options.filter((item, i) => item || optionImages?.[i]);
  const label = (question || 'Image question').slice(0, 40);
  if (filled.length < 2 || filled.length !== options.length) {
    return { error: `Question "${label}" needs at least 2 filled options` };
  }
  if (options.length > 6) return { error: 'A question can have at most 6 options' };

  const correctIndex = toInt(body.correctIndex, -1);
  if (correctIndex < 0 || correctIndex >= options.length) {
    return { error: `Question "${label}" needs a valid correct answer` };
  }

  return {
    value: {
      question,
      options,
      correctIndex,
      explanation: String(body.explanation || '').trim(),
      imageUrl,
      optionImages
    }
  };
}

function gradeAttempt(questions, answers, test) {
  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  for (const question of questions) {
    const raw = answers[String(question.id)];
    const chosen = raw === undefined || raw === null || raw === '' ? null : toInt(raw, -1);
    if (chosen === null || chosen < 0) skipped += 1;
    else if (chosen === question.correctIndex) correct += 1;
    else wrong += 1;
  }

  const score = correct * test.marksPerQuestion - wrong * test.negativeMarks;
  return {
    correct,
    wrong,
    skipped,
    total: questions.length,
    score: Math.round(score * 100) / 100,
    maxScore: Math.round(questions.length * test.marksPerQuestion * 100) / 100
  };
}

function cleanAnswers(raw, questionIds) {
  const result = {};
  if (!raw || typeof raw !== 'object') return result;
  for (const id of questionIds) {
    const value = raw[String(id)];
    if (value === undefined || value === null || value === '') continue;
    const index = toInt(value, -1);
    if (index >= 0) result[String(id)] = index;
  }
  return result;
}

// ---- Routes ----
// Series logos: small images kept in memory, then sent to Cloudinary.
const LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, LOGO_TYPES.has(file.mimetype))
}).single('logo');

function registerTestSeriesRoutes(app, { pool, asyncHandler, requireAdminAuth, readBearerToken, sessionSecret, cloudinary }) {
  const { signStudentToken, verifyStudentToken } = createTokenHelpers(sessionSecret);

  function requireStudentAuth(req, res, next) {
    const session = verifyStudentToken(readBearerToken(req));
    if (!session) return res.status(401).json({ message: 'Please login to continue' });
    req.studentId = Number(session.studentId);
    next();
  }

  function sessionFor(student) {
    const expiresAt = Date.now() + STUDENT_TOKEN_TTL_MS;
    return {
      token: signStudentToken({ studentId: student.id, exp: expiresAt }),
      expiresAt,
      student: { id: student.id, name: student.name, email: student.email, phone: student.phone }
    };
  }

  async function loadTest(testId, { publishedOnly }) {
    const { rows } = await pool.query(
      `SELECT ${TEST_COLUMNS}, s.title AS "seriesTitle", s.slug AS "seriesSlug", s.is_published AS "seriesPublished"
       FROM tests t JOIN test_series s ON s.id = t.series_id WHERE t.id = $1`,
      [testId]
    );
    const test = rows[0];
    if (!test) return null;
    if (publishedOnly && (!test.isPublished || !test.seriesPublished)) return null;
    return test;
  }

  async function loadQuestions(testId, { withAnswers }) {
    const answerColumns = withAnswers ? ', correct_index AS "correctIndex", explanation' : '';
    const { rows } = await pool.query(
      `SELECT id, position, question, options, image_url AS "imageUrl", option_images AS "optionImages"${answerColumns}
       FROM questions WHERE test_id = $1 ORDER BY position ASC, id ASC`,
      [testId]
    );
    return rows;
  }

  // -- Candidate accounts --
  app.post(
    '/api/students/register',
    asyncHandler(async (req, res) => {
      const email = String(req.body?.email || '').trim().toLowerCase();
      // Signup only asks for email and password; fall back to the email's local part as a display name.
      const name = String(req.body?.name || '').trim() || email.split('@')[0];
      const phone = String(req.body?.phone || '').replace(/[^\d+]/g, '');
      const password = String(req.body?.password || '');

      if (isRateLimited(`register:${req.ip}`, 20)) {
        return res.status(429).json({ message: 'Too many attempts. Please try again in a few minutes.' });
      }
      if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ message: 'Please enter a valid email address' });
      if (phone && !/^\+?\d{10,13}$/.test(phone)) {
        return res.status(400).json({ message: 'Please enter a valid mobile number' });
      }
      if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

      const existing = await pool.query('SELECT id FROM students WHERE email = $1', [email]);
      if (existing.rows[0]) {
        return res.status(409).json({ message: 'An account with this email already exists. Please login.' });
      }

      const { rows } = await pool.query(
        'INSERT INTO students (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone',
        [name, email, phone, hashPassword(password)]
      );
      res.status(201).json(sessionFor(rows[0]));
    })
  );

  app.post(
    '/api/students/login',
    asyncHandler(async (req, res) => {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');

      if (isRateLimited(`login:${req.ip}:${email}`)) {
        return res.status(429).json({ message: 'Too many login attempts. Please try again in a few minutes.' });
      }

      const { rows } = await pool.query(
        'SELECT id, name, email, phone, password_hash AS "passwordHash" FROM students WHERE email = $1',
        [email]
      );
      const student = rows[0];
      if (!student || !verifyPassword(password, student.passwordHash)) {
        return res.status(401).json({ message: 'Incorrect email or password' });
      }

      res.json(sessionFor(student));
    })
  );

  app.get(
    '/api/students/me',
    requireStudentAuth,
    asyncHandler(async (req, res) => {
      const { rows } = await pool.query('SELECT id, name, email, phone FROM students WHERE id = $1', [req.studentId]);
      if (!rows[0]) return res.status(401).json({ message: 'Please login to continue' });
      res.json(rows[0]);
    })
  );

  app.get(
    '/api/students/me/attempts',
    requireStudentAuth,
    asyncHandler(async (req, res) => {
      const { rows } = await pool.query(
        `SELECT a.id, a.test_id AS "testId", t.title AS "testTitle", s.title AS "seriesTitle", s.slug AS "seriesSlug",
                a.score::float AS score, a.max_score::float AS "maxScore", a.correct, a.wrong, a.skipped, a.total,
                a.time_taken_seconds AS "timeTakenSeconds", a.started_at AS "startedAt", a.submitted_at AS "submittedAt"
         FROM attempts a
         JOIN tests t ON t.id = a.test_id
         JOIN test_series s ON s.id = t.series_id
         WHERE a.student_id = $1
         ORDER BY COALESCE(a.submitted_at, a.started_at) DESC
         LIMIT 100`,
        [req.studentId]
      );
      res.json(rows);
    })
  );

  // -- Public catalogue --
  app.get(
    '/api/test-series',
    asyncHandler(async (_req, res) => {
      const { rows } = await pool.query(
        `SELECT ${SERIES_COLUMNS}, ${seriesStatsSql(true)} FROM test_series s WHERE s.is_published ORDER BY s.created_at DESC`
      );
      res.json(rows);
    })
  );

  app.get(
    '/api/test-series/:slug',
    asyncHandler(async (req, res) => {
      const { rows } = await pool.query(
        `SELECT ${SERIES_COLUMNS}, ${seriesStatsSql(true)} FROM test_series s WHERE s.slug = $1 AND s.is_published`,
        [String(req.params.slug)]
      );
      const series = rows[0];
      if (!series) return res.status(404).json({ message: 'Test series not found' });

      const tests = await pool.query(
        `SELECT ${TEST_COLUMNS} FROM tests t WHERE t.series_id = $1 AND t.is_published
         ORDER BY t.sort_order ASC, t.id ASC`,
        [series.id]
      );
      res.json({ ...series, tests: tests.rows.filter((test) => test.questionCount > 0) });
    })
  );

  // -- Attempting a test --
  app.get(
    '/api/tests/:id',
    asyncHandler(async (req, res) => {
      const test = await loadTest(toInt(req.params.id), { publishedOnly: true });
      if (!test) return res.status(404).json({ message: 'Test not found' });
      res.json(test);
    })
  );

  app.post(
    '/api/tests/:id/start',
    requireStudentAuth,
    asyncHandler(async (req, res) => {
      const test = await loadTest(toInt(req.params.id), { publishedOnly: true });
      if (!test) return res.status(404).json({ message: 'Test not found' });

      const questions = await loadQuestions(test.id, { withAnswers: false });
      if (questions.length === 0) return res.status(400).json({ message: 'This test has no questions yet' });

      // Resume an unfinished attempt if there is still time left, so a page refresh does not reset the timer.
      const open = await pool.query(
        `SELECT id, answers, started_at AS "startedAt" FROM attempts
         WHERE test_id = $1 AND student_id = $2 AND submitted_at IS NULL
         ORDER BY started_at DESC LIMIT 1`,
        [test.id, req.studentId]
      );

      let attempt = open.rows[0];
      const durationMs = test.durationMinutes * 60 * 1000;
      if (attempt && Date.now() - new Date(attempt.startedAt).getTime() >= durationMs) {
        attempt = null;
      }

      if (!attempt) {
        const created = await pool.query(
          'INSERT INTO attempts (test_id, student_id) VALUES ($1, $2) RETURNING id, answers, started_at AS "startedAt"',
          [test.id, req.studentId]
        );
        attempt = created.rows[0];
      }

      const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
      res.json({
        attemptId: attempt.id,
        test,
        questions,
        answers: attempt.answers || {},
        remainingSeconds: Math.max(test.durationMinutes * 60 - elapsedSeconds, 0)
      });
    })
  );

  app.put(
    '/api/attempts/:id/answers',
    requireStudentAuth,
    asyncHandler(async (req, res) => {
      const attemptId = toInt(req.params.id);
      const { rows } = await pool.query(
        'SELECT id, test_id AS "testId" FROM attempts WHERE id = $1 AND student_id = $2 AND submitted_at IS NULL',
        [attemptId, req.studentId]
      );
      if (!rows[0]) return res.status(404).json({ message: 'Attempt not found' });

      const ids = (await pool.query('SELECT id FROM questions WHERE test_id = $1', [rows[0].testId])).rows.map((r) => r.id);
      await pool.query('UPDATE attempts SET answers = $1 WHERE id = $2', [
        JSON.stringify(cleanAnswers(req.body?.answers, ids)),
        attemptId
      ]);
      res.json({ ok: true });
    })
  );

  app.post(
    '/api/attempts/:id/submit',
    requireStudentAuth,
    asyncHandler(async (req, res) => {
      const attemptId = toInt(req.params.id);
      const { rows } = await pool.query(
        `SELECT id, test_id AS "testId", started_at AS "startedAt", submitted_at AS "submittedAt"
         FROM attempts WHERE id = $1 AND student_id = $2`,
        [attemptId, req.studentId]
      );
      const attempt = rows[0];
      if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
      if (attempt.submittedAt) return res.json({ attemptId: attempt.id });

      const test = await loadTest(attempt.testId, { publishedOnly: false });
      const questions = await loadQuestions(attempt.testId, { withAnswers: true });
      const answers = cleanAnswers(req.body?.answers, questions.map((q) => q.id));
      const result = gradeAttempt(questions, answers, test);
      const elapsed = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
      const timeTaken = Math.min(Math.max(elapsed, 0), test.durationMinutes * 60);

      await pool.query(
        `UPDATE attempts
         SET answers = $1, score = $2, max_score = $3, correct = $4, wrong = $5, skipped = $6, total = $7,
             time_taken_seconds = $8, submitted_at = NOW()
         WHERE id = $9`,
        [
          JSON.stringify(answers),
          result.score,
          result.maxScore,
          result.correct,
          result.wrong,
          result.skipped,
          result.total,
          timeTaken,
          attempt.id
        ]
      );

      res.json({ attemptId: attempt.id });
    })
  );

  app.get(
    '/api/attempts/:id',
    requireStudentAuth,
    asyncHandler(async (req, res) => {
      const { rows } = await pool.query(
        `SELECT a.id, a.test_id AS "testId", a.answers, a.score::float AS score, a.max_score::float AS "maxScore",
                a.correct, a.wrong, a.skipped, a.total, a.time_taken_seconds AS "timeTakenSeconds",
                a.submitted_at AS "submittedAt"
         FROM attempts a WHERE a.id = $1 AND a.student_id = $2 AND a.submitted_at IS NOT NULL`,
        [toInt(req.params.id), req.studentId]
      );
      const attempt = rows[0];
      if (!attempt) return res.status(404).json({ message: 'Result not found' });

      const test = await loadTest(attempt.testId, { publishedOnly: false });
      const questions = await loadQuestions(attempt.testId, { withAnswers: true });

      // Rank is based on each candidate's best score for this test.
      const rankResult = await pool.query(
        `WITH best AS (
           SELECT student_id, MAX(score) AS score FROM attempts
           WHERE test_id = $1 AND submitted_at IS NOT NULL GROUP BY student_id
         )
         SELECT (SELECT COUNT(*)::int FROM best WHERE score > $2) + 1 AS rank, (SELECT COUNT(*)::int FROM best) AS total`,
        [attempt.testId, attempt.score]
      );

      res.json({
        ...attempt,
        rank: rankResult.rows[0]?.rank ?? 1,
        rankOutOf: rankResult.rows[0]?.total ?? 1,
        test,
        questions
      });
    })
  );

  // -- Admin management --
  app.get(
    '/api/admin/test-series',
    requireAdminAuth,
    asyncHandler(async (_req, res) => {
      const { rows } = await pool.query(
        `SELECT ${SERIES_COLUMNS}, ${seriesStatsSql(false)} FROM test_series s ORDER BY s.created_at DESC`
      );
      res.json(rows);
    })
  );

  async function saveSeries(req, res, id) {
    const title = String(req.body?.title || '').trim();
    if (!title) return res.status(400).json({ message: 'Series title is required' });

    const slug = slugify(req.body?.slug || title);
    if (!slug) return res.status(400).json({ message: 'Series URL is invalid' });

    const clash = await pool.query('SELECT id FROM test_series WHERE slug = $1 AND id <> $2', [slug, id || 0]);
    if (clash.rows[0]) return res.status(409).json({ message: 'Another series already uses this URL' });

    const values = [
      slug,
      title,
      String(req.body?.examName || '').trim(),
      String(req.body?.description || '').trim(),
      toBool(req.body?.isPublished, true),
      String(req.body?.category || '').trim()
    ];

    const query = id
      ? `UPDATE test_series SET slug = $1, title = $2, exam_name = $3, description = $4, is_published = $5, category = $6 WHERE id = $7 RETURNING id`
      : `INSERT INTO test_series (slug, title, exam_name, description, is_published, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`;
    const { rows } = await pool.query(query, id ? [...values, id] : values);
    if (!rows[0]) return res.status(404).json({ message: 'Series not found' });

    const saved = await pool.query(
      `SELECT ${SERIES_COLUMNS}, ${seriesStatsSql(false)} FROM test_series s WHERE s.id = $1`,
      [rows[0].id]
    );
    return res.status(id ? 200 : 201).json(saved.rows[0]);
  }

  app.post(
    '/api/admin/test-series',
    requireAdminAuth,
    asyncHandler(async (req, res) => saveSeries(req, res, 0))
  );

  app.put(
    '/api/admin/test-series/:id',
    requireAdminAuth,
    asyncHandler(async (req, res) => saveSeries(req, res, toInt(req.params.id)))
  );

  app.delete(
    '/api/admin/test-series/:id',
    requireAdminAuth,
    asyncHandler(async (req, res) => {
      const { rowCount } = await pool.query('DELETE FROM test_series WHERE id = $1', [toInt(req.params.id)]);
      if (!rowCount) return res.status(404).json({ message: 'Series not found' });
      res.json({ message: 'Test series deleted' });
    })
  );

  app.post(
    '/api/admin/test-series/:id/logo',
    requireAdminAuth,
    (req, res, next) =>
      logoUpload(req, res, (err) => {
        if (err) {
          const tooBig = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE';
          return res.status(400).json({ message: tooBig ? 'Logo must be under 1 MB' : 'Could not read the logo file' });
        }
        next();
      }),
    asyncHandler(async (req, res) => {
      const id = toInt(req.params.id);
      const exists = await pool.query('SELECT id FROM test_series WHERE id = $1', [id]);
      if (!exists.rows[0]) return res.status(404).json({ message: 'Series not found' });
      if (!req.file) return res.status(400).json({ message: 'Choose a PNG, JPG or WEBP image' });

      const folder = [process.env.CLOUDINARY_FOLDER, 'series-logos'].filter(Boolean).join('/');
      const uploaded = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        {
          folder,
          resource_type: 'image',
          // Keep logos small; the site shows them at about 48px.
          transformation: [{ width: 256, height: 256, crop: 'limit' }]
        }
      );

      await pool.query('UPDATE test_series SET logo_url = $1 WHERE id = $2', [uploaded.secure_url, id]);
      res.json({ logoUrl: uploaded.secure_url });
    })
  );

  // Reuse a logo that was already uploaded for another series.
  app.put(
    '/api/admin/test-series/:id/logo',
    requireAdminAuth,
    asyncHandler(async (req, res) => {
      const logoUrl = String(req.body?.logoUrl || '').trim();
      const known = await pool.query("SELECT 1 FROM test_series WHERE logo_url = $1 AND logo_url <> '' LIMIT 1", [logoUrl]);
      if (!known.rows[0]) return res.status(400).json({ message: 'Pick one of the uploaded logos' });
      const { rowCount } = await pool.query('UPDATE test_series SET logo_url = $1 WHERE id = $2', [logoUrl, toInt(req.params.id)]);
      if (!rowCount) return res.status(404).json({ message: 'Series not found' });
      res.json({ logoUrl });
    })
  );

  app.get(
    '/api/admin/series-logos',
    requireAdminAuth,
    asyncHandler(async (_req, res) => {
      const { rows } = await pool.query(
        `SELECT logo_url AS "logoUrl", MIN(NULLIF(exam_name, '')) AS "examName"
         FROM test_series WHERE logo_url <> '' GROUP BY logo_url ORDER BY MIN(id)`
      );
      res.json(rows);
    })
  );

  app.delete(
    '/api/admin/test-series/:id/logo',
    requireAdminAuth,
    asyncHandler(async (req, res) => {
      const { rowCount } = await pool.query("UPDATE test_series SET logo_url = '' WHERE id = $1", [toInt(req.params.id)]);
      if (!rowCount) return res.status(404).json({ message: 'Series not found' });
      res.json({ logoUrl: '' });
    })
  );

  app.get(
    '/api/admin/test-series/:id/tests',
    requireAdminAuth,
    asyncHandler(async (req, res) => {
      const { rows } = await pool.query(
        `SELECT ${TEST_COLUMNS} FROM tests t WHERE t.series_id = $1 ORDER BY t.sort_order ASC, t.id ASC`,
        [toInt(req.params.id)]
      );
      res.json(rows);
    })
  );

  app.post(
    '/api/admin/test-series/:id/tests',
    requireAdminAuth,
    asyncHandler(async (req, res) => {
      const seriesId = toInt(req.params.id);
      const series = await pool.query('SELECT id FROM test_series WHERE id = $1', [seriesId]);
      if (!series.rows[0]) return res.status(404).json({ message: 'Series not found' });

      const parsed = parseTestInput(req.body);
      if (parsed.error) return res.status(400).json({ message: parsed.error });
      const t = parsed.value;

      const { rows } = await pool.query(
        `INSERT INTO tests (series_id, title, kind, category, language, difficulty, duration_minutes, marks_per_question,
                            negative_marks, is_featured, is_published, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
        [seriesId, t.title, t.kind, t.category, t.language, t.difficulty, t.durationMinutes, t.marksPerQuestion,
          t.negativeMarks, t.isFeatured, t.isPublished, t.sortOrder]
      );
      res.status(201).json(await loadTest(rows[0].id, { publishedOnly: false }));
    })
  );

  app.put(
    '/api/admin/tests/:id',
    requireAdminAuth,
    asyncHandler(async (req, res) => {
      const parsed = parseTestInput(req.body);
      if (parsed.error) return res.status(400).json({ message: parsed.error });
      const t = parsed.value;

      const { rowCount } = await pool.query(
        `UPDATE tests SET title = $1, kind = $2, category = $3, language = $4, difficulty = $5, duration_minutes = $6,
                marks_per_question = $7, negative_marks = $8, is_featured = $9, is_published = $10, sort_order = $11
         WHERE id = $12`,
        [t.title, t.kind, t.category, t.language, t.difficulty, t.durationMinutes, t.marksPerQuestion, t.negativeMarks,
          t.isFeatured, t.isPublished, t.sortOrder, toInt(req.params.id)]
      );
      if (!rowCount) return res.status(404).json({ message: 'Test not found' });
      res.json(await loadTest(toInt(req.params.id), { publishedOnly: false }));
    })
  );

  app.delete(
    '/api/admin/tests/:id',
    requireAdminAuth,
    asyncHandler(async (req, res) => {
      const { rowCount } = await pool.query('DELETE FROM tests WHERE id = $1', [toInt(req.params.id)]);
      if (!rowCount) return res.status(404).json({ message: 'Test not found' });
      res.json({ message: 'Test deleted' });
    })
  );

  app.get(
    '/api/admin/tests/:id/questions',
    requireAdminAuth,
    asyncHandler(async (req, res) => {
      res.json(await loadQuestions(toInt(req.params.id), { withAnswers: true }));
    })
  );

  // Accepts { questions: [...] } so admins can paste many questions at once.
  app.post(
    '/api/admin/tests/:id/questions',
    requireAdminAuth,
    asyncHandler(async (req, res) => {
      const testId = toInt(req.params.id);
      const exists = await pool.query('SELECT id FROM tests WHERE id = $1', [testId]);
      if (!exists.rows[0]) return res.status(404).json({ message: 'Test not found' });

      const input = Array.isArray(req.body?.questions) ? req.body.questions : [req.body];
      if (input.length === 0 || input.length > 500) {
        return res.status(400).json({ message: 'Add between 1 and 500 questions at a time' });
      }

      const parsed = [];
      for (const item of input) {
        const result = parseQuestionInput(item);
        if (result.error) return res.status(400).json({ message: result.error });
        parsed.push(result.value);
      }

      // One multi-row INSERT: atomic on its own and a single round trip, even for a 150-question paper.
      const values = [];
      const rows = parsed.map((q, i) => {
        const base = values.length;
        values.push(q.question, JSON.stringify(q.options), q.correctIndex, q.explanation, q.imageUrl || '',
          JSON.stringify(q.optionImages || []));
        return `($1, (SELECT COALESCE(MAX(position), 0) FROM questions WHERE test_id = $1) + ${i + 1}, ` +
          `$${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`;
      });
      await pool.query(
        `INSERT INTO questions (test_id, position, question, options, correct_index, explanation, image_url, option_images)
         VALUES ${rows.join(', ')}`,
        [testId, ...values]
      );

      res.status(201).json({ added: parsed.length });
    })
  );

  app.put(
    '/api/admin/questions/:id',
    requireAdminAuth,
    asyncHandler(async (req, res) => {
      const parsed = parseQuestionInput(req.body);
      if (parsed.error) return res.status(400).json({ message: parsed.error });
      const q = parsed.value;
      const { rowCount } = await pool.query(
        `UPDATE questions SET question = $1, options = $2, correct_index = $3, explanation = $4,
                image_url = COALESCE($6, image_url), option_images = COALESCE($7::jsonb, option_images)
         WHERE id = $5`,
        [q.question, JSON.stringify(q.options), q.correctIndex, q.explanation, toInt(req.params.id),
          q.imageUrl === undefined ? null : q.imageUrl,
          q.optionImages === undefined ? null : JSON.stringify(q.optionImages)]
      );
      if (!rowCount) return res.status(404).json({ message: 'Question not found' });
      res.json({ message: 'Question updated' });
    })
  );

  app.delete(
    '/api/admin/questions/:id',
    requireAdminAuth,
    asyncHandler(async (req, res) => {
      const { rowCount } = await pool.query('DELETE FROM questions WHERE id = $1', [toInt(req.params.id)]);
      if (!rowCount) return res.status(404).json({ message: 'Question not found' });
      res.json({ message: 'Question deleted' });
    })
  );

  app.get(
    '/api/admin/students',
    requireAdminAuth,
    asyncHandler(async (_req, res) => {
      const { rows } = await pool.query(
        `SELECT st.id, st.name, st.email, st.phone, st.created_at AS "createdAt",
                COUNT(a.id) FILTER (WHERE a.submitted_at IS NOT NULL)::int AS "attemptCount"
         FROM students st LEFT JOIN attempts a ON a.student_id = st.id
         GROUP BY st.id ORDER BY st.created_at DESC LIMIT 1000`
      );
      res.json(rows);
    })
  );
}

module.exports = { initTestSeriesDb, registerTestSeriesRoutes };
