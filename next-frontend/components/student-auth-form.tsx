'use client';

import { FormEvent, useState } from 'react';
import { loginStudent, registerStudent } from '@/lib/student-api';
import { StudentSession } from '@/lib/types';

interface StudentAuthFormProps {
  onSuccess: (session: StudentSession) => void;
  initialMode?: 'register' | 'login';
  heading?: string;
}

export function StudentAuthForm({ onSuccess, initialMode = 'register', heading }: StudentAuthFormProps) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      const session =
        mode === 'register'
          ? await registerStudent({ email: email.trim(), password })
          : await loginStudent({ email: email.trim(), password });
      onSuccess(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-box">
      <div className="auth-box__head">
        <h2>{heading ?? (mode === 'register' ? 'Create your free account' : 'Welcome back')}</h2>
        <p>
          {mode === 'register'
            ? 'Sign up once to attempt tests, see solutions and track your rank.'
            : 'Login with the email and password you registered with.'}
        </p>
      </div>

      <div className="auth-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'register'}
          className={mode === 'register' ? 'is-active' : ''}
          onClick={() => {
            setMode('register');
            setError('');
          }}
        >
          New user
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'login'}
          className={mode === 'login' ? 'is-active' : ''}
          onClick={() => {
            setMode('login');
            setError('');
          }}
        >
          Already registered
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@gmail.com"
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            minLength={mode === 'register' ? 6 : undefined}
            placeholder={mode === 'register' ? 'At least 6 characters' : ''}
            required
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="button button--primary button--block" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'register' ? 'Create account & continue' : 'Login & continue'}
        </button>
      </form>
    </div>
  );
}
