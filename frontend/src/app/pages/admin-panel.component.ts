import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AdminSessionService } from '../services/admin-session.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="hero-card">
      <div>
        <p class="eyebrow">Admin Access</p>
        <h2>Admin Panel</h2>
        <p class="sub">Login to manage uploads, edit papers, delete papers, and use the watermark tool.</p>
      </div>
    </section>

    <section class="panel-card" *ngIf="!adminSession.isAuthenticated(); else adminDashboard">
      <h3>Admin Login</h3>
      <form class="login-grid" (submit)="login($event)">
        <input [(ngModel)]="userId" name="userId" placeholder="User ID" required />
        <input [(ngModel)]="password" name="password" type="password" placeholder="Password" required />
        <button type="submit" [disabled]="isSubmitting">{{ isSubmitting ? 'Signing in...' : 'Login' }}</button>
      </form>
      <p *ngIf="message" class="message error">{{ message }}</p>
    </section>

    <ng-template #adminDashboard>
      <section class="panel-card">
        <div class="dashboard-head">
          <div>
            <h3>Welcome, {{ adminSession.userId() }}</h3>
            <p>You are logged in as admin and now have full management access.</p>
          </div>
          <button type="button" class="logout-btn" (click)="logout()">Logout</button>
        </div>

        <div class="action-grid">
          <a routerLink="/upload" class="action-card">
            <strong>Manage Papers</strong>
            <span>Upload, edit, and delete academic and competitive papers.</span>
          </a>
          <a routerLink="/watermark-tool" class="action-card">
            <strong>Add Watermark in PYQ</strong>
            <span>Upload a PDF, watermark it, and download the new file.</span>
          </a>
        </div>
      </section>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .hero-card,
      .panel-card {
        background: #ffffff;
        border: 1px solid #dbe4ef;
        border-radius: 18px;
        box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
      }
      .hero-card {
        padding: 1.35rem 1.4rem;
        background:
          radial-gradient(circle at top right, rgba(15, 118, 110, 0.12), transparent 36%),
          linear-gradient(135deg, #ffffff, #f6fbff);
      }
      .panel-card {
        margin-top: 1rem;
        padding: 1.2rem;
      }
      .eyebrow {
        margin: 0 0 0.35rem;
        font-size: 0.78rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #0f766e;
        font-weight: 800;
      }
      h2,
      h3 {
        margin: 0;
        color: #16324f;
      }
      .sub,
      .dashboard-head p {
        margin: 0.55rem 0 0;
        color: #4d5d70;
        line-height: 1.55;
      }
      .login-grid,
      .action-grid {
        display: grid;
        gap: 0.9rem;
      }
      .login-grid {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        margin-top: 1rem;
      }
      input,
      button {
        padding: 0.8rem 0.9rem;
        border-radius: 12px;
        font: inherit;
      }
      input {
        border: 1px solid #d0dbe8;
      }
      button {
        border: 0;
        background: #0f766e;
        color: #ffffff;
        font-weight: 700;
        cursor: pointer;
      }
      button[disabled] {
        opacity: 0.7;
        cursor: not-allowed;
      }
      .message.error {
        margin: 0.9rem 0 0;
        color: #b91c1c;
      }
      .dashboard-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
      }
      .logout-btn {
        background: #475569;
        min-width: 120px;
      }
      .action-grid {
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        margin-top: 1rem;
      }
      .action-card {
        display: grid;
        gap: 0.35rem;
        padding: 1rem;
        border-radius: 16px;
        background: #f8fbff;
        border: 1px solid #d8e5f2;
        text-decoration: none;
      }
      .action-card strong {
        color: #16324f;
      }
      .action-card span {
        color: #4d5d70;
        line-height: 1.5;
      }
      @media (max-width: 720px) {
        .dashboard-head {
          flex-direction: column;
        }
        .logout-btn {
          width: 100%;
        }
      }
    `
  ]
})
export class AdminPanelComponent {
  userId = '';
  password = '';
  message = '';
  isSubmitting = false;

  constructor(
    public readonly adminSession: AdminSessionService,
    private readonly api: ApiService
  ) {}

  login(event: Event): void {
    event.preventDefault();
    this.message = '';
    this.isSubmitting = true;

    this.api.loginAdmin(this.userId.trim(), this.password).subscribe({
      next: (session) => {
        this.adminSession.login(session);
        this.userId = '';
        this.password = '';
      },
      error: (err) => {
        this.message = err?.error?.message || 'Login failed.';
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  logout(): void {
    this.adminSession.logout();
  }
}
