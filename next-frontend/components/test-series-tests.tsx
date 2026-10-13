'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronIcon, CloseIcon, LanguageIcon, TestsIcon, UsersIcon } from '@/components/icons';
import { StudentAuthForm } from '@/components/student-auth-form';
import { TestCard } from '@/components/test-card';
import { MockTest, TestKind, TestSeriesDetail } from '@/lib/types';
import { useStudentSession } from '@/lib/use-student-session';

const KIND_LABELS: Record<TestKind, string> = {
  exam: 'Full Mock Tests',
  subject: 'Subject Tests',
  pyq: 'Previous Year Papers'
};
const KIND_ORDER: TestKind[] = ['exam', 'subject', 'pyq'];

// A test's group is its admin-set category, or its type when no category was given.
function groupOf(test: MockTest) {
  return test.category?.trim() || KIND_LABELS[test.kind];
}

function formatCount(value: number) {
  return value.toLocaleString('en-IN');
}

function formatUpdated(tests: MockTest[]) {
  const latest = Math.max(...tests.map((test) => new Date(test.createdAt).getTime()).filter(Number.isFinite));
  if (!Number.isFinite(latest)) return '';
  return new Date(latest).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function languagesOf(tests: MockTest[]) {
  const seen = new Map<string, string>();
  for (const test of tests) {
    for (const part of (test.language || '').split(/[,/+&]| and /i)) {
      const name = part.trim();
      if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
    }
  }
  return [...seen.values()];
}

export function TestSeriesTests({ series }: { series: TestSeriesDetail }) {
  const router = useRouter();
  const { ready, student, isLoggedIn, login } = useStudentSession();
  const [pendingTest, setPendingTest] = useState<MockTest | null>(null);
  const [query, setQuery] = useState('');
  const [chosenGroup, setGroup] = useState('');
  const [chosenKind, setKind] = useState<TestKind | 'all'>('all');
  const listRef = useRef<HTMLElement>(null);

  const tests = useMemo(
    () => [...series.tests].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder || a.id - b.id),
    [series.tests]
  );

  const groups = useMemo(() => {
    const counts = new Map<string, number>();
    for (const test of tests) counts.set(groupOf(test), (counts.get(groupOf(test)) ?? 0) + 1);
    return [...counts.entries()];
  }, [tests]);

  const totalAttempts = tests.reduce((sum, test) => sum + test.attemptCount, 0);
  const languages = languagesOf(tests);
  const updated = formatUpdated(tests);
  const firstTest = tests[0];

  const q = query.trim().toLowerCase();
  // While searching, look across every group; otherwise show the chosen tab.
  const activeGroup = groups.some(([name]) => name === chosenGroup) ? chosenGroup : groups[0]?.[0] ?? '';
  const groupTests = q ? tests : tests.filter((test) => groupOf(test) === activeGroup);
  const kindsInGroup = KIND_ORDER.filter((kind) => groupTests.some((test) => test.kind === kind));
  const activeKind = chosenKind !== 'all' && kindsInGroup.includes(chosenKind) ? chosenKind : 'all';
  const visible = groupTests.filter((test) => {
    if (activeKind !== 'all' && test.kind !== activeKind) return false;
    return !q || test.title.toLowerCase().includes(q) || groupOf(test).toLowerCase().includes(q);
  });

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

  function openGroup(name: string) {
    setGroup(name);
    setKind('all');
    setQuery('');
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <section className="sd-hero">
        <div className="sd-hero__main">
          <nav className="sd-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <ChevronIcon className="icon icon--sm" />
            <Link href="/test-series">Test Series</Link>
            <ChevronIcon className="icon icon--sm" />
            <span aria-current="page">{series.examName || 'Mock Tests'}</span>
          </nav>

          <div className="sd-hero__title">
            {series.logoUrl ? (
              <span className="sd-hero__logo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={series.logoUrl} alt={`${series.examName || series.title} logo`} />
              </span>
            ) : null}
            <div>
              {series.category ? <span className="sd-hero__eyebrow">{series.category}</span> : null}
              <h1>{series.title}</h1>
            </div>
          </div>

          {series.description ? <p className="sd-hero__lede">{series.description}</p> : null}

          <ul className="sd-hero__facts">
            <li>
              <TestsIcon className="icon icon--sm" /> {formatCount(tests.length)} {tests.length === 1 ? 'test' : 'tests'}
              {tests.length > 0 ? <span className="sd-free">All Free</span> : null}
            </li>
            {totalAttempts > 0 ? (
              <li>
                <UsersIcon className="icon icon--sm" /> {formatCount(totalAttempts)} attempts
              </li>
            ) : null}
            {languages.length > 0 ? (
              <li>
                <LanguageIcon className="icon icon--sm" /> {languages.join(', ')}
              </li>
            ) : null}
          </ul>

          {groups.length > 0 ? (
            <div className="sd-inside">
              <h2>What&apos;s inside</h2>
              <div className="sd-inside__grid">
                {groups.map(([name, count]) => (
                  <button key={name} type="button" className="sd-inside__tile" onClick={() => openGroup(name)}>
                    <strong>{count}</strong>
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {updated ? <p className="sd-hero__updated">Last updated on {updated}</p> : null}
        </div>

        <aside className="sd-cta">
          <span className="sd-cta__badge">100% Free</span>
          <h2>{ready && student ? `Ready, ${student.name.trim().split(/\s+/)[0]}?` : 'Start your preparation today'}</h2>
          <ul>
            <li>Real exam pattern &amp; timer</li>
            <li>Instant score and all-India rank</li>
            <li>Detailed solutions for every question</li>
          </ul>
          {firstTest ? (
            <button className="sd-cta__button" type="button" onClick={() => handleAttempt(firstTest)}>
              {ready && student ? 'Start first test' : 'Sign up & take free test'}
            </button>
          ) : null}
          {ready && student ? (
            <Link className="sd-cta__link" href="/my-tests">
              View my attempts
            </Link>
          ) : null}
        </aside>
      </section>

      {tests.length === 0 ? (
        <section className="panel">
          <p className="empty-note">Tests for this series are being prepared. Please check back soon.</p>
        </section>
      ) : (
        <section className="sd-list" ref={listRef}>
          <label className="sd-search">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tests in this series"
              aria-label="Search tests"
            />
          </label>

          {!q && groups.length > 1 ? (
            <div className="sd-tabs" role="tablist" aria-label="Test groups">
              {groups.map(([name, count]) => (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  aria-selected={name === activeGroup}
                  className={name === activeGroup ? 'is-active' : undefined}
                  onClick={() => {
                    setGroup(name);
                    setKind('all');
                  }}
                >
                  {name} <span>{count}</span>
                </button>
              ))}
            </div>
          ) : null}

          {kindsInGroup.length > 1 ? (
            <div className="sd-subtabs">
              {(['all', ...kindsInGroup] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className={kind === activeKind ? 'is-active' : undefined}
                  onClick={() => setKind(kind)}
                >
                  {kind === 'all' ? 'All' : KIND_LABELS[kind]} (
                  {kind === 'all' ? groupTests.length : groupTests.filter((test) => test.kind === kind).length})
                </button>
              ))}
            </div>
          ) : null}

          {q ? (
            <p className="sd-list__note">
              {visible.length} {visible.length === 1 ? 'test' : 'tests'} found for “{query.trim()}”
            </p>
          ) : null}

          {visible.length === 0 ? (
            <p className="empty-note">
              No test matches your search.{' '}
              <button className="text-link" type="button" onClick={() => setQuery('')}>
                Clear search
              </button>
            </p>
          ) : (
            <div className="sd-grid">
              {visible.map((test, index) => (
                <TestCard key={test.id} test={test} index={index + 1} onAttempt={handleAttempt} />
              ))}
            </div>
          )}
        </section>
      )}

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
