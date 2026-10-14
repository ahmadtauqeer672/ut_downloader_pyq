import Link from 'next/link';
import { ChevronIcon } from '@/components/icons';
import { TestSeriesBrowser } from '@/components/test-series-browser';
import { listTestSeries } from '@/lib/api';
import { JsonLdScript } from '@/components/json-ld-script';
import { breadcrumbJsonLd, buildMetadata, itemListJsonLd } from '@/lib/seo';

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
      <JsonLdScript
        payload={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Test Series', path: '/test-series' }
        ])}
      />
      <JsonLdScript
        payload={itemListJsonLd(
          'Online test series on UTpaper',
          seriesList.map((series) => ({ name: series.title, path: `/test-series/${series.slug}` }))
        )}
      />
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <ChevronIcon className="icon icon--sm" />
        <span aria-current="page">Test Series</span>
      </nav>
      <TestSeriesBrowser seriesList={seriesList} />
    </>
  );
}
