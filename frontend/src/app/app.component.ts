import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminSessionService } from './services/admin-session.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="site-header">
      <div class="nav-shell">
        <div class="nav-inner page">
          <nav class="nav">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
            <a routerLink="/" fragment="directory">Question Papers</a>
            <a *ngIf="adminSession.isAuthenticated()" routerLink="/upload" routerLinkActive="active">Upload</a>
            <a *ngIf="adminSession.isAuthenticated()" routerLink="/watermark-tool" routerLinkActive="active">Add Watermark</a>
            <a class="brand" routerLink="/">
              <span class="brand-logo-frame">
                <img
                  class="brand-logo"
                  src="assets/ut-logo.png"
                  alt="UT Logo"
                />
              </span>
            </a>
          </nav>
        </div>
      </div>
    </header>

    <main class="page">
      <router-outlet></router-outlet>
    </main>

    <footer class="site-footer">
      <section class="footer-grid page">
        <div class="footer-brand">
          <h3>UTpaper</h3>
          <p>Semester-wise previous year papers for multiple universities and courses.</p>
        </div>
        <div>
          <h4>Quick Access</h4>
          <div class="footer-links">
            <a routerLink="/">Home</a>
            <a routerLink="/" fragment="directory">Question Papers</a>
            <a routerLink="/admin">Admin Panel</a>
            <a *ngIf="adminSession.isAuthenticated()" routerLink="/upload">Developer Upload</a>
            <a *ngIf="adminSession.isAuthenticated()" routerLink="/watermark-tool">Add Watermark in PYQ</a>
          </div>
        </div>
        <div>
          <h4>Support</h4>
          <p>Email: tauqeerahmad672&#64;gmail.com</p>
          <p>For wrong, duplicate, or outdated papers, contact admin for removal.</p>
        </div>
      </section>
      <div class="copy-row">
        <p class="copy page">&copy; {{ currentYear }} UTpaper. All rights reserved.</p>
      </div>
    </footer>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background:
          radial-gradient(1200px 300px at 50% -120px, rgba(15, 118, 110, 0.14), transparent 70%),
          #f3f7fb;
        font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
      }
      .page {
        max-width: 1220px;
        margin: 0 auto;
        padding: 1.1rem;
      }
      .site-header {
        position: sticky;
        top: 0;
        z-index: 50;
        background: #ffffff;
        animation: slideDown 320ms ease;
      }
      .nav-shell {
        background: #ffffff;
        border-bottom: 1px solid #e5e7eb;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
      }
      .nav-inner {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.65rem;
        min-height: 74px;
      }
      .nav-inner.page {
        max-width: 960px;
        padding: 0.35rem 0.9rem;
      }
      .nav {
        display: flex;
        gap: 0.28rem;
        flex-wrap: nowrap;
        align-items: center;
        margin-left: auto;
        justify-content: flex-end;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding: 0.2rem 0.1rem;
      }
      .nav a {
        text-decoration: none;
        border: 0;
        padding: 0.42rem 0.62rem;
        border-radius: 6px;
        color: #1f3650;
        background: transparent;
        font-weight: 600;
        transition: color 180ms ease, background 180ms ease;
        white-space: nowrap;
      }
      .brand {
        display: flex;
        align-items: center;
        text-decoration: none;
        color: inherit;
        margin-left: 0.3rem;
      }
      .brand-logo-frame {
        width: 88px;
        height: 88px;
        border-radius: 12px;
        background: #ffffff;
        border: 1px solid #d6dde6;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
        display: grid;
        place-items: center;
        overflow: hidden;
      }
      .brand-logo {
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: 0.08rem;
        box-sizing: border-box;
        transform: scale(1.2);
        transform-origin: center;
      }
      .nav a:hover {
        color: #132b44;
        background: rgba(236, 242, 247, 0.95);
      }
      .nav a.active {
        background: rgba(228, 236, 243, 0.96);
        color: #10263f;
      }
      .site-footer {
        margin-top: 1.5rem;
        color: #e6f5ff;
        background:
          linear-gradient(140deg, #09233b, #0a2f4c 58%, #0b3f5f),
          radial-gradient(300px 120px at 18% 10%, rgba(54, 153, 255, 0.26), transparent 70%);
        border-top: 1px solid rgba(255, 255, 255, 0.12);
        animation: fadeIn 450ms ease;
      }
      .footer-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1.2rem;
        padding-top: 1.2rem;
        padding-bottom: 1.2rem;
      }
      .footer-grid h3,
      .footer-grid h4 {
        margin: 0 0 0.48rem;
        color: #f8fdff;
        font-family: 'Cambria', 'Palatino Linotype', serif;
      }
      .footer-grid p {
        margin: 0;
        color: #c8dff2;
        font-size: 0.92rem;
        line-height: 1.45;
      }
      .footer-links {
        display: grid;
        gap: 0.38rem;
      }
      .footer-links a {
        color: #dff5ff;
        text-decoration: none;
        font-weight: 600;
      }
      .footer-links a:hover {
        text-decoration: underline;
      }
      .copy-row {
        border-top: 1px solid rgba(255, 255, 255, 0.16);
      }
      .copy {
        margin: 0;
        padding-top: 0.7rem;
        padding-bottom: 0.85rem;
        text-align: center;
        color: #b9d5ea;
      }
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @media (max-width: 760px) {
        .nav-inner {
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;
          gap: 0.4rem;
          min-height: 64px;
        }
        .nav {
          width: auto;
          gap: 0.28rem;
          justify-content: flex-end;
          padding: 0.12rem 0;
        }
        .nav a {
          padding: 0.36rem 0.5rem;
          font-size: 0.95rem;
        }
        .brand-logo-frame {
          width: 68px;
          height: 68px;
        }
        .footer-grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class AppComponent {
  readonly currentYear = new Date().getFullYear();

  constructor(public readonly adminSession: AdminSessionService) {}
}
