import type { MetadataRoute } from 'next';
import { listPapers } from '@/lib/api';
import { BSEB_10TH_SUBJECTS, SITE_URL } from '@/lib/data';
import { slugify } from '@/lib/slug';
import { Paper } from '@/lib/types';

const BSEB_UNIVERSITY = 'BIHAR BOARD (BSEB)';
const BSEB_COURSE = '10TH';
const BSEB_UNIVERSITY_PATH = `/question-papers/${slugify(BSEB_UNIVERSITY)}`;
const BSEB_COURSE_PATH = `${BSEB_UNIVERSITY_PATH}/${slugify(BSEB_COURSE)}`;

function normalizeLastModified(value?: Date | string): Date | undefined {
  if (!value) return undefined;

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getLatestPaperDate(papers: Paper[]): Date | undefined {
  return papers.reduce<Date | undefined>((latest, paper) => {
    const uploadedAt = normalizeLastModified(paper.uploadedAt);
    if (!uploadedAt) return latest;
    if (!latest || uploadedAt > latest) return uploadedAt;
    return latest;
  }, undefined);
}

export function createSitemapEntry(
  path: string,
  options: {
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
    lastModified?: Date | string;
  }
): MetadataRoute.Sitemap[number] {
  return {
    url: path.startsWith('http') ? path : `${SITE_URL}${path}`,
    changeFrequency: options.changeFrequency,
    priority: options.priority,
    ...(normalizeLastModified(options.lastModified) ? { lastModified: normalizeLastModified(options.lastModified) } : {})
  };
}

export async function getBsebClass10SitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const papers = await listPapers({
    university: BSEB_UNIVERSITY,
    course: BSEB_COURSE,
    limit: 500
  }).catch(() => []);

  const courseLastModified = getLatestPaperDate(papers);
  const universityEntry = createSitemapEntry(BSEB_UNIVERSITY_PATH, {
    changeFrequency: 'weekly',
    priority: 0.76,
    lastModified: courseLastModified
  });
  const courseEntry = createSitemapEntry(BSEB_COURSE_PATH, {
    changeFrequency: 'daily',
    priority: 0.84,
    lastModified: courseLastModified
  });

  const subjectEntries = BSEB_10TH_SUBJECTS.map<MetadataRoute.Sitemap[number]>((subject) => {
    const subjectLastModified =
      getLatestPaperDate(
        papers.filter((paper) => paper.subject.trim().toUpperCase() === subject.trim().toUpperCase())
      ) ?? courseLastModified;

    return createSitemapEntry(`${BSEB_COURSE_PATH}/${slugify(subject)}`, {
      changeFrequency: 'weekly',
      priority: 0.74,
      lastModified: subjectLastModified
    });
  });

  return [universityEntry, courseEntry, ...subjectEntries].sort((a, b) => a.url.localeCompare(b.url));
}

export function serializeSitemap(entries: MetadataRoute.Sitemap): string {
  const body = entries
    .map((entry) => {
      const lastModified = normalizeLastModified(entry.lastModified);

      return [
        '  <url>',
        `    <loc>${escapeXml(entry.url)}</loc>`,
        lastModified ? `    <lastmod>${lastModified.toISOString()}</lastmod>` : '',
        entry.changeFrequency ? `    <changefreq>${entry.changeFrequency}</changefreq>` : '',
        typeof entry.priority === 'number' ? `    <priority>${entry.priority.toFixed(2)}</priority>` : '',
        '  </url>'
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', body, '</urlset>'].join('\n');
}
