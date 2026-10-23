// IndexNow: tells Bing, Yandex and other participating search engines about new or changed pages right away.
// (Google does not take part; new pages reach it through the sitemap and Search Console.)
// The key must match the file served at https://www.utpaper.in/<key>.txt (next-frontend/public).

const INDEXNOW_KEY = '21d57c3cf22ef8c127f128cb7ffde8cb';
const SITE_HOST = 'www.utpaper.in';
const SITE_URL = `https://${SITE_HOST}`;

/** Submit absolute or site-relative URLs. Never throws: a failed ping must not break the caller. */
async function notifyIndexNow(urls) {
  const urlList = [...new Set(urls.filter(Boolean).map((u) => (u.startsWith('http') ? u : `${SITE_URL}${u}`)))];
  if (!urlList.length || process.env.INDEXNOW_DISABLED === 'true') return;
  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: SITE_HOST, key: INDEXNOW_KEY, keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`, urlList })
    });
    if (!response.ok) console.warn('IndexNow responded', response.status, 'for', urlList.length, 'URLs');
  } catch (error) {
    console.warn('IndexNow ping failed:', error.message);
  }
}

module.exports = { notifyIndexNow, INDEXNOW_KEY, SITE_URL };
