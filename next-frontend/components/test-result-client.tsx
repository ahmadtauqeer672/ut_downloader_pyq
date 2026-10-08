'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RichContent } from '@/components/rich-content';
import { StudentAuthForm } from '@/components/student-auth-form';
import { ApiError, getAttemptResult } from '@/lib/student-api';
import { AttemptResult } from '@/lib/types';
import { useStudentSession } from '@/lib/use-student-session';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
type Filter = 'all' | 'correct' | 'wrong' | 'skipped';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function TestResultClient({ attemptId }: { attemptId: number }) {
  const { ready, token, login, logout } = useStudentSession();
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

  const outcomeOf = (questionId: number, correctIndex?: number) => {
    const chosen = result.answers[String(questionId)];
    if (chosen === undefined) return 'skipped';
    return chosen === correctIndex ? 'correct' : 'wrong';
  };
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
            <span>of {result.maxScore}</span>
          </div>
        </div>
      </section>

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
          <span>Skipped</span>
        </div>
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

      <section className="series-section">
        <h2 className="series-section__title">Solutions</h2>
        <div className="pill-scroller">
          {(['all', 'correct', 'wrong', 'skipped'] as Filter[]).map((item) => (
            <button key={item} type="button" className={`pill${filter === item ? ' is-active' : ''}`} onClick={() => setFilter(item)}>
              {item === 'all' ? `All (${result.total})` : `${item[0].toUpperCase()}${item.slice(1)} (${result[item]})`}
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
                  <span>Q{number}</span>
                  <span className={`tag tag--${outcome}`}>
                    {outcome === 'correct' ? 'Correct' : outcome === 'wrong' ? 'Wrong' : 'Not attempted'}
                  </span>
                </div>
                <div className="solution__q">
                  <RichContent text={q.question} image={q.imageUrl} />
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
