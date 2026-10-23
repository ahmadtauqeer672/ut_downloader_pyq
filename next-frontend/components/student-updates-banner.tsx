'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { listMyUpdates } from '@/lib/student-api';
import { SeriesUpdate } from '@/lib/types';
import { useStudentSession } from '@/lib/use-student-session';

const DISMISSED_KEY = 'utpaper.dismissedUpdates';

function readDismissed(): number[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(DISMISSED_KEY) || '[]');
    return Array.isArray(value) ? value.filter((id) => typeof id === 'number') : [];
  } catch {
    return [];
  }
}

// Tells a returning student that new tests were added to a series they have already practised in.
export function StudentUpdatesBanner() {
  const pathname = usePathname() || '/';
  const { token } = useStudentSession();
  const [updates, setUpdates] = useState<SeriesUpdate[]>([]);
  const [dismissed, setDismissed] = useState<number[]>([]);

  useEffect(() => {
    setDismissed(readDismissed());
    if (!token) {
      setUpdates([]);
      return;
    }
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

  // Stay out of the way while a test is being taken and inside the admin panel.
  if (pathname.startsWith('/tests/') || pathname.startsWith('/admin')) return null;

  const visible = updates
    .map((u) => ({ ...u, tests: u.tests.filter((t) => !dismissed.includes(t.id)) }))
    .filter((u) => u.tests.length > 0);
  if (!visible.length) return null;

  const dismiss = (update: SeriesUpdate) => {
    const next = Array.from(new Set([...dismissed, ...update.tests.map((t) => t.id)]));
    setDismissed(next);
    try {
      window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  // One short notice at a time (most recent series first); the next one shows after this is dismissed.
  const u = visible[0];
  return (
    <div className="updates-banner" role="status">
      <span className="updates-banner__badge">New</span>
      <p className="updates-banner__text">
        <b>{u.tests.length === 1 ? '1 new test' : `${u.tests.length} new tests`}</b> in {u.seriesTitle}
      </p>
      <Link className="updates-banner__link" href={`/test-series/${u.seriesSlug}`} onClick={() => dismiss(u)}>
        View
      </Link>
      <button className="updates-banner__close" type="button" aria-label="Dismiss" onClick={() => dismiss(u)}>
        ×
      </button>
    </div>
  );
}
