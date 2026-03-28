import { getBsebClass10SitemapEntries, serializeSitemap } from '@/lib/sitemaps';

export const revalidate = 1800;

export async function GET() {
  const entries = await getBsebClass10SitemapEntries();
  const xml = serializeSitemap(entries);

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=1800'
    }
  });
}
