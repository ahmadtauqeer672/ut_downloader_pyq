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
      <div class="hero-copy">
        <p class="eyebrow">Admin Access</p>
        <h2>Admin Panel</h2>
        <p class="sub">Login to manage uploads, edit papers, delete papers, and use the watermark tool.</p>
      </div>
      <div class="hero-mark" aria-hidden="true">
        <span class="mark-glow glow-left"></span>
        <span class="mark-glow glow-right"></span>
        <span class="mark-swoosh swoosh-one"></span>
        <span class="mark-swoosh swoosh-two"></span>
        <span class="mark-star">✦</span>
        <span class="mark-ut">UT</span>
        <span class="mark-rule"></span>
        <span class="mark-tagline">DOWNLOAD QUESTION PAPERS</span>
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
        position: relative;
        overflow: hidden;
        padding: 1.35rem 1.4rem;
        background:
          radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 32%),
          radial-gradient(circle at 72% 25%, rgba(45, 212, 191, 0.12), transparent 24%),
          linear-gradient(135deg, #ffffff, #f6fbff 52%, #eef8ff);
      }
      .hero-copy {
        position: relative;
        z-index: 2;
        max-width: 560px;
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
      .hero-mark {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .mark-glow {
        position: absolute;
        border-radius: 999px;
        filter: blur(8px);
      }
      .glow-left {
        width: 220px;
        height: 220px;
        left: 53%;
        bottom: -86px;
        background: radial-gradient(circle, rgba(34, 211, 238, 0.3), rgba(34, 211, 238, 0));
      }
      .glow-right {
        width: 260px;
        height: 260px;
        right: -40px;
        top: -40px;
        background: radial-gradient(circle, rgba(168, 85, 247, 0.22), rgba(168, 85, 247, 0));
      }
      .mark-ut {
        position: absolute;
        right: 70px;
        top: 18px;
        font-size: 7rem;
        line-height: 0.9;
        font-weight: 900;
        letter-spacing: -0.12em;
        font-style: italic;
        font-family: Impact, Haettenschweiler, 'Arial Black', sans-serif;
        background: linear-gradient(180deg, rgba(31, 41, 55, 0.34), rgba(75, 85, 99, 0.14));
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        text-shadow: 0 10px 22px rgba(148, 163, 184, 0.15);
        transform: skew(-8deg);
      }
      .mark-swoosh {
        position: absolute;
        border-radius: 999px;
        border-style: solid;
        transform: rotate(-12deg);
      }
      .swoosh-one {
        width: 250px;
        height: 92px;
        right: 48px;
        top: 58px;
        border-width: 0 0 11px 11px;
        border-color: transparent transparent rgba(45, 212, 191, 0.82) rgba(34, 211, 238, 0.92);
      }
      .swoosh-two {
        width: 280px;
        height: 112px;
        right: 26px;
        top: 40px;
        border-width: 0 0 9px 9px;
        border-color: transparent transparent rgba(99, 102, 241, 0.82) rgba(168, 85, 247, 0.64);
      }
      .mark-star {
        position: absolute;
        right: 102px;
        top: 10px;
        font-size: 1.8rem;
        line-height: 1;
        color: rgba(56, 189, 248, 0.9);
        text-shadow: 0 0 16px rgba(56, 189, 248, 0.35);
      }
      .mark-rule {
        position: absolute;
        right: 64px;
        bottom: 52px;
        width: 250px;
        height: 2px;
        background: linear-gradient(90deg, rgba(34, 211, 238, 0.65), rgba(168, 85, 247, 0.35));
      }
      .mark-tagline {
        position: absolute;
        right: 66px;
        bottom: 20px;
        color: rgba(14, 165, 233, 0.78);
        font-size: 0.74rem;
        font-weight: 800;
        letter-spacing: 0.24em;
        white-space: nowrap;
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
        .hero-card {
          padding-bottom: 6.5rem;
        }
        .hero-copy {
          max-width: none;
        }
        .mark-ut {
          right: 24px;
          top: auto;
          bottom: 46px;
          font-size: 4.9rem;
        }
        .swoosh-one {
          width: 172px;
          height: 58px;
          right: 24px;
          top: auto;
          bottom: 64px;
        }
        .swoosh-two {
          width: 194px;
          height: 72px;
          right: 10px;
          top: auto;
          bottom: 54px;
        }
        .mark-star {
          right: 48px;
          top: auto;
          bottom: 126px;
          font-size: 1.3rem;
        }
        .mark-rule {
          right: 20px;
          bottom: 30px;
          width: 180px;
        }
        .mark-tagline {
          right: 22px;
          bottom: 10px;
          font-size: 0.56rem;
          letter-spacing: 0.18em;
        }
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
