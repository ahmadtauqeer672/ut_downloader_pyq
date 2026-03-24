import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-disclaimer-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero-card">
      <div>
        <p class="eyebrow">Legal Notice</p>
        <h2>Disclaimer</h2>
        <p class="sub">
          Please read this page carefully before using the study materials and previous year question papers available
          on utpaper.in.
        </p>
      </div>
      <a routerLink="/" class="home-link">Back to Home</a>
    </section>

    <section class="content-card">
      <p>
        The content available on utpaper.in is provided for educational and informational purposes only. All Previous
        Year Question Papers (PYQs), study materials, and related content uploaded on this website are collected from
        various publicly available sources on the internet.
      </p>
      <p>
        We do not claim ownership of any such materials unless explicitly stated. If you are the rightful owner of any
        content and believe that your copyrighted material has been used improperly, please contact us, and we will
        take appropriate action, including removal of the content.
      </p>
      <p>
        While we strive to ensure accuracy and authenticity, utpaper.in makes no guarantees regarding the completeness,
        reliability, or accuracy of the content. Users are advised to verify information from official sources.
      </p>
      <p>
        By using this website, you agree that utpaper.in is not responsible for any loss, damage, or inconvenience
        caused by the use of the content provided.
      </p>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .hero-card,
      .content-card {
        background: #ffffff;
        border: 1px solid #dbe4ef;
        border-radius: 18px;
        box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
      }
      .hero-card {
        padding: 1.35rem 1.4rem;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
        background:
          radial-gradient(circle at top right, rgba(15, 118, 110, 0.12), transparent 36%),
          linear-gradient(135deg, #ffffff, #f6fbff);
      }
      .content-card {
        margin-top: 1rem;
        padding: 1.25rem;
      }
      .eyebrow {
        margin: 0 0 0.35rem;
        font-size: 0.78rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #0f766e;
        font-weight: 800;
      }
      h2 {
        margin: 0;
        color: #16324f;
      }
      .sub,
      .content-card p {
        color: #4d5d70;
        line-height: 1.65;
      }
      .sub {
        margin: 0.55rem 0 0;
        max-width: 760px;
      }
      .content-card p {
        margin: 0 0 1rem;
      }
      .content-card p:last-child {
        margin-bottom: 0;
      }
      .home-link {
        align-self: center;
        text-decoration: none;
        background: #0f766e;
        color: #ffffff;
        font-weight: 700;
        padding: 0.75rem 1rem;
        border-radius: 12px;
        white-space: nowrap;
      }
      @media (max-width: 760px) {
        .hero-card {
          flex-direction: column;
        }
        .home-link {
          align-self: flex-start;
        }
      }
    `
  ]
})
export class DisclaimerPageComponent {}
