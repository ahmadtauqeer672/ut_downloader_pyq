require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { Pool } = require('pg');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function makePublic(publicId) {
  if (!publicId) return null;
  try {
    // Set asset to public delivery, keep original folder/id
    await cloudinary.api.update(publicId, { access_mode: 'public', type: 'upload' });
    const res = await cloudinary.api.resource(publicId, { resource_type: 'raw' })
      .catch(() => cloudinary.api.resource(publicId, { resource_type: 'image' }));
    return res.secure_url || res.url;
  } catch (err) {
    console.error('Failed for', publicId, err.message);
    return null;
  }
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.POSTGRES_SSL === 'false' ? false : { rejectUnauthorized: false }
  });

  const tables = ['papers', 'competitive_papers'];

  for (const table of tables) {
    const { rows } = await pool.query(`SELECT id, filepublicid AS "filePublicId" FROM ${table} WHERE filepublicid <> ''`);
    console.log(`Processing ${rows.length} rows in ${table}...`);
    for (const row of rows) {
      const url = await makePublic(row.filePublicId);
      if (url) {
        await pool.query(`UPDATE ${table} SET fileurl = $1 WHERE id = $2`, [url, row.id]);
        console.log(`✔ ${table} id=${row.id} set public`);
      }
    }
  }

  await pool.end();
  console.log('Done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
