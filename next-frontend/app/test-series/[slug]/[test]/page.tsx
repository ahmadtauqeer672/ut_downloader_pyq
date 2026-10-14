import { notFound, permanentRedirect } from 'next/navigation';
import { KIND_LABEL, TestLanding, describeTest } from '@/components/test-landing';
import { getTest, getTestPreview, getTestSeries } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import { parseTestIdFromSlug, testHref, testSlug } from '@/lib/slug';

interface TestLandingPageProps {
  params: Promise<{ slug: string; test: string }>;
}

// Render each page on its first visit, then serve it from the cache until its data revalidates.
export function generateStaticParams() {
  return [];
}

async function loadTestForPage(slug: string, param: string) {
  const id = parseTestIdFromSlug(param);
  if (!id) return null;
  const test = await getTest(id);
  if (!test || !test.seriesSlug) return null;
  return test;
}

export async function generateMetadata({ params }: TestLandingPageProps) {
  const { slug, test: param } = await params;
  const test = await loadTestForPage(slug, param);
  if (!test || test.seriesSlug !== slug || testSlug(test) !== param) {
    return buildMetadata({ title: 'Online Test | UTpaper', description: 'Free online mock tests on UTpaper.', noIndex: true });
  }
  const exam = test.seriesTitle?.split(/ Mock Test| Test Series| PYQ/i)[0] || test.seriesTitle || '';
  return buildMetadata({
    title: `${test.title} | Free Online Test | UTpaper`,
    description: describeTest(test),
    path: testHref(test, test.seriesSlug!),
    keywords: [
      test.title,
      `${exam} ${KIND_LABEL[test.kind].toLowerCase()}`,
      test.kind === 'pyq' ? `${exam} previous year question paper with answer key` : `${exam} mock test`,
      `${exam} online test`,
      'free mock test',
      'UTpaper'
    ]
  });
}

export default async function TestLandingPage({ params }: TestLandingPageProps) {
  const { slug, test: param } = await params;
  const test = await loadTestForPage(slug, param);
  if (!test) notFound();

  // Old or mistyped slugs go to the canonical URL, so links keep working after a rename.
  const canonical = testHref(test, test.seriesSlug!);
  if (test.seriesSlug !== slug || testSlug(test) !== param) permanentRedirect(canonical);

  const [series, preview] = await Promise.all([getTestSeries(test.seriesSlug!), getTestPreview(test.id)]);
  if (!series) notFound();

  return <TestLanding test={test} series={series} preview={preview} />;
}
