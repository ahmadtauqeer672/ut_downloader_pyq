'use client';

import { useEffect, useState } from 'react';
import { AdminSession } from '@/lib/admin-api-client';

const STORAGE_KEY = 'papervault_admin_session';

function readStoredSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed?.token || !parsed?.userId || !parsed?.expiresAt) return null;
    if (Date.now() >= Number(parsed.expiresAt)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function useAdminSession() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readStoredSession());
    setReady(true);

    const handleStorage = () => {
      setSession(readStoredSession());
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const login = (nextSession: AdminSession) => {
    setSession(nextSession);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
  };

  const logout = () => {
    setSession(null);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return {
    ready,
    session,
    isAuthenticated: Boolean(session),
    userId: session?.userId ?? '',
    token: session?.token ?? '',
    login,
    logout
  };
}
