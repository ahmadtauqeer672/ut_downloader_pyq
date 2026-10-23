'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { listMyUpdates } from '@/lib/student-api';
import { SeriesUpdate } from '@/lib/types';
import { useStudentSession } from '@/lib/use-student-session';

// Tests the student has opened through the notice: never announced again.
const SEEN_KEY = 'utpaper.dismissedUpdates';
// Per login (browser session): when the notice first showed and whether it was closed.
const VISIT_KEY = 'utpaper.updatesVisit';
const SHOW_FOR_MS = 30_000;

interface Visit {
  login: string;
  shownAt: number | null;
  closed: boolean;
}

function readSeen(): number[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(SEEN_KEY) || '[]');
    return Array.isArray(value) ? value.filter((id) => typeof id === 'number') : [];
  } catch {
    return [];
  }
}

function readVisit(login: string): Visit {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(VISIT_KEY) || 'null') as Visit | null;
    if (value && value.login === login) return value;
  } catch {
    // ignore
  }
  return { login, shownAt: null, closed: false };
}

function saveVisit(visit: Visit) {
  try {
    window.sessionStorage.setItem(VISIT_KEY, JSON.stringify(visit));
  } catch {
    // ignore
  }
}

// Tells a returning student that new tests were added to a series they have already practised in.
// It shows for 30 seconds after each login, and stops for good once the student opens the tests.
export function StudentUpdatesBanner() {
  const pathname = usePathname() || '/';
  const { token } = useStudentSession();
  const [updates, setUpdates] = useState<SeriesUpdate[]>([]);
  const [seen, setSeen] = useState<number[]>([]);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    setSeen(readSeen());
    setExpired(false);
    if (!token) {
      setUpdates([]);
      setVisit(null);
      return;
    }
    // A new token means a new login, which earns a fresh 30 seconds.
    setVisit(readVisit(token.slice(-24)));
    let cancelled = false;
    listMyUpdates(token)
      .then((rows) => {
        if (!cancelled) setUpdates(rows);
      })
      .catch(() => {
        if (!cancelled) setUpdates([]);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const visible = updates
    .map((u) => ({ ...u, tests: u.tests.filter((t) => !seen.includes(t.id)) }))
    .filter((u) => u.tests.length > 0);
  const hasNotice = visible.length > 0 && visit !== null && !visit.closed;

  // Start the 30-second window the first time the notice appears in this login, then hide it.
  useEffect(() => {
    if (!hasNotice || !visit) return;
    const shownAt = visit.shownAt ?? Date.now();
    if (visit.shownAt === null) {
      const next = { ...visit, shownAt };
      saveVisit(next);
      setVisit(next);
      return;
    }
    const left = shownAt + SHOW_FOR_MS - Date.now();
    if (left <= 0) {
      setExpired(true);
      return;
    }
    const timer = window.setTimeout(() => setExpired(true), left);
    return () => window.clearTimeout(timer);
  }, [hasNotice, visit]);

  // Stay out of the way while a test is being taken and inside the admin panel.
  if (pathname.startsWith('/tests/') || pathname.startsWith('/admin')) return null;
  if (!hasNotice || expired || !visit) return null;

  const markSeen = (update: SeriesUpdate) => {
    const next = Array.from(new Set([...seen, ...update.tests.map((t) => t.id)]));
    setSeen(next);
    try {
      window.localStorage.setItem(SEEN_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const close = () => {
    const next = { ...visit, closed: true };
    saveVisit(next);
    setVisit(next);
  };

  // One short notice at a time (most recent series first).
  const u = visible[0];
  return (
    <div className="updates-banner" role="status">
      <span className="updates-banner__badge">New</span>
      <p className="updates-banner__text">
        <b>{u.tests.length === 1 ? '1 new test' : `${u.tests.length} new tests`}</b> in {u.seriesTitle}
      </p>
      <Link className="updates-banner__link" href={`/test-series/${u.seriesSlug}`} onClick={() => markSeen(u)}>
        View
      </Link>
      <button className="updates-banner__close" type="button" aria-label="Hide for now" onClick={close}>
        ×
      </button>
    </div>
  );
}
