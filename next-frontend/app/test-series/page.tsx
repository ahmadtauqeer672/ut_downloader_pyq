import Link from 'next/link';
import { ChevronIcon } from '@/components/icons';
import { TestSeriesBrowser } from '@/components/test-series-browser';
import { listTestSeries } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Free Mock Test Series for Competitive Exams | UTpaper',
  description:
    'Attempt free online mock tests with instant results, detailed solutions and rank. Full-length mocks, subject-wise tests and previous year papers on UTpaper.',
  path: '/test-series',
  keywords: ['free mock test', 'online test series', 'BPSC TRE mock test', 'previous year paper test', 'UTpaper']
});

export default async function TestSeriesIndexPage() {
  const seriesList = await listTestSeries();

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <ChevronIcon className="icon icon--sm" />
        <span aria-current="page">Test Series</span>
      </nav>
      <TestSeriesBrowser seriesList={seriesList} />
    </>
  );
}
