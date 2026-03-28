import type { MetadataRoute } from 'next';
import { listCompetitiveExams } from '@/lib/api';
import { UNIVERSITY_OPTIONS } from '@/lib/data';
import { slugify } from '@/lib/slug';
import { createSitemapEntry, getBsebClass10SitemapEntries } from '@/lib/sitemaps';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    createSitemapEntry('/', { changeFrequency: 'daily', priority: 1, lastModified: new Date() }),
    createSitemapEntry('/about', { changeFrequency: 'monthly', priority: 0.55, lastModified: new Date() }),
    createSitemapEntry('/contact', { changeFrequency: 'monthly', priority: 0.5, lastModified: new Date() }),
    createSitemapEntry('/privacy-policy', { changeFrequency: 'monthly', priority: 0.45, lastModified: new Date() }),
    createSitemapEntry('/disclaimer', { changeFrequency: 'monthly', priority: 0.3, lastModified: new Date() })
  ];

  const courseRoutes = UNIVERSITY_OPTIONS.flatMap((option) => {
    if (option.name === 'BIHAR BOARD (BSEB)') {
      return [];
    }

    const universitySlug = slugify(option.name);
    const isPrimaryUniversity = option.name === 'PTU';
    const lastModified = new Date();
    const universityEntry = createSitemapEntry(`/question-papers/${universitySlug}`, {
      changeFrequency: isPrimaryUniversity ? 'daily' : 'weekly',
      priority: isPrimaryUniversity ? 0.9 : 0.76,
      lastModified
    });

    const courseEntries = option.courses.map<MetadataRoute.Sitemap[number]>((course) =>
      createSitemapEntry(`/question-papers/${universitySlug}/${slugify(course)}`, {
        changeFrequency: isPrimaryUniversity ? 'daily' : 'weekly',
        priority: isPrimaryUniversity ? 0.82 : 0.72,
        lastModified
      })
    );

    return [universityEntry, ...courseEntries];
  });

  const bsebClass10Routes = await getBsebClass10SitemapEntries();

  const competitiveExamRoutes = await listCompetitiveExams()
    .then((exams) =>
      exams.map<MetadataRoute.Sitemap[number]>((exam) =>
        createSitemapEntry(`/competitive-exams/${slugify(exam)}`, {
          changeFrequency: 'weekly',
          priority: 0.68,
          lastModified: new Date()
        })
      )
    )
    .catch(() => []);

  return [...staticRoutes, ...courseRoutes, ...bsebClass10Routes, ...competitiveExamRoutes].sort((a, b) =>
    a.url.localeCompare(b.url)
  );
}
