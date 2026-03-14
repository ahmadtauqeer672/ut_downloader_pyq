require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.POSTGRES_SSL === 'false' ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  const createPapers = `
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
  `;

  const createCompetitive = `
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
  `;

  await pool.query(createPapers);
  await pool.query(createCompetitive);
  await pool.end();
  console.log('Tables ensured');
}

main().catch((err) => {
  console.error('DB init failed:', err);
  process.exit(1);
});
