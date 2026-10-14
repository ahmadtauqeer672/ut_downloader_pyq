import type { MetadataRoute } from 'next';
import { getTestSeries, listCompetitiveExams, listPapers, listTestSeries } from '@/lib/api';
import { UNIVERSITY_OPTIONS } from '@/lib/data';
import { slugify, testHref } from '@/lib/slug';
import { createSitemapEntry, getBsebClass10SitemapEntries } from '@/lib/sitemaps';

// Rebuild at most hourly so newly added test series and papers show up without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    createSitemapEntry('/', { changeFrequency: 'daily', priority: 1, lastModified: new Date() }),
    createSitemapEntry('/test-series', { changeFrequency: 'daily', priority: 0.85, lastModified: new Date() }),
    createSitemapEntry('/about', { changeFrequency: 'monthly', priority: 0.55, lastModified: new Date() }),
    createSitemapEntry('/contact', { changeFrequency: 'monthly', priority: 0.5, lastModified: new Date() }),
    createSitemapEntry('/privacy-policy', { changeFrequency: 'monthly', priority: 0.45, lastModified: new Date() }),
    createSitemapEntry('/disclaimer', { changeFrequency: 'monthly', priority: 0.3, lastModified: new Date() })
  ];

  const universities = UNIVERSITY_OPTIONS.filter((option) => option.name !== 'BIHAR BOARD (BSEB)');
  const courseRoutes = (
    await Promise.all(
      universities.map(async (option) => {
        const universitySlug = slugify(option.name);
        const isPrimaryUniversity = option.name === 'PTU';
        const lastModified = new Date();
        const universityEntry = createSitemapEntry(`/question-papers/${universitySlug}`, {
          changeFrequency: isPrimaryUniversity ? 'daily' : 'weekly',
          priority: isPrimaryUniversity ? 0.9 : 0.76,
          lastModified
        });

        // Course pages without papers are noindex, so they stay out of the sitemap too.
        const courseEntries = await Promise.all(
          option.courses.map(async (course) => {
            const papers = await listPapers({ university: option.name, course, limit: 1 }).catch(() => []);
            if (papers.length === 0) return null;
            return createSitemapEntry(`/question-papers/${universitySlug}/${slugify(course)}`, {
              changeFrequency: isPrimaryUniversity ? 'daily' : 'weekly',
              priority: isPrimaryUniversity ? 0.82 : 0.72,
              lastModified
            });
          })
        );

        return [universityEntry, ...courseEntries.filter((entry): entry is MetadataRoute.Sitemap[number] => entry !== null)];
      })
    )
  ).flat();

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

  const seriesList = await listTestSeries();
  const testSeriesRoutes = seriesList.map<MetadataRoute.Sitemap[number]>((series) =>
    createSitemapEntry(`/test-series/${series.slug}`, {
      changeFrequency: 'weekly',
      priority: 0.8,
      lastModified: series.createdAt ? new Date(series.createdAt) : new Date()
    })
  );

  // One landing page per test, so each previous year paper and mock test can rank on its own.
  const seriesDetails = await Promise.all(seriesList.map((series) => getTestSeries(series.slug)));
  const testRoutes = seriesDetails.flatMap<MetadataRoute.Sitemap[number]>((series) =>
    series
      ? series.tests.map((test) =>
          createSitemapEntry(testHref(test, series.slug), {
            changeFrequency: 'monthly',
            priority: 0.75,
            lastModified: test.createdAt ? new Date(test.createdAt) : new Date()
          })
        )
      : []
  );

  return [
    ...staticRoutes,
    ...courseRoutes,
    ...bsebClass10Routes,
    ...competitiveExamRoutes,
    ...testSeriesRoutes,
    ...testRoutes
  ].sort((a, b) => a.url.localeCompare(b.url));
}
