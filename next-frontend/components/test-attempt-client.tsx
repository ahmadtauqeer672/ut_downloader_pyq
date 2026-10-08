'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ClockIcon, LanguageIcon, MarksIcon, QuestionIcon } from '@/components/icons';
import { RichContent } from '@/components/rich-content';
import { StudentAuthForm } from '@/components/student-auth-form';
import { formatMarks } from '@/components/test-card';
import { ApiError, getTest, saveAnswers, startAttempt, submitAttempt } from '@/lib/student-api';
import { AttemptStart, MockTest } from '@/lib/types';
import { useStudentSession } from '@/lib/use-student-session';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function formatClock(totalSeconds: number) {
  const safe = Math.max(totalSeconds, 0);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function TestAttemptClient({ testId }: { testId: number }) {
  const router = useRouter();
  const { ready, token, student, login, logout } = useStudentSession();
  const [test, setTest] = useState<MockTest | null>(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState<AttemptStart | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');

  useEffect(() => {
    getTest(testId)
      .then(setTest)
      .catch((err) => setLoadError(err instanceof ApiError && err.status === 404 ? 'This test is not available.' : 'Could not load the test. Please refresh.'));
  }, [testId]);

  async function handleStart() {
    setStarting(true);
    setStartError('');
    try {
      setAttempt(await startAttempt(testId, token));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
      } else {
        setStartError(err instanceof Error ? err.message : 'Could not start the test.');
      }
    } finally {
      setStarting(false);
    }
  }

  if (loadError) {
    return (
      <section className="panel narrow">
        <h1 className="panel__title">{loadError}</h1>
        <Link className="button button--primary" href="/test-series">
          Browse test series
        </Link>
      </section>
    );
  }

  if (!test || !ready) {
    return <section className="panel narrow">Loading test…</section>;
  }

  if (attempt) {
    return (
      <ExamScreen
        attempt={attempt}
        token={token}
        onSubmitted={(id) => router.replace(`/results/${id}`)}
        onSessionExpired={logout}
      />
    );
  }

  return (
    <div className="instructions-layout">
      <section className="panel">
        {test.seriesSlug ? (
          <Link className="back-link" href={`/test-series/${test.seriesSlug}`}>
            ← {test.seriesTitle}
          </Link>
        ) : null}
        <h1 className="panel__title">{test.title}</h1>

        <ul className="instruction-facts">
          <li>
            <QuestionIcon /> <b>{test.questionCount}</b> questions
          </li>
          <li>
            <MarksIcon /> <b>{test.questionCount * test.marksPerQuestion}</b> marks
          </li>
          <li>
            <ClockIcon /> <b>{test.durationMinutes}</b> minutes
          </li>
          <li>
            <LanguageIcon /> {test.language}
          </li>
        </ul>

        <h2 className="panel__sub">Instructions</h2>
        <ol className="instruction-list">
          <li>
            Each correct answer gives <b>+{test.marksPerQuestion}</b> mark{test.marksPerQuestion === 1 ? '' : 's'}.
            {test.negativeMarks > 0 ? (
              <>
                {' '}
                Each wrong answer deducts <b>{formatMarks(test.negativeMarks)}</b>.
              </>
            ) : (
              ' There is no negative marking.'
            )}
          </li>
          <li>The timer starts when you click Start test. The test submits automatically when time runs out.</li>
          <li>Your answers are saved as you go. If the page closes, open the test again to continue.</li>
          <li>Use “Mark for review” for questions you want to revisit before submitting.</li>
          <li>After submitting you will see your score, rank and the solution to every question.</li>
        </ol>

        {student ? (
          <div className="start-row">
            <p className="muted">
              Attempting as <b>{student.name}</b> ({student.email})
            </p>
            {startError ? <p className="form-error">{startError}</p> : null}
            <button className="button button--primary button--lg" type="button" onClick={handleStart} disabled={starting}>
              {starting ? 'Starting…' : 'Start test'}
            </button>
          </div>
        ) : null}
      </section>

      {!student ? (
        <section className="panel">
          <StudentAuthForm heading="Login to start this test" onSuccess={login} />
        </section>
      ) : null}
    </div>
  );
}

interface ExamScreenProps {
  attempt: AttemptStart;
  token: string;
  onSubmitted: (attemptId: number) => void;
  onSessionExpired: () => void;
}

function ExamScreen({ attempt, token, onSubmitted, onSessionExpired }: ExamScreenProps) {
  const { test, questions } = attempt;
  const [answers, setAnswers] = useState<Record<string, number>>(attempt.answers ?? {});
  const [current, setCurrent] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(() => new Set([questions[0]?.id]));
  const [marked, setMarked] = useState<Set<number>>(() => new Set());
  const [remaining, setRemaining] = useState(attempt.remainingSeconds);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const answersRef = useRef(answers);
  const submittedRef = useRef(false);
  const deadline = useRef(Date.now() + attempt.remainingSeconds * 1000);
  // Parent callbacks change every render; read them through refs so the timer effect stays stable.
  const callbacks = useRef({ onSubmitted, onSessionExpired });
  callbacks.current = { onSubmitted, onSessionExpired };

  answersRef.current = answers;
  const question = questions[current];

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await submitAttempt(attempt.attemptId, answersRef.current, token);
      callbacks.current.onSubmitted(result.attemptId);
    } catch (err) {
      submittedRef.current = false;
      setSubmitting(false);
      if (err instanceof ApiError && err.status === 401) {
        callbacks.current.onSessionExpired();
        return;
      }
      setSubmitError(err instanceof Error ? err.message : 'Could not submit. Please try again.');
      setConfirming(true);
    }
  }, [attempt.attemptId, token]);

  // Countdown based on a fixed deadline so a sleeping tab does not drift.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const left = Math.round((deadline.current - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0) {
        window.clearInterval(timer);
        void submit();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [submit]);

  // Save answers shortly after each change so the attempt can be resumed.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (!submittedRef.current) saveAnswers(attempt.attemptId, answers, token).catch(() => undefined);
    }, 800);
    return () => window.clearTimeout(handle);
  }, [answers, attempt.attemptId, token]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!submittedRef.current) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  function goTo(index: number) {
    const next = Math.min(Math.max(index, 0), questions.length - 1);
    setCurrent(next);
    setVisited((prev) => new Set(prev).add(questions[next].id));
    setPaletteOpen(false);
  }

  function choose(optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [String(question.id)]: optionIndex }));
  }

  function clearChoice() {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[String(question.id)];
      return next;
    });
  }

  function toggleMark() {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(question.id)) next.delete(question.id);
      else next.add(question.id);
      return next;
    });
    if (current < questions.length - 1) goTo(current + 1);
  }

  const answeredCount = questions.filter((q) => answers[String(q.id)] !== undefined).length;
  const markedCount = questions.filter((q) => marked.has(q.id)).length;
  const notVisitedCount = questions.filter((q) => !visited.has(q.id)).length;
  const skippedCount = questions.filter((q) => visited.has(q.id) && !marked.has(q.id) && answers[String(q.id)] === undefined).length;
  const chosen = answers[String(question.id)];

  function statusOf(id: number) {
    const isAnswered = answers[String(id)] !== undefined;
    if (marked.has(id)) return isAnswered ? 'marked-answered' : 'marked';
    if (isAnswered) return 'answered';
    if (visited.has(id)) return 'skipped';
    return 'fresh';
  }

  return (
    <div className="exam">
      <header className="exam__bar">
        <div className="exam__title">
          <strong>{test.title}</strong>
          <span>
            {answeredCount}/{questions.length} answered
          </span>
        </div>
        <div className={`exam__timer${remaining <= 60 ? ' is-low' : ''}`} aria-live="off">
          <ClockIcon /> {formatClock(remaining)}
        </div>
        <button className="button button--primary button--sm" type="button" onClick={() => setConfirming(true)} disabled={submitting}>
          Submit
        </button>
      </header>

      <div className="exam__body">
        <section className="exam__question">
          <div className="exam__qhead">
            <span>
              Question {current + 1} of {questions.length}
            </span>
            <span className="exam__marking">
              +{test.marksPerQuestion}
              {test.negativeMarks > 0 ? ` / -${formatMarks(test.negativeMarks)}` : ''}
            </span>
            <button className="exam__palette-toggle" type="button" onClick={() => setPaletteOpen((open) => !open)}>
              All questions
            </button>
          </div>

          <div className="exam__qtext">
            <RichContent text={question.question} image={question.imageUrl} />
          </div>

          <div className="options" role="radiogroup" aria-label={`Question ${current + 1} options`}>
            {question.options.map((option, index) => (
              <button
                key={index}
                type="button"
                role="radio"
                aria-checked={chosen === index}
                className={`option${chosen === index ? ' is-chosen' : ''}`}
                onClick={() => choose(index)}
              >
                <span className="option__letter">{OPTION_LETTERS[index]}</span>
                <span className="option__text">
                  <RichContent text={option} image={question.optionImages?.[index]} />
                </span>
              </button>
            ))}
          </div>

          <div className="exam__actions">
            <button className="button button--ghost" type="button" onClick={toggleMark}>
              {marked.has(question.id) ? 'Unmark review' : 'Mark for review'}
            </button>
            <button className="button button--ghost" type="button" onClick={clearChoice} disabled={chosen === undefined}>
              Clear
            </button>
            <span className="exam__spacer" />
            <button className="button button--outline" type="button" onClick={() => goTo(current - 1)} disabled={current === 0}>
              Previous
            </button>
            {current < questions.length - 1 ? (
              <button className="button button--primary" type="button" onClick={() => goTo(current + 1)}>
                Save &amp; next
              </button>
            ) : (
              <button className="button button--primary" type="button" onClick={() => setConfirming(true)}>
                Finish test
              </button>
            )}
          </div>
        </section>

        <aside className={`exam__palette${paletteOpen ? ' is-open' : ''}`}>
          <ul className="palette-legend">
            <li>
              <i className="dot dot--answered" /> Answered <b>{answeredCount}</b>
            </li>
            <li>
              <i className="dot dot--skipped" /> Not answered <b>{skippedCount}</b>
            </li>
            <li>
              <i className="dot dot--marked" /> Marked <b>{markedCount}</b>
            </li>
            <li>
              <i className="dot dot--fresh" /> Not visited <b>{notVisitedCount}</b>
            </li>
          </ul>
          <div className="palette-grid">
            {questions.map((q, index) => (
              <button
                key={q.id}
                type="button"
                className={`palette-cell palette-cell--${statusOf(q.id)}${index === current ? ' is-current' : ''}`}
                onClick={() => goTo(index)}
                aria-label={`Question ${index + 1}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <button className="button button--primary button--block" type="button" onClick={() => setConfirming(true)}>
            Submit test
          </button>
        </aside>
      </div>

      {confirming ? (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Submit test">
          <button className="modal__backdrop" type="button" aria-label="Close" onClick={() => !submitting && setConfirming(false)} />
          <div className="modal__card modal__card--sm">
            <h2 className="panel__title">Submit test?</h2>
            <div className="submit-summary">
              <div>
                <strong>{answeredCount}</strong>
                <span>Answered</span>
              </div>
              <div>
                <strong>{questions.length - answeredCount}</strong>
                <span>Not answered</span>
              </div>
              <div>
                <strong>{markedCount}</strong>
                <span>Marked</span>
              </div>
            </div>
            <p className="muted">Time left: {formatClock(remaining)}. You cannot change answers after submitting.</p>
            {submitError ? <p className="form-error">{submitError}</p> : null}
            <div className="modal__actions">
              <button className="button button--outline" type="button" onClick={() => setConfirming(false)} disabled={submitting}>
                Keep going
              </button>
              <button className="button button--primary" type="button" onClick={() => void submit()} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Yes, submit'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
