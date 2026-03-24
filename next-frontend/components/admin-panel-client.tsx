'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { loginAdmin } from '@/lib/admin-api-client';
import { useAdminSession } from '@/lib/use-admin-session';

export function AdminPanelClient() {
  const { ready, isAuthenticated, userId, login, logout } = useAdminSession();
  const [formUserId, setFormUserId] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    try {
      const session = await loginAdmin(formUserId.trim(), password);
      login(session);
      setFormUserId('');
      setPassword('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <section className="card admin-card">
        <p className="muted-copy">Checking admin session...</p>
      </section>
    );
  }

  return (
    <>
      <section className="card admin-hero">
        <p className="eyebrow">Admin access</p>
        <h1 className="section-title">Admin Panel</h1>
        <p className="hero__lede">
          Login to manage uploads, edit papers, delete papers, and use the PDF watermark tool from the Next.js admin
          workspace.
        </p>
      </section>

      {!isAuthenticated ? (
        <section className="card admin-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Sign in</p>
              <h2 className="section-title">Admin login</h2>
            </div>
          </div>

          <form className="admin-form-grid" onSubmit={handleSubmit}>
            <label className="filter-field">
              <span>User ID</span>
              <input value={formUserId} onChange={(event) => setFormUserId(event.target.value)} required />
            </label>

            <label className="filter-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            <button className="button button--primary admin-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Login'}
            </button>
          </form>

          {message ? <p className="status-message status-error">{message}</p> : null}
        </section>
      ) : (
        <section className="card admin-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Welcome back</p>
              <h2 className="section-title">Hello, {userId}</h2>
              <p className="muted-copy">You are logged in and can now manage papers or open the watermark tool.</p>
            </div>
            <button className="button button--secondary" type="button" onClick={logout}>
              Logout
            </button>
          </div>

          <div className="admin-action-grid">
            <Link className="admin-action-card" href="/upload">
              <strong>Manage Papers</strong>
              <span>Upload, edit, and delete academic and competitive papers.</span>
            </Link>

            <Link className="admin-action-card" href="/watermark-tool">
              <strong>Add Watermark in PYQ</strong>
              <span>Upload a PDF, watermark it in the browser, and download the result instantly.</span>
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
