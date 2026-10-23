// Submit every URL in the live sitemaps to IndexNow (Bing, Yandex, ...).
// Run after tests are imported straight into the database, which skips the admin panel's automatic ping:
//   node backend/indexnow-submit-sitemap.js
const { INDEXNOW_KEY, SITE_URL } = require('./indexnow');

const SITEMAPS = [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/bseb-class-10-sitemap.xml`];

(async () => {
  const keyFile = await fetch(`${SITE_URL}/${INDEXNOW_KEY}.txt`);
  if (!keyFile.ok || (await keyFile.text()).trim() !== INDEXNOW_KEY) {
    throw new Error(`Key file ${SITE_URL}/${INDEXNOW_KEY}.txt is not live yet`);
  }

  const urls = new Set();
  for (const sitemap of SITEMAPS) {
    const xml = await (await fetch(sitemap)).text();
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.add(match[1].trim());
  }
  const urlList = [...urls];

  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(SITE_URL).host, key: INDEXNOW_KEY, keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`, urlList })
  });
  console.log(`Submitted ${urlList.length} URLs to IndexNow: HTTP ${response.status} ${await response.text()}`);
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
