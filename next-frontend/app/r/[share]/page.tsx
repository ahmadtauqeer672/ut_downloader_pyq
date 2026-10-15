import Link from 'next/link';
import { notFound } from 'next/navigation';
import { KIND_LABEL } from '@/components/test-landing';
import { getSharedResult } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import { accuracyOf, formatScore, parseShareParam, percentOf } from '@/lib/share';
import { testHref } from '@/lib/slug';

interface SharedResultPageProps {
  params: Promise<{ share: string }>;
}

async function load(param: string) {
  const parsed = parseShareParam(param);
  if (!parsed) return null;
  return getSharedResult(parsed.id, parsed.sig);
}

export async function generateMetadata({ params }: SharedResultPageProps) {
  const { share } = await params;
  const result = await load(share);
  if (!result) return buildMetadata({ title: 'Result | UTpaper', description: 'Shared test result on UTpaper.', noIndex: true });
  const who = result.studentName || 'A UTpaper user';
  return buildMetadata({
    title: `${who} scored ${formatScore(result.score)}/${result.maxScore} in ${result.test.title} | UTpaper`,
    description: `${percentOf(result.score, result.maxScore)}% score, rank #${result.rank} of ${result.rankOutOf}. Attempt ${result.test.title} free on UTpaper and compare your rank.`,
    path: `/r/${share}`,
    noIndex: true
  });
}

export default async function SharedResultPage({ params }: SharedResultPageProps) {
  const { share } = await params;
  const result = await load(share);
  if (!result) notFound();

  const percent = percentOf(result.score, result.maxScore);
  const accuracy = accuracyOf(result.correct, result.wrong);
  const testUrl = result.test.seriesSlug ? testHref(result.test, result.test.seriesSlug) : `/tests/${result.test.id}`;
  const who = result.studentName || 'A UTpaper user';

  return (
    <>
      <section className="tp-hero shared-hero">
        <div className="tp-hero__main">
          <p className="tp-eyebrow">
            <span className="sd-tag sd-tag--free">Shared result</span>
            <span>{KIND_LABEL[result.test.kind]}</span>
          </p>
          <h1>
            {who} scored {formatScore(result.score)} / {result.maxScore}
          </h1>
          <p className="tp-lede">
            in <strong>{result.test.title}</strong>
            {result.test.seriesTitle ? ` (${result.test.seriesTitle})` : ''} on{' '}
            {new Date(result.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </p>

          <section className="result-stats shared-stats">
            <div>
              <strong>{percent}%</strong>
              <span>Score</span>
            </div>
            <div>
              <strong>
                #{result.rank}
                <small> / {result.rankOutOf}</small>
              </strong>
              <span>Rank</span>
            </div>
            <div>
              <strong>{accuracy}%</strong>
              <span>Accuracy</span>
            </div>
            <div className="is-good">
              <strong>{result.correct}</strong>
              <span>Correct</span>
            </div>
            <div className="is-bad">
              <strong>{result.wrong}</strong>
              <span>Wrong</span>
            </div>
          </section>

          <div className="tp-actions">
            <Link className="button button--primary button--lg" href={testUrl}>
              Attempt this test free →
            </Link>
            {result.test.seriesSlug ? (
              <Link className="button button--ghost" href={`/test-series/${result.test.seriesSlug}`}>
                All tests in this series
              </Link>
            ) : null}
          </div>
        </div>

        <aside className="tp-details">
          <h2>Can you beat this score?</h2>
          <dl>
            <div>
              <dt>Questions</dt>
              <dd>{result.test.questionCount}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{result.test.durationMinutes} minutes</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>Free</dd>
            </div>
          </dl>
          <p className="muted">
            Sign in with Google, attempt the same test with the real timer, and see your score and all-India rank instantly.
          </p>
        </aside>
      </section>
    </>
  );
}
