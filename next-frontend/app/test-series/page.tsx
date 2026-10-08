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
  const totalTests = seriesList.reduce((sum, series) => sum + series.testCount, 0);

  return (
    <>
      <section className="page-intro">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <ChevronIcon className="icon icon--sm" />
          <span aria-current="page">Test Series</span>
        </nav>
        <h1>Online Test Series</h1>
        <p>
          {seriesList.length > 0
            ? `${seriesList.length} exams · ${totalTests} free mock tests with instant score, rank and solutions.`
            : 'Free mock tests with instant score, rank and solutions.'}
        </p>
      </section>

      {seriesList.length > 0 ? (
        <TestSeriesBrowser seriesList={seriesList} />
      ) : (
        <section className="panel">
          <p className="empty-note">New test series are being added. Please check back soon.</p>
        </section>
      )}
    </>
  );
}
