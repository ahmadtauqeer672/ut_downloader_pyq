'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RichContent } from '@/components/rich-content';
import { ShareResult } from '@/components/share-result';
import { StudentAuthForm } from '@/components/student-auth-form';
import { SITE_URL } from '@/lib/data';
import { testHref } from '@/lib/slug';
import { ApiError, getAttemptResult } from '@/lib/student-api';
import { AttemptResult, NOT_ATTEMPTED } from '@/lib/types';
import { useStudentSession } from '@/lib/use-student-session';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
type Filter = 'all' | 'correct' | 'wrong' | 'skipped' | 'unmarked';
const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  correct: 'Correct',
  wrong: 'Wrong',
  skipped: 'Not attempted',
  unmarked: 'Left blank'
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function TestResultClient({ attemptId }: { attemptId: number }) {
  const { ready, token, student, login, logout } = useStudentSession();
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (!ready || !token) return;
    getAttemptResult(attemptId, token)
      .then(setResult)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
        else setError(err instanceof Error ? err.message : 'Could not load the result.');
      });
    // logout is recreated each render; the token change is what matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token, attemptId]);

  if (!ready) return <section className="panel narrow">Loading result…</section>;

  if (!token) {
    return (
      <section className="panel narrow">
        <StudentAuthForm initialMode="login" heading="Login to see your result" onSuccess={login} />
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel narrow">
        <h1 className="panel__title">{error}</h1>
        <Link className="button button--primary" href="/my-tests">
          Go to my tests
        </Link>
      </section>
    );
  }

  if (!result) return <section className="panel narrow">Loading result…</section>;

  const attempted = result.correct + result.wrong;
  const accuracy = attempted > 0 ? Math.round((result.correct / attempted) * 100) : 0;
  const percent = result.maxScore > 0 ? Math.max(0, Math.round((result.score / result.maxScore) * 100)) : 0;

  const penalisesBlank = Boolean(result.test.notAttemptedOption);
  const unmarked = result.unmarked ?? 0;
  const sectionScores = result.sectionScores ?? [];
  const hasQualifying = sectionScores.some((item) => item.qualifying);
  const outcomeOf = (questionId: number, correctIndex?: number): Exclude<Filter, 'all'> => {
    const chosen = result.answers[String(questionId)];
    if (chosen === undefined) return penalisesBlank ? 'unmarked' : 'skipped';
    if (chosen === NOT_ATTEMPTED) return 'skipped';
    return chosen === correctIndex ? 'correct' : 'wrong';
  };
  const counts: Record<Filter, number> = {
    all: result.total,
    correct: result.correct,
    wrong: result.wrong,
    skipped: result.skipped,
    unmarked
  };
  const filters: Filter[] = penalisesBlank ? ['all', 'correct', 'wrong', 'skipped', 'unmarked'] : ['all', 'correct', 'wrong', 'skipped'];
  const filtered = result.questions.filter((q) => filter === 'all' || outcomeOf(q.id, q.correctIndex) === filter);

  return (
    <>
      <section className="result-hero">
        <div>
          {result.test.seriesSlug ? (
            <Link className="back-link" href={`/test-series/${result.test.seriesSlug}`}>
              ← {result.test.seriesTitle}
            </Link>
          ) : null}
          <h1>{result.test.title}</h1>
          <p className="muted">Submitted {new Date(result.submittedAt).toLocaleString('en-IN')}</p>
        </div>

        <div className="score-ring" style={{ '--pct': percent } as React.CSSProperties}>
          <div>
            <strong>{result.score}</strong>
            <span>
              {hasQualifying ? 'merit ' : ''}of {result.maxScore}
            </span>
          </div>
        </div>
      </section>

      {hasQualifying ? (
        <p className={`qualify-banner${result.qualified === false ? ' is-failed' : ''}`}>
          {result.qualified === false
            ? 'Not qualified: you did not reach the pass mark in a qualifying section, so this score would not count in the real exam.'
            : 'Qualified: you cleared every qualifying section.'}
        </p>
      ) : null}

      <section className="result-stats">
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
        <div>
          <strong>{result.skipped}</strong>
          <span>{penalisesBlank ? 'Not attempted' : 'Skipped'}</span>
        </div>
        {penalisesBlank ? (
          <div className={unmarked > 0 ? 'is-bad' : undefined}>
            <strong>{unmarked}</strong>
            <span>Left blank</span>
          </div>
        ) : null}
        <div>
          <strong>{formatDuration(result.timeTakenSeconds)}</strong>
          <span>Time taken</span>
        </div>
      </section>

      <div className="result-actions">
        <Link className="button button--primary" href={`/tests/${result.testId}`}>
          Reattempt
        </Link>
        <Link className="button button--outline" href="/my-tests">
          My tests
        </Link>
      </div>

      <ShareResult
        card={{
          name: student?.name?.trim() || 'I',
          testTitle: result.test.title,
          seriesTitle: result.test.seriesTitle || '',
          score: result.score,
          maxScore: result.maxScore,
          percent,
          rank: result.rank,
          rankOutOf: result.rankOutOf,
          accuracy,
          correct: result.correct,
          wrong: result.wrong,
          url: result.shareSig
            ? `${SITE_URL}/r/${result.id}-${result.shareSig}`
            : `${SITE_URL}${result.test.seriesSlug ? testHref(result.test, result.test.seriesSlug) : `/tests/${result.testId}`}`
        }}
      />

      {sectionScores.length > 0 ? (
        <section className="series-section">
          <h2 className="series-section__title">Section-wise result</h2>
          <div className="section-table-wrap">
            <table className="section-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Correct</th>
                  <th>Wrong</th>
                  <th>{penalisesBlank ? 'Not attempted' : 'Skipped'}</th>
                  {penalisesBlank ? <th>Left blank</th> : null}
                  <th>Marks</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sectionScores.map((item) => (
                  <tr key={item.name || 'other'}>
                    <td>
                      <b>{item.name || 'Other'}</b>
                      {item.qualifying ? <em>Qualifying · pass {item.passPercent}%</em> : null}
                    </td>
                    <td>{item.correct}</td>
                    <td>{item.wrong}</td>
                    <td>{item.skipped}</td>
                    {penalisesBlank ? <td>{item.unmarked}</td> : null}
                    <td>
                      {item.score} / {item.maxScore}
                    </td>
                    <td>
                      {item.qualifying ? (
                        <span className={`tag ${item.passed ? 'tag--correct' : 'tag--wrong'}`}>{item.passed ? 'Passed' : 'Failed'}</span>
                      ) : (
                        <span className="muted small">Counted</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="series-section">
        <h2 className="series-section__title">Solutions</h2>
        <div className="pill-scroller">
          {filters.map((item) => (
            <button key={item} type="button" className={`pill${filter === item ? ' is-active' : ''}`} onClick={() => setFilter(item)}>
              {FILTER_LABELS[item]} ({counts[item]})
            </button>
          ))}
        </div>

        <div className="solution-list">
          {filtered.map((q) => {
            const number = result.questions.indexOf(q) + 1;
            const chosen = result.answers[String(q.id)];
            const outcome = outcomeOf(q.id, q.correctIndex);
            return (
              <article className={`solution solution--${outcome}`} key={q.id}>
                <div className="solution__head">
                  <span>
                    Q{number}
                    {q.section ? <small className="muted"> · {q.section}</small> : null}
                  </span>
                  <span className={`tag tag--${outcome === 'unmarked' ? 'wrong' : outcome}`}>{FILTER_LABELS[outcome]}</span>
                </div>
                <div className="solution__q">
                  <RichContent text={q.question} image={q.imageUrl} zoomable />
                </div>
                <ul className="solution__options">
                  {q.options.map((option, index) => {
                    const isAnswer = index === q.correctIndex;
                    const isChosen = index === chosen;
                    return (
                      <li key={index} className={isAnswer ? 'is-answer' : isChosen ? 'is-wrong' : ''}>
                        <span className="option__letter">{OPTION_LETTERS[index]}</span>
                        <span>
                          <RichContent text={option} image={q.optionImages?.[index]} />
                        </span>
                        {isAnswer ? <em>Correct answer</em> : isChosen ? <em>Your answer</em> : null}
                      </li>
                    );
                  })}
                </ul>
                {chosen === NOT_ATTEMPTED ? <p className="muted small">You chose “Question not attempted”.</p> : null}
                {outcome === 'unmarked' ? (
                  <p className="form-error small">Left blank — this cost the same as a wrong answer.</p>
                ) : null}
                {q.explanation ? (
                  <div className="solution__explain">
                    <b>Explanation</b>
                    <p>{q.explanation}</p>
                  </div>
                ) : null}
              </article>
            );
          })}
          {filtered.length === 0 ? <p className="empty-note">No questions in this filter.</p> : null}
        </div>
      </section>
    </>
  );
}
