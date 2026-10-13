import { notFound } from 'next/navigation';
import { TestSeriesTests } from '@/components/test-series-tests';
import { getTestSeries } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

interface TestSeriesPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TestSeriesPageProps) {
  const { slug } = await params;
  const series = await getTestSeries(slug);

  if (!series) {
    return buildMetadata({ title: 'Test Series | UTpaper', description: 'Free online mock tests on UTpaper.' });
  }

  return buildMetadata({
    title: `${series.title} | UTpaper`,
    description: series.description || `Attempt ${series.title} online with instant results and solutions on UTpaper.`,
    path: `/test-series/${series.slug}`,
    keywords: [series.title, `${series.examName} mock test`, `${series.examName} test series`, 'free mock test']
  });
}

export default async function TestSeriesPage({ params }: TestSeriesPageProps) {
  const { slug } = await params;
  const series = await getTestSeries(slug);
  if (!series) notFound();

  return <TestSeriesTests key={series.id} series={series} />;
}
