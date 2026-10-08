'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { StudentAuthForm } from '@/components/student-auth-form';
import { ApiError, listMyAttempts } from '@/lib/student-api';
import { AttemptSummary } from '@/lib/types';
import { useStudentSession } from '@/lib/use-student-session';

export function MyTestsClient() {
  const { ready, token, student, login, logout } = useStudentSession();
  const [attempts, setAttempts] = useState<AttemptSummary[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setAttempts(null);
      return;
    }
    listMyAttempts(token)
      .then(setAttempts)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
        else setError(err instanceof Error ? err.message : 'Could not load your tests.');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!ready) return <section className="panel narrow">Loading…</section>;

  if (!student) {
    return (
      <div className="auth-page">
        <section className="panel">
          <StudentAuthForm initialMode="login" onSuccess={login} />
        </section>
      </div>
    );
  }

  const submitted = (attempts ?? []).filter((a) => a.submittedAt);
  const inProgress = (attempts ?? []).filter((a) => !a.submittedAt);

  return (
    <>
      <section className="page-intro page-intro--row">
        <div>
          <h1>Hi, {student.name.split(' ')[0]}</h1>
          <p>{student.email}</p>
        </div>
        <div className="button-row">
          <Link className="button button--primary" href="/test-series">
            Find a test
          </Link>
          <button className="button button--outline" type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      {attempts === null && !error ? <section className="panel">Loading your tests…</section> : null}

      {inProgress.length > 0 ? (
        <section className="series-section">
          <h2 className="series-section__title">Continue where you left off</h2>
          <div className="test-list">
            {inProgress.map((a) => (
              <article className="test-card" key={a.id}>
                <div className="test-card__body">
                  <h3 className="test-card__title test-card__title--sm">{a.testTitle}</h3>
                  <p className="test-card__dots">
                    <span>{a.seriesTitle}</span>
                    <span>Started {new Date(a.startedAt).toLocaleDateString('en-IN')}</span>
                  </p>
                </div>
                <Link className="button button--outline button--sm test-card__action" href={`/tests/${a.testId}`}>
                  Resume
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {attempts !== null ? (
        <section className="series-section">
          <h2 className="series-section__title">Attempted tests</h2>
          {submitted.length > 0 ? (
            <div className="test-list">
              {submitted.map((a) => (
                <article className="test-card" key={a.id}>
                  <div className="test-card__body">
                    <h3 className="test-card__title test-card__title--sm">{a.testTitle}</h3>
                    <p className="test-card__dots">
                      <span>
                        Score {a.score}/{a.maxScore}
                      </span>
                      <span>
                        {a.correct} correct · {a.wrong} wrong
                      </span>
                      <span>{new Date(a.submittedAt as string).toLocaleDateString('en-IN')}</span>
                    </p>
                  </div>
                  <Link className="button button--outline button--sm test-card__action" href={`/results/${a.id}`}>
                    View result
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <section className="panel">
              <p className="empty-note">
                You have not attempted any test yet. <Link href="/test-series">Start with a free mock test →</Link>
              </p>
            </section>
          )}
        </section>
      ) : null}
    </>
  );
}
