import { notFound } from 'next/navigation';
import { SeriesSeoContent } from '@/components/series-seo-content';
import { TestSeriesTests } from '@/components/test-series-tests';
import { getTestSeries } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

interface TestSeriesPageProps {
  params: Promise<{ slug: string }>;
}

// Render each page on its first visit, then serve it from the cache until its data revalidates.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: TestSeriesPageProps) {
  const { slug } = await params;
  const series = await getTestSeries(slug);

  if (!series) {
    return buildMetadata({ title: 'Test Series | UTpaper', description: 'Free online mock tests on UTpaper.' });
  }

  const exam = series.examName || series.title;
  const pyqCount = series.tests.filter((test) => test.kind === 'pyq').length;
  const description =
    series.description ||
    `Attempt ${series.tests.length} free ${exam} online tests${pyqCount > 0 ? ` including ${pyqCount} previous year papers with the official answer key` : ''}. Real exam pattern, instant score, all-India rank and detailed solutions on UTpaper.`;

  return buildMetadata({
    title: `${series.title} | Free Online Test | UTpaper`,
    description: description.length > 300 ? `${description.slice(0, 297)}…` : description,
    path: `/test-series/${series.slug}`,
    keywords: [
      series.title,
      `${exam} mock test`,
      `${exam} test series`,
      `${exam} previous year paper`,
      `${exam} online test`,
      `${exam} PYQ`,
      'free mock test',
      'UTpaper'
    ]
  });
}

export default async function TestSeriesPage({ params }: TestSeriesPageProps) {
  const { slug } = await params;
  const series = await getTestSeries(slug);
  if (!series) notFound();

  return (
    <>
      <TestSeriesTests key={series.id} series={series} />
      <SeriesSeoContent series={series} />
    </>
  );
}
