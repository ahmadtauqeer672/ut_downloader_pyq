'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CloseIcon } from '@/components/icons';
import { StudentAuthForm } from '@/components/student-auth-form';
import { TestCard } from '@/components/test-card';
import { MockTest, TestKind } from '@/lib/types';
import { useStudentSession } from '@/lib/use-student-session';

interface TestSeriesTestsProps {
  seriesTitle: string;
  tests: MockTest[];
}

const KIND_LABELS: Record<TestKind, string> = {
  exam: 'Exam Tests',
  subject: 'Subject Tests',
  pyq: 'Previous Year Papers'
};

export function TestSeriesTests({ seriesTitle, tests }: TestSeriesTestsProps) {
  const router = useRouter();
  const { isLoggedIn, login } = useStudentSession();
  const [pendingTest, setPendingTest] = useState<MockTest | null>(null);

  const kinds = (['exam', 'subject', 'pyq'] as TestKind[]).filter((kind) => tests.some((test) => test.kind === kind));
  const [chosenKind, setKind] = useState<TestKind>(kinds[0] ?? 'exam');
  // The chosen tab can be stale after navigating from another series; fall back to a type this series has.
  const kind = kinds.includes(chosenKind) ? chosenKind : kinds[0] ?? 'exam';
  const categories = useMemo(() => {
    const names = tests.filter((test) => test.kind === kind).map((test) => test.category || 'Other tests');
    return [...new Set(names)];
  }, [tests, kind]);
  const [category, setCategory] = useState('');
  const activeCategory = categories.includes(category) ? category : categories[0] ?? '';

  const featured = tests.filter((test) => test.isFeatured);
  const visible = tests.filter((test) => test.kind === kind && (test.category || 'Other tests') === activeCategory);

  useEffect(() => {
    if (!pendingTest) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setPendingTest(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingTest]);

  function handleAttempt(test: MockTest) {
    if (isLoggedIn) {
      router.push(`/tests/${test.id}`);
      return;
    }
    setPendingTest(test);
  }

  if (tests.length === 0) {
    return (
      <section className="panel">
        <p className="empty-note">Tests for this series are being prepared. Please check back soon.</p>
      </section>
    );
  }

  return (
    <>
      {featured.length > 0 ? (
        <section className="series-section">
          <h2 className="series-section__title">{seriesTitle} (Free)</h2>
          <div className="test-list">
            {featured.map((test) => (
              <TestCard key={test.id} test={test} variant="featured" onAttempt={handleAttempt} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="series-section">
        <h2 className="series-section__title">{seriesTitle}</h2>

        {kinds.length > 1 ? (
          <div className="tabs" role="tablist">
            {kinds.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={kind === item}
                className={kind === item ? 'is-active' : ''}
                onClick={() => {
                  setKind(item);
                  setCategory('');
                }}
              >
                {KIND_LABELS[item]}
              </button>
            ))}
          </div>
        ) : null}

        {categories.length > 1 ? (
          <div className="pill-scroller">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={`pill${item === activeCategory ? ' is-active' : ''}`}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}

        <div className="test-list">
          {visible.map((test) => (
            <TestCard key={test.id} test={test} onAttempt={handleAttempt} />
          ))}
        </div>
      </section>

      {pendingTest ? (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Login to attempt test">
          <button className="modal__backdrop" type="button" aria-label="Close" onClick={() => setPendingTest(null)} />
          <div className="modal__card">
            <button className="modal__close" type="button" aria-label="Close" onClick={() => setPendingTest(null)}>
              <CloseIcon />
            </button>
            <p className="modal__context">
              To attempt <strong>{pendingTest.title}</strong>
            </p>
            <StudentAuthForm
              onSuccess={(session) => {
                login(session);
                router.push(`/tests/${pendingTest.id}`);
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
