import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/data';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/'
    },
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/bseb-class-10-sitemap.xml`]
  };
}
