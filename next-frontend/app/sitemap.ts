import type { MetadataRoute } from 'next';
import { SITE_URL, UNIVERSITY_OPTIONS } from '@/lib/data';
import { slugify } from '@/lib/slug';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: 'daily',
      priority: 1
    },
    {
      url: `${SITE_URL}/disclaimer`,
      changeFrequency: 'monthly',
      priority: 0.3
    }
  ];

  const courseRoutes = UNIVERSITY_OPTIONS.flatMap((option) => {
    const universitySlug = slugify(option.name);
    const universityEntry: MetadataRoute.Sitemap[number] = {
      url: `${SITE_URL}/question-papers/${universitySlug}`,
      changeFrequency: option.name === 'PTU' ? 'daily' : 'weekly',
      priority: option.name === 'PTU' ? 0.9 : 0.76
    };

    const courseEntries = option.courses.map<MetadataRoute.Sitemap[number]>((course) => ({
      url: `${SITE_URL}/question-papers/${universitySlug}/${slugify(course)}`,
      changeFrequency: option.name === 'PTU' ? 'daily' : 'weekly',
      priority: option.name === 'PTU' ? 0.82 : 0.72
    }));

    return [universityEntry, ...courseEntries];
  });

  return [...staticRoutes, ...courseRoutes];
}
