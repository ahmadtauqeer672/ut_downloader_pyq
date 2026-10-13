'use client';

import { useEffect, useState } from 'react';
import { StudentSession } from '@/lib/types';

const STORAGE_KEY = 'utpaper_student_session';
const CHANGE_EVENT = 'utpaper-student-session';

function readStoredSession(): StudentSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudentSession;
    if (!parsed?.token || !parsed?.student || Date.now() >= Number(parsed.expiresAt)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// Stores a session and tells every useStudentSession() on the page (and other tabs) about it.
// Usable outside React, e.g. from the Google One Tap callback.
export function saveStudentSession(next: StudentSession) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable in private mode; the in-memory session still works for this page.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useStudentSession() {
  const [session, setSession] = useState<StudentSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readStoredSession());
    setReady(true);

    // Keep header, test pages and other tabs in sync after login/logout.
    const sync = () => setSession(readStoredSession());
    window.addEventListener('storage', sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  const login = (next: StudentSession) => {
    saveStudentSession(next);
    setSession(next);
  };

  const logout = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    // Stop Google One Tap from signing the same account straight back in.
    window.google?.accounts?.id?.disableAutoSelect();
    setSession(null);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return {
    ready,
    session,
    token: session?.token ?? '',
    student: session?.student ?? null,
    isLoggedIn: Boolean(session),
    login,
    logout
  };
}
