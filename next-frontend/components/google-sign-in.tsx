'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID, loadGoogle, registerGoogleHandler } from '@/lib/google-signin';
import { StudentSession } from '@/lib/types';
import { useStudentSession } from '@/lib/use-student-session';

interface GoogleSignInButtonProps {
  onSuccess: (session: StudentSession) => void;
}

// Google's own rendered button; hidden entirely when no client ID is configured.
export function GoogleSignInButton({ onSuccess }: GoogleSignInButtonProps) {
  const slotRef = useRef<HTMLDivElement>(null);
  const successRef = useRef(onSuccess);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  successRef.current = onSuccess;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const unregister = registerGoogleHandler({
      onSuccess: (session) => successRef.current(session),
      onError: setError,
      onBusy: setBusy
    });

    let cancelled = false;
    loadGoogle()
      .then((google) => {
        const slot = slotRef.current;
        if (cancelled || !slot) return;
        google.renderButton(slot, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'center',
          width: Math.min(Math.max(slot.clientWidth, 200), 400)
        });
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      unregister();
    };
  }, []);

  if (!GOOGLE_CLIENT_ID || failed) return null;

  return (
    <div className="google-signin">
      <div ref={slotRef} className="google-signin__slot" aria-busy={busy} />
      {busy ? <p className="google-signin__note">Signing you in…</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <div className="google-signin__divider">
        <span>or use email</span>
      </div>
    </div>
  );
}

// Pages where a sign-in prompt would get in the way.
const NO_ONE_TAP = ['/admin', '/upload', '/watermark-tool', '/tests/'];

// Site-wide One Tap: offers "Continue as …" to logged-out visitors.
export function GoogleOneTap() {
  const pathname = usePathname() || '/';
  const { ready, isLoggedIn } = useStudentSession();

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !ready || isLoggedIn) return;
    if (NO_ONE_TAP.some((prefix) => pathname.startsWith(prefix))) return;

    let cancelled = false;
    // Let the page settle first so the prompt does not compete with the first paint.
    const timer = window.setTimeout(() => {
      loadGoogle()
        .then((google) => !cancelled && google.prompt())
        .catch(() => undefined);
    }, 1500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.google?.accounts?.id?.cancel();
    };
  }, [ready, isLoggedIn, pathname]);

  return null;
}
