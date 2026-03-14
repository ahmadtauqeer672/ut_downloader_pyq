require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.POSTGRES_SSL === 'false' ? false : { rejectUnauthorized: false }
  });

  const insertSql = `
    INSERT INTO papers (
      title, university, course, department, semester,
      subject, year, examType, fileName, driveUrl, fileUrl, filePublicId
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING id
  `;

  const values = [
    'Dummy PDF',
    'Test U',
    'BTECH',
    'CSE',
    1,
    'Sample Subject',
    2024,
    'REGULAR',
    'dummy.pdf',
    '',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    ''
  ];

  console.log('Inserting sample row...');
  const { rows } = await pool.query(insertSql, values);
  console.log('Inserted id:', rows[0].id);
  await pool.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
