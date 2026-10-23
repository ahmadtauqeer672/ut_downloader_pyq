'use client';

import { useEffect, useState } from 'react';
import { listMyUpdates } from '@/lib/student-api';
import { useStudentSession } from '@/lib/use-student-session';

// Tests this browser has opened (landing page or attempt); they stop counting as "new" for the student.
const OPENED_KEY = 'utpaper.openedTests';
const OPENED_EVENT = 'utpaper-opened-tests';

function readOpened(): number[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(OPENED_KEY) || '[]');
    return Array.isArray(value) ? value.filter((id) => typeof id === 'number') : [];
  } catch {
    return [];
  }
}

export function markTestOpened(testId: number) {
  const opened = readOpened();
  if (opened.includes(testId)) return;
  try {
    window.localStorage.setItem(OPENED_KEY, JSON.stringify([...opened, testId]));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(OPENED_EVENT));
}

/**
 * Ids of tests that are new for the logged-in student: added to a series they practised in,
 * not attempted yet (server side) and not opened in this browser. `null` when nobody is logged in.
 */
export function useMyNewTestIds(): Set<number> | null {
  const { token } = useStudentSession();
  const [serverIds, setServerIds] = useState<number[]>([]);
  const [opened, setOpened] = useState<number[]>([]);

  useEffect(() => {
    const sync = () => setOpened(readOpened());
    sync();
    window.addEventListener(OPENED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(OPENED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setServerIds([]);
      return;
    }
    let cancelled = false;
    listMyUpdates(token)
      .then((rows) => {
        if (!cancelled) setServerIds(rows.flatMap((row) => row.tests.map((test) => test.id)));
      })
      .catch(() => {
        if (!cancelled) setServerIds([]);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) return null;
  return new Set(serverIds.filter((id) => !opened.includes(id)));
}
