import { Injectable, computed, signal } from '@angular/core';

interface StoredAdminSession {
  token: string;
  userId: string;
  expiresAt: number;
}

const STORAGE_KEY = 'papervault_admin_session';

@Injectable({ providedIn: 'root' })
export class AdminSessionService {
  private readonly session = signal<StoredAdminSession | null>(this.readStoredSession());
  readonly isAuthenticated = computed(() => Boolean(this.validSession()));
  readonly userId = computed(() => this.validSession()?.userId || '');

  login(session: StoredAdminSession): void {
    this.session.set(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  logout(): void {
    this.session.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  authToken(): string {
    return this.validSession()?.token || '';
  }

  private validSession(): StoredAdminSession | null {
    const current = this.session();
    if (!current) return null;
    if (!current.token || !current.userId || !current.expiresAt) {
      this.logout();
      return null;
    }
    if (Date.now() >= Number(current.expiresAt)) {
      this.logout();
      return null;
    }
    return current;
  }

  private readStoredSession(): StoredAdminSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredAdminSession;
      if (!parsed?.token || !parsed?.userId || !parsed?.expiresAt) return null;
      if (Date.now() >= Number(parsed.expiresAt)) return null;
      return parsed;
    } catch (_error) {
      return null;
    }
  }
}
