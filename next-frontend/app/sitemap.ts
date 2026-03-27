import type { MetadataRoute } from 'next';
import { listCompetitiveExams } from '@/lib/api';
import { BSEB_10TH_SUBJECTS, SITE_URL, UNIVERSITY_OPTIONS } from '@/lib/data';
import { slugify } from '@/lib/slug';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const createEntry = (
    path: string,
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: number
  ): MetadataRoute.Sitemap[number] => ({
    url: path.startsWith('http') ? path : `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    createEntry('/', 'daily', 1),
    createEntry('/about', 'monthly', 0.55),
    createEntry('/contact', 'monthly', 0.5),
    createEntry('/privacy-policy', 'monthly', 0.45),
    createEntry('/disclaimer', 'monthly', 0.3)
  ];

  const courseRoutes = UNIVERSITY_OPTIONS.flatMap((option) => {
    const universitySlug = slugify(option.name);
    const isPrimaryUniversity = option.name === 'PTU';
    const universityEntry = createEntry(
      `/question-papers/${universitySlug}`,
      isPrimaryUniversity ? 'daily' : 'weekly',
      isPrimaryUniversity ? 0.9 : 0.76
    );

    const courseEntries = option.courses.map<MetadataRoute.Sitemap[number]>((course) =>
      createEntry(
        `/question-papers/${universitySlug}/${slugify(course)}`,
        isPrimaryUniversity ? 'daily' : 'weekly',
        isPrimaryUniversity ? 0.82 : 0.72
      )
    );

    const subjectEntries =
      option.name === 'BIHAR BOARD (BSEB)'
        ? BSEB_10TH_SUBJECTS.map<MetadataRoute.Sitemap[number]>((subject) =>
            createEntry(
              `/question-papers/${universitySlug}/${slugify('10TH')}/${slugify(subject)}`,
              'weekly',
              0.7
            )
          )
        : [];

    return [universityEntry, ...courseEntries, ...subjectEntries];
  });

  const competitiveExamRoutes = await listCompetitiveExams()
    .then((exams) =>
      exams.map<MetadataRoute.Sitemap[number]>((exam) =>
        createEntry(`/competitive-exams/${slugify(exam)}`, 'weekly', 0.68)
      )
    )
    .catch(() => []);

  return [...staticRoutes, ...courseRoutes, ...competitiveExamRoutes].sort((a, b) => a.url.localeCompare(b.url));
}
