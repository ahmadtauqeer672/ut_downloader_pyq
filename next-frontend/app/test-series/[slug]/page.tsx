import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronIcon, TestsIcon, UsersIcon } from '@/components/icons';
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

  const testCount = series.tests.length;
  const examCount = series.tests.filter((test) => test.kind === 'exam').length;
  const subjectCount = series.tests.filter((test) => test.kind === 'subject').length;
  const pyqCount = series.tests.filter((test) => test.kind === 'pyq').length;

  return (
    <>
      <section className="series-hero">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <ChevronIcon className="icon icon--sm" />
          <Link href="/test-series">Test Series</Link>
          <ChevronIcon className="icon icon--sm" />
          <span aria-current="page">{series.examName || 'Mock Tests'}</span>
        </nav>

        <div className="series-hero__title">
          {series.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="series-hero__logo" src={series.logoUrl} alt={`${series.examName || series.title} logo`} />
          ) : null}
          <h1>{series.title}</h1>
        </div>
        {series.description ? <p className="series-hero__lede">{series.description}</p> : null}

        <div className="stat-row">
          <div className="stat-box">
            <TestsIcon className="stat-box__icon stat-box__icon--blue" />
            <div>
              <strong>{testCount}</strong>
              <span>Total Tests</span>
            </div>
          </div>
          <div className="stat-box">
            <UsersIcon className="stat-box__icon stat-box__icon--green" />
            <div>
              <strong>{series.studentCount}</strong>
              <span>Students</span>
            </div>
          </div>
        </div>

        <h2 className="series-hero__sub">What you&apos;ll get</h2>
        <div className="get-row">
          {examCount > 0 ? (
            <span>
              <b>{examCount}</b> Exam Tests
            </span>
          ) : null}
          {subjectCount > 0 ? (
            <span>
              <b>{subjectCount}</b> Subject Tests
            </span>
          ) : null}
          {pyqCount > 0 ? (
            <span>
              <b>{pyqCount}</b> Previous Year Papers
            </span>
          ) : null}
          <span>
            <b>✓</b> Solutions &amp; rank
          </span>
        </div>
      </section>

      <TestSeriesTests key={series.id} seriesTitle={series.title} tests={series.tests} />
    </>
  );
}
