'use client';

// Google Identity Services: the "Sign in with Google" button and One Tap prompt.
// Google allows one initialize() per page, so a single callback signs in with our backend and
// hands the session to whichever screen is waiting for it (the latest registered handler).

import { googleLoginStudent } from '@/lib/student-api';
import { StudentSession } from '@/lib/types';
import { saveStudentSession } from '@/lib/use-student-session';

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleId {
  initialize(config: Record<string, unknown>): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
  prompt(): void;
  cancel(): void;
  disableAutoSelect(): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

export interface GoogleHandler {
  onSuccess: (session: StudentSession) => void;
  onError?: (message: string) => void;
  onBusy?: (busy: boolean) => void;
}

const handlers: GoogleHandler[] = [];
let loader: Promise<GoogleId> | null = null;

async function handleCredential(response: GoogleCredentialResponse) {
  const handler = handlers[handlers.length - 1];
  handler?.onBusy?.(true);
  try {
    const session = await googleLoginStudent(response.credential);
    // Screens that registered a handler store the session themselves (and may navigate after it).
    if (handler) handler.onSuccess(session);
    else saveStudentSession(session);
  } catch (err) {
    handler?.onError?.(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
  } finally {
    handler?.onBusy?.(false);
  }
}

export function loadGoogle(): Promise<GoogleId> {
  if (!GOOGLE_CLIENT_ID) return Promise.reject(new Error('Google sign-in is not configured'));
  if (loader) return loader;

  loader = new Promise<GoogleId>((resolve, reject) => {
    const ready = () => {
      const id = window.google?.accounts?.id;
      if (!id) return reject(new Error('Google sign-in could not load'));
      id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
        auto_select: true,
        cancel_on_tap_outside: true,
        context: 'signin',
        itp_support: true,
        use_fedcm_for_prompt: true
      });
      resolve(id);
    };

    if (window.google?.accounts?.id) return ready();
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = ready;
    script.onerror = () => {
      loader = null;
      reject(new Error('Google sign-in could not load'));
    };
    document.head.appendChild(script);
  });

  return loader;
}

export function registerGoogleHandler(handler: GoogleHandler) {
  handlers.push(handler);
  return () => {
    const index = handlers.lastIndexOf(handler);
    if (index >= 0) handlers.splice(index, 1);
  };
}
