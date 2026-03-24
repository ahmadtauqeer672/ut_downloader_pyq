import { Component, DestroyRef, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Paper } from '../models/paper';
import { CompetitivePaper } from '../models/competitive-paper';
import { finalize } from 'rxjs/operators';
import { ACADEMIC_UNIVERSITY_OPTIONS, BTECH_DEPARTMENTS, SEMESTERS } from '../data/academic-options';
import { SeoService } from '../services/seo.service';

interface UniversityMenu {
  name: string;
  courses: string[];
}

interface SemesterGroup {
  semester: number;
  papers: Paper[];
}

interface CompetitiveYearGroup {
  year: number;
  papers: CompetitivePaper[];
}

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-student-papers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Academic Resource Hub</p>
        <h1>PTU Question Papers, Previous Year Papers and Competitive Exam PYQs</h1>
        <p class="sub">
          Download PTU, PU Chandigarh, GNDU, MDU and GTU question papers in one place. Browse BTECH, BCA, BBA, MBA,
          MCA and competitive exam papers semester-wise or year-wise on UTpaper.
        </p>
        <p class="hero-note">
          This website helps students find previous year papers quickly, compare semesters, and prepare with real exam
          patterns across multiple universities and courses.
        </p>
        <div class="hero-actions">
          <a class="hero-primary" href="#directory">Browse Question Papers</a>
          <a class="hero-secondary" [routerLink]="academicRouteLink('PTU', 'BTECH')">Open PTU BTECH Papers</a>
        </div>
        <div class="hero-points">
          <article class="hero-point">
            <strong>Semester-wise browsing</strong>
            <span>Academic papers are organized by semester, department and course.</span>
          </article>
          <article class="hero-point">
            <strong>Multiple universities</strong>
            <span>PTU, PU Chandigarh, GNDU, MDU and GTU papers are available in one place.</span>
          </article>
          <article class="hero-point">
            <strong>Quick exam preparation</strong>
            <span>Use previous year papers to understand pattern, subject focus and recurring questions.</span>
          </article>
        </div>
      </div>
      <div class="hero-spotlight">
        <p class="section-kicker">Trending on UTpaper</p>
        <h2>Start with popular paper categories</h2>
        <div class="hero-stat-wrap">
          <div class="hero-stat">
            <span>{{ totalAcademicCount }}</span>
            <small>Academic Papers</small>
          </div>
          <div class="hero-stat">
            <span>{{ totalCompetitiveCount }}</span>
            <small>Competitive Papers</small>
          </div>
        </div>
        <div class="spotlight-list">
          <a class="spotlight-link" [routerLink]="academicRouteLink('PTU', 'BTECH')">PTU BTECH semester papers</a>
          <a class="spotlight-link" [routerLink]="academicRouteLink('PTU', 'BCA')">PTU BCA previous year papers</a>
          <a class="spotlight-link" [routerLink]="academicRouteLink('PTU', 'MBA')">PTU MBA exam papers</a>
          <a class="spotlight-link" [routerLink]="academicRouteLink('PU Chandigarh', 'BTECH')">PU Chandigarh BTECH papers</a>
        </div>
      </div>
    </section>

    <section class="seo-intro" aria-label="Homepage introduction">
      <article class="seo-card seo-story">
        <p class="section-kicker">Why students use UTpaper</p>
        <h2>Find university question papers faster</h2>
        <p>
          UTpaper is built for students who want quick access to previous year question papers without browsing many
          different websites. You can filter papers by university, course, department and semester, then open or
          download the paper directly.
        </p>
        <p>
          The main focus is PTU question papers, but the directory also includes PU Chandigarh, GNDU, MDU, GTU and
          selected competitive exam papers. This makes the homepage stronger for searches like PTU BTECH papers, PTU
          BCA papers, MBA previous year papers and semester-wise PYQs.
        </p>
        <div class="benefit-grid">
          <article class="benefit-item">
            <strong>Clear filtering</strong>
            <span>Choose university, course, semester and department without digging through long menus.</span>
          </article>
          <article class="benefit-item">
            <strong>Useful for revision</strong>
            <span>Compare paper titles, subjects and years to spot the latest exam patterns before your test.</span>
          </article>
          <article class="benefit-item">
            <strong>Direct downloads</strong>
            <span>Open the paper quickly and move straight into preparation instead of wasting time searching.</span>
          </article>
        </div>
      </article>

      <aside class="seo-card seo-side">
        <p class="section-kicker">Popular searches</p>
        <h2>Jump into the most-used paper routes</h2>
        <p class="seo-side-copy">
          These shortcuts help students open the most searched combinations quickly. Choose one to update the directory
          below with a single click.
        </p>
        <div class="preset-wrap">
          <a class="preset-chip" [routerLink]="academicRouteLink('PTU', 'BTECH')">PTU BTECH Papers</a>
          <a class="preset-chip" [routerLink]="academicRouteLink('PTU', 'BCA')">PTU BCA Papers</a>
          <a class="preset-chip" [routerLink]="academicRouteLink('PTU', 'MBA')">PTU MBA Papers</a>
          <a class="preset-chip" [routerLink]="academicRouteLink('PU Chandigarh', 'BTECH')">PU BTECH Papers</a>
          <a class="preset-chip" [routerLink]="academicRouteLink('GNDU', 'B.COM')">GNDU B.COM Papers</a>
          <a class="preset-chip" [routerLink]="academicRouteLink('GTU', 'BPHARM')">GTU BPHARM Papers</a>
        </div>
        <ul class="seo-list">
          <li>PTU question papers all semesters</li>
          <li>PTU BTECH previous year papers</li>
          <li>PTU BCA and MBA question papers</li>
          <li>Semester-wise university PYQ downloads</li>
          <li>Competitive exam papers year-wise</li>
        </ul>
      </aside>
    </section>

    <section class="route-card" aria-labelledby="course-url-title">
      <div class="route-head">
        <div>
          <p class="section-kicker section-kicker-soft">Course URLs</p>
          <h2 id="course-url-title">Browse all course pages</h2>
        </div>
        <p>Each course has its own URL so Google can crawl and index separate pages for PTU, PU, GNDU, MDU, GTU and more.</p>
      </div>

      <div class="route-grid">
        <article class="route-group" *ngFor="let university of universityMenus">
          <a class="route-university" [routerLink]="academicRouteLink(university.name)">{{ university.name }} All Courses</a>
          <div class="route-links">
            <a class="route-link" *ngFor="let course of university.courses" [routerLink]="academicRouteLink(university.name, course)">
              {{ university.name }} {{ course }}
            </a>
          </div>
        </article>
      </div>
    </section>

    <section class="startup-notice" *ngIf="showWakeUpNotice && !hasInitialDataResolved()">
      <div class="startup-spinner" aria-hidden="true"></div>
      <div>
        <strong>Server is waking up.</strong>
        <p>Because the backend is on a free plan, the first load can take 20 to 60 seconds after inactivity.</p>
      </div>
    </section>

    <section class="content-columns">
      <div class="column academic-column">
        <section id="directory" class="directory-card">
          <header>
            <div>
              <p class="section-kicker section-kicker-soft">Academic Library</p>
              <h3>Academic Question Paper Directory</h3>
            </div>
            <p>{{ universityFilter || 'Choose university' }} / {{ courseFilter || 'All courses' }}</p>
          </header>

          <div class="directory-grid">
            <div class="panel">
              <h4>University</h4>
              <select [ngModel]="universityFilter" (ngModelChange)="onUniversitySelectionChange($event)" name="universityFilter">
                <option *ngFor="let uni of universityMenus" [ngValue]="uni.name">{{ uni.name }}</option>
              </select>
            </div>

            <div class="panel">
              <h4>Course</h4>
              <select [ngModel]="courseFilter" (ngModelChange)="onCourseSelectionChange($event)" name="courseFilter">
                <option value="">All Courses</option>
                <option *ngFor="let c of activeUniversity.courses" [ngValue]="c">{{ c }}</option>
              </select>
            </div>
          </div>

          <div class="btech-controls" *ngIf="isBtechSelected()">
            <div class="btech-panel">
              <h4>BTECH Department</h4>
              <select [ngModel]="departmentFilter" (ngModelChange)="onDepartmentSelectionChange($event)" name="departmentFilter">
                <option value="">All Departments</option>
                <option *ngFor="let d of btechDepartments" [ngValue]="d">{{ d }}</option>
              </select>
            </div>

            <div class="btech-panel">
              <h4>Semester</h4>
              <select [ngModel]="semesterFilter" (ngModelChange)="onSemesterSelectionChange($event)" name="semesterFilter">
                <option value="">All Semesters</option>
                <option *ngFor="let s of semesters" [ngValue]="s">Semester {{ s }}</option>
              </select>
            </div>
          </div>
        </section>

        <section class="result-wrap">
          <p *ngIf="message" class="message">{{ message }}</p>
          <div class="loading" *ngIf="isLoadingPapers && !papers.length">Loading papers...</div>

          <div class="semester-wrap" *ngIf="semesterGroups.length > 0; else emptyAcademic">
            <article class="semester-block" *ngFor="let group of semesterGroups; trackBy: trackSemester">
              <header class="semester-head">
                <h4>{{ semesterTitle(group.semester) }}</h4>
                <small>{{ group.papers.length }} papers</small>
              </header>

              <div class="semester-list">
                <div class="paper-row" *ngFor="let paper of group.papers; trackBy: trackPaper">
                  <a class="paper-link" [href]="downloadHref(paper)" target="_blank" rel="noopener">
                    {{ paperLine(paper) }}
                  </a>
                  <div class="row-actions">
                    <a [href]="downloadHref(paper)" target="_blank" rel="noopener">Download</a>
                  </div>
                </div>
              </div>
            </article>

            <div class="load-more" *ngIf="hasMorePapers">
              <button type="button" (click)="loadMorePapers()" [disabled]="isLoadingPapers">
                {{ isLoadingPapers ? 'Loading more...' : 'Load more papers' }}
              </button>
            </div>
          </div>

          <ng-template #emptyAcademic>
            <div class="empty">No academic papers found for this selection.</div>
          </ng-template>
        </section>
      </div>

      <div class="column competitive-column">
        <section class="competitive-card">
          <header class="competitive-head">
            <div>
              <p class="section-kicker section-kicker-soft">Exam Collection</p>
              <h3>Competitive Exams (Year-wise)</h3>
              <p>Select an exam to view all uploaded papers year-wise.</p>
            </div>
          </header>

          <p *ngIf="competitiveMessage" class="message">{{ competitiveMessage }}</p>

          <div class="exam-chip-wrap" *ngIf="competitiveExams.length > 0; else noExam">
            <button
              type="button"
              *ngFor="let exam of competitiveExams"
              (click)="selectCompetitiveExam(exam)"
              [class.active]="selectedCompetitiveExam === exam"
              [disabled]="isLoadingCompetitivePapers && selectedCompetitiveExam === exam"
            >
              {{ exam }}
            </button>
          </div>

          <ng-template #noExam>
            <div class="empty">No competitive exams uploaded yet.</div>
          </ng-template>

          <div class="loading" *ngIf="selectedCompetitiveExam && isLoadingCompetitivePapers">
            Loading papers for {{ selectedCompetitiveExam }}...
          </div>

          <div class="competitive-year-wrap" *ngIf="selectedCompetitiveExam && competitiveYearGroups.length > 0">
            <article class="year-block" *ngFor="let group of competitiveYearGroups; trackBy: trackYearGroup">
              <header class="year-head">
                <h4>{{ selectedCompetitiveExam }} {{ group.year }} PAPERS</h4>
                <small>{{ group.papers.length }} papers</small>
              </header>

              <div class="year-list">
                <div class="paper-row" *ngFor="let paper of group.papers; trackBy: trackCompetitivePaper">
                  <a class="paper-link" [href]="competitiveDownloadHref(paper)" target="_blank" rel="noopener">
                    {{ paper.title }} - {{ paper.year }}
                  </a>
                  <div class="row-actions">
                    <a [href]="competitiveDownloadHref(paper)" target="_blank" rel="noopener">Download</a>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div class="empty" *ngIf="selectedCompetitiveExam && !isLoadingCompetitivePapers && competitiveYearGroups.length === 0">
            No papers found for {{ selectedCompetitiveExam }}.
          </div>
        </section>
      </div>
    </section>

    <section class="faq-card" aria-labelledby="homepage-faq-title">
      <div class="faq-head">
        <div>
          <p class="section-kicker section-kicker-soft">Quick Help</p>
          <h2 id="homepage-faq-title">Frequently Asked Questions</h2>
        </div>
        <p>Helpful details for students searching previous year papers on Google and on the website.</p>
      </div>

      <div class="faq-grid">
        <article class="faq-item" *ngFor="let item of faqItems">
          <h3>{{ item.question }}</h3>
          <p>{{ item.answer }}</p>
        </article>
      </div>
    </section>

  `,
  styles: [
    `
      :host {
        display: block;
        font-family: 'Trebuchet MS', 'Gill Sans', 'Segoe UI', sans-serif;
        --brand-deep: #0f2f53;
        --brand-mid: #1f5f92;
        --brand-soft: #eef6ff;
        --brand-border: #dbe4ef;
        --brand-ink: #16324f;
        --brand-muted: #4d5d70;
        --brand-card: #f8fbff;
        --brand-line: #d7e4f1;
        --accent: #f59e0b;
        --heading-font: 'Trebuchet MS', 'Gill Sans', 'Segoe UI', sans-serif;
      }
      .hero {
        position: relative;
        overflow: hidden;
        background:
          radial-gradient(circle at top right, rgba(255, 255, 255, 0.18), transparent 28%),
          radial-gradient(circle at bottom left, rgba(245, 158, 11, 0.18), transparent 30%),
          linear-gradient(135deg, #0f2f53, #174875 58%, #236391);
        color: #e9f1ff;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 28px;
        padding: 1.8rem;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        align-items: stretch;
        gap: 1.25rem;
        margin-bottom: 1rem;
        box-shadow: 0 28px 70px rgba(15, 47, 83, 0.2);
      }
      .hero::after {
        content: '';
        position: absolute;
        inset: auto -10% -45% auto;
        width: 340px;
        height: 340px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.14), transparent 65%);
        pointer-events: none;
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        margin: 0;
        padding: 0.42rem 0.78rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.18);
        font-size: 0.76rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #9fd0ff;
        font-weight: 800;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
      }
      .hero-copy {
        position: relative;
        z-index: 1;
        min-width: 0;
        max-width: 800px;
        display: flex;
        flex-direction: column;
      }
      .hero h1 {
        margin: 0.45rem 0 0;
        font-family: var(--heading-font);
        font-size: clamp(2rem, 4vw, 3rem);
        line-height: 1.02;
        letter-spacing: -0.03em;
        max-width: 13ch;
        text-wrap: balance;
      }
      .hero .sub {
        margin: 1rem 0 0;
        max-width: 60ch;
        font-size: 1.06rem;
        color: rgba(233, 241, 255, 0.96);
        line-height: 1.8;
      }
      .hero-note {
        margin: 0.95rem 0 0;
        max-width: 58ch;
        color: rgba(223, 239, 255, 0.86);
        line-height: 1.75;
      }
      .hero-actions {
        display: flex;
        gap: 0.8rem;
        flex-wrap: wrap;
        margin-top: 1.3rem;
      }
      .hero-primary,
      .hero-secondary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 50px;
        border-radius: 999px;
        padding: 0.78rem 1.18rem;
        font: inherit;
        font-weight: 800;
        text-decoration: none;
        cursor: pointer;
        transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease, border-color 180ms ease;
      }
      .hero-primary {
        background: linear-gradient(135deg, #ffffff, #f8fcff 55%, #dcefff);
        color: var(--brand-deep);
        box-shadow: 0 14px 32px rgba(10, 31, 52, 0.22);
      }
      .hero-secondary {
        border: 1px solid rgba(255, 255, 255, 0.24);
        background: rgba(255, 255, 255, 0.1);
        color: #f7fbff;
      }
      .hero-primary:hover,
      .hero-secondary:hover,
      .spotlight-link:hover,
      .preset-chip:hover {
        transform: translateY(-1px);
        box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
      }
      .hero-points {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.8rem;
        margin-top: 1.35rem;
      }
      .hero-point {
        position: relative;
        padding: 1rem 1rem 0.95rem;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.14);
        backdrop-filter: blur(8px);
      }
      .hero-point::before {
        content: '';
        position: absolute;
        top: 0;
        left: 1rem;
        right: 1rem;
        height: 3px;
        border-radius: 999px;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.2));
      }
      .hero-point strong {
        display: block;
        font-size: 1rem;
        color: #ffffff;
      }
      .hero-point span {
        display: block;
        margin-top: 0.35rem;
        color: rgba(226, 239, 250, 0.84);
        line-height: 1.55;
        font-size: 0.92rem;
      }
      .hero-spotlight {
        position: relative;
        z-index: 1;
        width: min(360px, 100%);
        padding: 1.25rem;
        border-radius: 24px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.08));
        border: 1px solid rgba(255, 255, 255, 0.16);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 22px 48px rgba(7, 24, 40, 0.18);
      }
      .section-kicker {
        margin: 0;
        font-size: 0.76rem;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        font-weight: 800;
        color: #6c8fb0;
      }
      .hero-spotlight .section-kicker {
        color: #b9ddff;
      }
      .hero-spotlight h2 {
        margin: 0.5rem 0 0;
        font-family: var(--heading-font);
        font-size: 1.35rem;
        line-height: 1.2;
        color: #ffffff;
      }
      .section-kicker-soft {
        color: #6d86a5;
      }
      .directory-card .section-kicker,
      .competitive-head .section-kicker,
      .faq-head .section-kicker {
        margin: 0;
        color: #6d86a5;
      }
      .seo-intro {
        display: grid;
        grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.9fr);
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .seo-card,
      .faq-card,
      .route-card {
        position: relative;
        overflow: hidden;
        background: linear-gradient(180deg, #ffffff, #fbfdff);
        border: 1px solid var(--brand-border);
        border-radius: 24px;
        padding: 1.35rem;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
      }
      .seo-card::before,
      .faq-card::before,
      .route-card::before,
      .directory-card::before,
      .competitive-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 1.25rem;
        right: 1.25rem;
        height: 3px;
        border-radius: 999px;
        background: linear-gradient(90deg, rgba(31, 95, 146, 0.9), rgba(245, 158, 11, 0.55));
      }
      .seo-card h2,
      .faq-head h2 {
        margin: 0.45rem 0 0.75rem;
        color: var(--brand-ink);
        font-family: var(--heading-font);
        font-size: 1.55rem;
        line-height: 1.2;
      }
      .seo-card p,
      .faq-head p,
      .faq-item p {
        margin: 0;
        color: var(--brand-muted);
        line-height: 1.72;
      }
      .seo-card p + p {
        margin-top: 0.75rem;
      }
      .benefit-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.9rem;
        margin-top: 1rem;
      }
      .benefit-item {
        padding: 1rem;
        border-radius: 18px;
        background: linear-gradient(180deg, #f8fbff, #ffffff);
        border: 1px solid #d6e4f3;
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
      }
      .benefit-item strong {
        display: block;
        color: var(--brand-ink);
        font-size: 1rem;
      }
      .benefit-item span {
        display: block;
        margin-top: 0.35rem;
        color: var(--brand-muted);
        font-size: 0.93rem;
        line-height: 1.6;
      }
      .preset-wrap {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.8rem;
        margin-top: 1rem;
      }
      .preset-chip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.7rem;
        min-height: 56px;
        border: 1px solid #c9dcf1;
        border-radius: 18px;
        padding: 0.95rem 1rem;
        background: #ffffff;
        color: #123a68;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        text-align: left;
        text-decoration: none;
        box-shadow: 0 10px 24px rgba(16, 38, 63, 0.05);
      }
      .preset-chip::after {
        content: '>';
        color: #6b88aa;
        font-weight: 800;
      }
      .seo-side {
        background:
          radial-gradient(circle at top right, rgba(31, 95, 146, 0.08), transparent 32%),
          linear-gradient(180deg, #ffffff, #f7fbff);
      }
      .seo-side-copy {
        font-size: 0.98rem;
      }
      .seo-list {
        margin: 1rem 0 0;
        padding-left: 1.1rem;
        color: #23415f;
        line-height: 1.65;
      }
      .seo-list li + li {
        margin-top: 0.65rem;
      }
      .route-card {
        margin-bottom: 1rem;
        background:
          radial-gradient(circle at top right, rgba(15, 118, 110, 0.08), transparent 28%),
          linear-gradient(180deg, #ffffff, #fbfdff);
      }
      .route-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
        margin-bottom: 1rem;
      }
      .route-head h2 {
        margin: 0.45rem 0 0;
        color: var(--brand-ink);
        font-family: var(--heading-font);
        font-size: 1.55rem;
        line-height: 1.2;
      }
      .route-head p:last-child {
        margin: 0;
        max-width: 540px;
        color: var(--brand-muted);
        line-height: 1.7;
      }
      .route-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.9rem;
      }
      .route-group {
        border: 1px solid #dbe6f1;
        border-radius: 20px;
        padding: 1rem;
        background: linear-gradient(180deg, #f8fbff, #ffffff);
        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.04);
      }
      .route-university {
        display: inline-flex;
        align-items: center;
        min-height: 44px;
        padding: 0.7rem 0.95rem;
        border-radius: 999px;
        background: linear-gradient(135deg, #0f766e, #0b5f59);
        color: #ffffff;
        text-decoration: none;
        font-weight: 800;
        box-shadow: 0 10px 20px rgba(15, 118, 110, 0.14);
      }
      .route-links {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        margin-top: 0.9rem;
      }
      .route-link {
        display: inline-flex;
        align-items: center;
        min-height: 42px;
        padding: 0.62rem 0.86rem;
        border-radius: 999px;
        border: 1px solid #d1dbe8;
        background: #ffffff;
        color: #17395f;
        text-decoration: none;
        font-weight: 700;
      }
      .route-link:hover,
      .route-university:hover {
        transform: translateY(-1px);
      }
      .hero-stat-wrap {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
        margin-top: 1rem;
      }
      .hero-stat {
        flex: 1;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 18px;
        padding: 0.95rem 1rem;
        text-align: center;
        min-width: 128px;
      }
      .hero-stat span {
        display: block;
        font-size: 1.7rem;
        font-weight: 800;
        color: #ffffff;
      }
      .hero-stat small {
        color: rgba(232, 244, 255, 0.82);
      }
      .spotlight-list {
        display: grid;
        gap: 0.65rem;
        margin-top: 1rem;
      }
      .spotlight-link {
        display: block;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 16px;
        padding: 0.9rem 1rem;
        background: rgba(255, 255, 255, 0.08);
        color: #eef7ff;
        font: inherit;
        font-weight: 700;
        text-align: left;
        cursor: pointer;
        text-decoration: none;
      }
      .directory-card,
      .competitive-card {
        position: relative;
        overflow: hidden;
        background:
          radial-gradient(circle at top right, rgba(31, 95, 146, 0.05), transparent 28%),
          linear-gradient(180deg, #ffffff, #fbfdff);
        border: 1px solid #dbe4ef;
        border-radius: 24px;
        padding: 1.25rem;
        box-shadow: 0 18px 36px rgba(15, 23, 42, 0.05);
      }
      .competitive-card {
        margin-top: 0;
      }
      .content-columns {
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
        gap: 1rem;
        align-items: start;
      }
      .startup-notice {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        margin: 0 0 1rem;
        padding: 0.9rem 1rem;
        border-radius: 14px;
        border: 1px solid #cbdcf7;
        background: linear-gradient(135deg, #f7fbff, #eef6ff);
        color: #15314f;
      }
      .startup-notice strong {
        display: block;
        margin-bottom: 0.15rem;
      }
      .startup-notice p {
        margin: 0;
        color: #4d5d70;
      }
      .startup-spinner {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 3px solid #bfd4ef;
        border-top-color: #0f766e;
        flex-shrink: 0;
        animation: spin 0.9s linear infinite;
      }
      .column {
        min-width: 0;
      }
      .directory-card header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.8rem;
        margin-bottom: 1rem;
      }
      .directory-card h3,
      .competitive-head h3 {
        margin: 0.45rem 0 0;
        color: var(--brand-ink);
        font-family: var(--heading-font);
        font-size: 1.6rem;
        line-height: 1.15;
      }
      .directory-card p {
        margin: 0;
        color: #4d5d70;
      }
      .directory-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.9rem;
      }
      .panel {
        border: 1px solid #dbe6f1;
        border-radius: 18px;
        padding: 0.85rem;
        background: linear-gradient(180deg, #fafdff, #f5f9ff);
      }
      .panel h4 {
        margin: 0 0 0.55rem;
        font-size: 0.92rem;
        color: #45627f;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .panel select,
      .btech-panel select {
        width: 100%;
        min-height: 48px;
        border: 1px solid #cfdae6;
        background: #ffffff;
        color: #1f2d3b;
        border-radius: 14px;
        padding: 0.7rem 0.8rem;
        cursor: pointer;
        font: inherit;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
      }
      .btech-controls {
        margin-top: 0.8rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.8rem;
      }
      .btech-panel {
        border: 1px solid #dbe6f1;
        border-radius: 18px;
        padding: 0.85rem;
        background: linear-gradient(180deg, #f7fbff, #f2f8ff);
      }
      .btech-panel h4 {
        margin: 0 0 0.55rem;
        font-size: 0.92rem;
        color: #45627f;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .result-wrap {
        margin-top: 1rem;
      }
      .semester-wrap,
      .competitive-year-wrap {
        display: grid;
        gap: 0.9rem;
      }
      .semester-block,
      .year-block {
        border: 1px solid #dbe4ef;
        border-radius: 20px;
        background: linear-gradient(180deg, #ffffff, #fbfdff);
        overflow: hidden;
        box-shadow: 0 14px 28px rgba(15, 23, 42, 0.04);
      }
      .semester-head,
      .year-head {
        display: flex;
        justify-content: space-between;
        gap: 0.7rem;
        align-items: center;
        background: linear-gradient(180deg, #f8fbff, #f4f9ff);
        border-bottom: 1px solid #e3eaf3;
        padding: 0.9rem 1rem;
      }
      .semester-head h4,
      .year-head h4 {
        margin: 0;
        color: #bd650d;
        font-family: var(--heading-font);
        font-size: 1.08rem;
      }
      .semester-head small,
      .year-head small {
        color: #4d5d70;
      }
      .semester-list,
      .year-list {
        padding: 0.3rem 1rem 0.8rem;
      }
      .paper-row {
        display: flex;
        justify-content: space-between;
        gap: 0.7rem;
        align-items: center;
        border-bottom: 1px dashed #e2e8f0;
        padding: 0.85rem 0;
      }
      .paper-row:last-child {
        border-bottom: 0;
      }
      .paper-link {
        color: #0f2f7a;
        text-decoration: none;
        font-weight: 600;
        line-height: 1.55;
        overflow-wrap: anywhere;
      }
      .paper-link:hover {
        text-decoration: underline;
      }
      .row-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        flex-shrink: 0;
      }
      .row-actions a {
        border-radius: 999px;
        border: 1px solid #0f766e;
        padding: 0.62rem 0.9rem;
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        background: linear-gradient(135deg, #0f766e, #0b5f59);
        color: #ffffff;
        box-shadow: 0 10px 20px rgba(15, 118, 110, 0.14);
      }
      .competitive-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.8rem;
        margin-bottom: 0.9rem;
      }
      .competitive-head p {
        margin: 0.2rem 0 0;
        color: #4d5d70;
      }
      .exam-chip-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 0.55rem;
        margin-bottom: 0.9rem;
      }
      .exam-chip-wrap button {
        border: 1px solid #d1dbe8;
        border-radius: 999px;
        padding: 0.5rem 0.85rem;
        background: #fff;
        color: #1f2d3b;
        cursor: pointer;
        font-weight: 700;
      }
      .exam-chip-wrap button.active {
        background: linear-gradient(135deg, #0f766e, #0b5f59);
        color: #fff;
        border-color: #0f766e;
      }
      .message {
        color: #b91c1c;
      }
      .empty {
        padding: 1rem 1.05rem;
        border: 1px dashed #c2cfde;
        border-radius: 16px;
        color: #4d5d70;
        background: linear-gradient(180deg, #ffffff, #fbfdff);
      }
      .loading {
        margin: 0.4rem 0;
        color: #0f2f7a;
        font-weight: 600;
      }
      .load-more {
        display: flex;
        justify-content: center;
        margin: 0.6rem 0 0.2rem;
      }
      .load-more button {
        border-radius: 999px;
        border: 1px solid #0f766e;
        padding: 0.7rem 1.1rem;
        background: linear-gradient(135deg, #0f766e, #0b5f59);
        color: #fff;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 10px 20px rgba(15, 118, 110, 0.14);
      }
      .load-more button[disabled] {
        opacity: 0.65;
        cursor: not-allowed;
      }
      .faq-card {
        margin-top: 0.7rem;
        background:
          radial-gradient(circle at top right, rgba(245, 158, 11, 0.08), transparent 24%),
          linear-gradient(180deg, #ffffff, #fcfdff);
      }
      .faq-head {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        align-items: flex-start;
        margin-bottom: 0.75rem;
      }
      .faq-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
      }
      .faq-item {
        border: 1px solid #dbe4ef;
        border-radius: 20px;
        padding: 0.85rem 0.9rem;
        background: linear-gradient(180deg, #ffffff, #f8fbff);
        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
      }
      .faq-item h3 {
        margin: 0 0 0.35rem;
        color: var(--brand-ink);
        font-family: var(--heading-font);
        font-size: 1rem;
        line-height: 1.35;
      }
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      @media (max-width: 1080px) {
        .seo-intro,
        .content-columns {
          grid-template-columns: 1fr;
        }
        .benefit-grid,
        .hero-points {
          grid-template-columns: 1fr;
        }
        .hero-spotlight {
          width: 100%;
        }
        .route-grid {
          grid-template-columns: 1fr;
        }
        .faq-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 840px) {
        .hero {
          flex-direction: column;
          align-items: flex-start;
          padding: 1.3rem;
        }
        .hero h1 {
          max-width: none;
          font-size: 1.9rem;
        }
        .hero-stat-wrap {
          width: 100%;
        }
        .preset-wrap {
          grid-template-columns: 1fr;
        }
        .route-head {
          flex-direction: column;
        }
        .directory-grid,
        .btech-controls {
          grid-template-columns: 1fr;
        }
        .faq-head,
        .paper-row {
          flex-direction: column;
          align-items: flex-start;
        }
        .competitive-head {
          flex-direction: column;
          align-items: flex-start;
        }
      }
      @media (max-width: 640px) {
        .hero {
          padding: 1rem;
          gap: 0.8rem;
        }
        .hero h1 {
          font-size: 1.55rem;
        }
        .hero .sub,
        .hero-note {
          font-size: 0.95rem;
        }
        .hero-actions {
          width: 100%;
        }
        .hero-primary,
        .hero-secondary {
          width: 100%;
        }
        .hero-stat {
          flex: 1;
          min-width: 140px;
        }
        .seo-card,
        .faq-card,
        .route-card,
        .directory-card,
        .competitive-card {
          padding: 1rem 0.9rem;
        }
        .directory-card header {
          flex-direction: column;
          align-items: flex-start;
        }
        .semester-head,
        .year-head {
          flex-direction: column;
          align-items: flex-start;
        }
        .row-actions {
          width: 100%;
        }
        .row-actions a {
          width: 100%;
          text-align: center;
        }
      }
    `
  ]
})
export class StudentPapersComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private currentSeoPath = '/';

  papers: Paper[] = [];
  semesterGroups: SemesterGroup[] = [];
  message = '';

  competitiveExams: string[] = [];
  selectedCompetitiveExam = '';
  competitivePapers: CompetitivePaper[] = [];
  competitiveYearGroups: CompetitiveYearGroup[] = [];
  totalCompetitiveCount = 0;
  competitiveMessage = '';
  isLoadingCompetitivePapers = false;
  private competitiveRequestId = 0;
  showWakeUpNotice = false;
  private initialAcademicResolved = false;
  private initialCompetitiveResolved = false;
  private wakeUpTimer: ReturnType<typeof setTimeout> | null = null;

  universityFilter = '';
  courseFilter = '';
  departmentFilter = '';
  semesterFilter = '';

  readonly firstPageSize = 8;
  readonly pageSize = 25;
  totalAcademicCount = 0;
  hasMorePapers = true;
  isLoadingPapers = false;
  nextOffset = 0;

  readonly btechDepartments = BTECH_DEPARTMENTS;
  readonly semesters = SEMESTERS;
  readonly faqItems: FaqItem[] = [
    {
      question: 'What are PTU question papers?',
      answer:
        'PTU question papers are previous year exam papers from I. K. Gujral Punjab Technical University courses such as BTECH, BCA, BBA, MBA and MCA.'
    },
    {
      question: 'Can I download papers semester-wise?',
      answer:
        'Yes. Academic papers on UTpaper are organized semester-wise, and BTECH papers can also be filtered by department and semester.'
    },
    {
      question: 'Does the website only include PTU papers?',
      answer:
        'No. The directory also includes papers for PU Chandigarh, GNDU, MDU, GTU and competitive exams wherever papers have been uploaded.'
    },
    {
      question: 'Why can the first load be slow sometimes?',
      answer:
        'The backend runs on a free hosting plan, so the server can take a short time to wake up after inactivity before papers begin loading.'
    }
  ];

  universityMenus: UniversityMenu[] = ACADEMIC_UNIVERSITY_OPTIONS;

  activeUniversity: UniversityMenu = this.universityMenus[0];

  constructor(public readonly api: ApiService) {}

  ngOnInit(): void {
    this.startWakeUpTimer();
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.applySelectionFromRoute(params);
    });
    this.loadCompetitiveExams();
  }

  ngOnDestroy(): void {
    this.clearWakeUpTimer();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (this.isLoadingPapers || !this.hasMorePapers) return;
    const doc = document.documentElement;
    const distanceFromBottom = doc.scrollHeight - (doc.scrollTop + doc.clientHeight);
    if (distanceFromBottom < 320) {
      this.loadMorePapers();
    }
  }

  isBtechSelected(): boolean {
    return this.courseFilter.trim().toUpperCase() === 'BTECH';
  }

  onUniversitySelectionChange(universityName: string): void {
    const selected = this.universityMenus.find((uni) => uni.name === universityName);
    if (!selected) return;
    this.pickUniversity(selected);
  }

  onCourseSelectionChange(course: string): void {
    if (!course) {
      this.pickAllCourses();
      return;
    }
    this.pickCourse(course);
  }

  onDepartmentSelectionChange(department: string): void {
    if (!department) {
      this.pickAllDepartments();
      return;
    }
    this.pickDepartment(department);
  }

  onSemesterSelectionChange(semester: string): void {
    if (!semester) {
      this.pickAllSemesters();
      return;
    }
    this.pickSemester(semester);
  }

  pickUniversity(uni: UniversityMenu, navigate = true, path = '/'): void {
    if (navigate) {
      this.navigateToAcademicRoute(uni.name);
      return;
    }
    this.activeUniversity = uni;
    this.universityFilter = uni.name;
    this.courseFilter = '';
    this.departmentFilter = '';
    this.semesterFilter = '';
    this.currentSeoPath = path;
    this.syncSeo();
    this.resetAndLoadPapers();
  }

  pickAllCourses(navigate = true, path = this.buildAcademicPath(this.activeUniversity.name)): void {
    if (navigate) {
      this.navigateToAcademicRoute(this.activeUniversity.name);
      return;
    }
    this.courseFilter = '';
    this.departmentFilter = '';
    this.semesterFilter = '';
    this.currentSeoPath = path;
    this.syncSeo();
    this.resetAndLoadPapers();
  }

  pickCourse(course: string, navigate = true, path = this.buildAcademicPath(this.activeUniversity.name, course)): void {
    if (navigate) {
      this.navigateToAcademicRoute(this.activeUniversity.name, course);
      return;
    }
    this.courseFilter = course;
    this.departmentFilter = '';
    this.semesterFilter = '';
    this.currentSeoPath = path;
    this.syncSeo();
    this.resetAndLoadPapers();
  }

  pickAllDepartments(): void {
    this.departmentFilter = '';
    this.syncSeo();
    this.resetAndLoadPapers();
  }

  pickDepartment(department: string): void {
    this.departmentFilter = department;
    this.syncSeo();
    this.resetAndLoadPapers();
  }

  pickAllSemesters(): void {
    this.semesterFilter = '';
    this.syncSeo();
    this.resetAndLoadPapers();
  }

  pickSemester(semester: string): void {
    this.semesterFilter = semester;
    this.syncSeo();
    this.resetAndLoadPapers();
  }

  applyPreset(universityName: string, course = '', department = '', semester = ''): void {
    const selected = this.universityMenus.find((uni) => uni.name === universityName);
    if (!selected) return;

    this.activeUniversity = selected;
    this.universityFilter = selected.name;
    this.courseFilter = course;
    this.departmentFilter = department;
    this.semesterFilter = semester;
    this.navigateToAcademicRoute(universityName, course, true);
  }

  academicRouteLink(universityName: string, course = ''): string[] {
    return course
      ? ['/question-papers', this.slugify(universityName), this.slugify(course)]
      : ['/question-papers', this.slugify(universityName)];
  }

  loadMorePapers(): void {
    this.loadPapersPage();
  }

  private resetAndLoadPapers(): void {
    this.papers = [];
    this.semesterGroups = [];
    this.totalAcademicCount = 0;
    this.hasMorePapers = true;
    this.nextOffset = 0;
    this.message = '';
    this.loadPapersPage();
  }

  private loadPapersPage(): void {
    if (this.isLoadingPapers || !this.hasMorePapers) return;
    this.isLoadingPapers = true;
    const limit = this.nextOffset === 0 ? this.firstPageSize : this.pageSize;

    this.api
      .listPapers(
        {
          university: this.universityFilter,
          course: this.courseFilter,
          department: this.departmentFilter,
          semester: this.semesterFilter
        },
        { limit, offset: this.nextOffset }
      )
      .pipe(finalize(() => (this.isLoadingPapers = false)))
      .subscribe({
        next: (res) => {
          if (!this.initialAcademicResolved && this.nextOffset === 0) {
            this.markInitialAcademicResolved();
          }
          const items = res.items || [];
          this.totalAcademicCount = res.total ?? items.length;

          if (this.nextOffset === 0 && !items.length) {
            this.papers = [];
            this.semesterGroups = [];
            this.hasMorePapers = false;
            this.message = 'No academic papers found for this selection.';
            return;
          }

          this.papers = [...this.papers, ...items];
          this.buildSemesterGroups();
          this.nextOffset = res.nextOffset ?? this.nextOffset + items.length;
          this.hasMorePapers = res.hasMore;
          this.message = '';
        },
        error: () => {
          if (!this.initialAcademicResolved && this.nextOffset === 0) {
            this.markInitialAcademicResolved();
          }
          if (!this.papers.length) {
            this.message = 'Failed to load papers.';
            this.semesterGroups = [];
          }
          this.hasMorePapers = false;
        }
      });
  }

  trackSemester(_index: number, group: SemesterGroup): number {
    return group.semester;
  }

  trackPaper(_index: number, paper: Paper): number {
    return paper.id;
  }

  trackYearGroup(_index: number, group: CompetitiveYearGroup): number {
    return group.year;
  }

  trackCompetitivePaper(_index: number, paper: CompetitivePaper): number {
    return paper.id;
  }

  loadCompetitiveExams(): void {
    this.api.getCompetitiveSummary().subscribe({
      next: (summary) => {
        if (!this.initialCompetitiveResolved) {
          this.markInitialCompetitiveResolved();
        }
        const exams = summary.exams || [];
        this.competitiveExams = exams;
        this.totalCompetitiveCount = summary.totalCount ?? 0;
        this.competitiveMessage = '';
        if (!exams.length) {
          this.totalCompetitiveCount = 0;
          this.selectedCompetitiveExam = '';
          this.competitivePapers = [];
          this.competitiveYearGroups = [];
          return;
        }

        if (this.selectedCompetitiveExam && exams.includes(this.selectedCompetitiveExam)) {
          this.loadCompetitivePapers();
        } else {
          this.selectedCompetitiveExam = '';
          this.competitivePapers = [];
          this.competitiveYearGroups = [];
        }
      },
      error: () => {
        if (!this.initialCompetitiveResolved) {
          this.markInitialCompetitiveResolved();
        }
        this.competitiveExams = [];
        this.totalCompetitiveCount = 0;
        this.selectedCompetitiveExam = '';
        this.competitivePapers = [];
        this.competitiveYearGroups = [];
        this.competitiveMessage = 'Failed to load competitive exams.';
      }
    });
  }

  selectCompetitiveExam(exam: string): void {
    if (this.selectedCompetitiveExam === exam && this.isLoadingCompetitivePapers) {
      return;
    }
    this.selectedCompetitiveExam = exam;
    this.loadCompetitivePapers();
  }

  loadCompetitivePapers(): void {
    if (!this.selectedCompetitiveExam) {
      this.isLoadingCompetitivePapers = false;
      this.competitivePapers = [];
      this.competitiveYearGroups = [];
      return;
    }

    const examName = this.selectedCompetitiveExam;
    const requestId = ++this.competitiveRequestId;
    this.isLoadingCompetitivePapers = true;
    this.competitiveMessage = '';
    this.competitivePapers = [];
    this.competitiveYearGroups = [];

    this.api
      .listCompetitivePapers({
        examName
      })
      .subscribe({
        next: (rows) => {
          if (requestId !== this.competitiveRequestId || this.selectedCompetitiveExam !== examName) {
            return;
          }
          this.competitivePapers = rows;
          this.buildCompetitiveYearGroups();
          this.competitiveMessage = '';
          this.isLoadingCompetitivePapers = false;
        },
        error: () => {
          if (requestId !== this.competitiveRequestId || this.selectedCompetitiveExam !== examName) {
            return;
          }
          this.competitivePapers = [];
          this.competitiveYearGroups = [];
          this.competitiveMessage = 'Failed to load competitive papers.';
          this.isLoadingCompetitivePapers = false;
        }
      });
  }

  semesterTitle(semester: number): string {
    const course = this.courseFilter || 'COURSE';
    const departmentText = this.departmentFilter ? ` ${this.departmentFilter}` : '';
    if (semester === 0) {
      return `${course}${departmentText} OTHERS PAPERS`;
    }
    return `${course}${departmentText} ${semester} SEM PAPERS`;
  }

  paperLine(paper: Paper): string {
    const exam = paper.examType ? ` - ${paper.examType}` : '';
    return `${paper.title} - ${paper.subject} - ${paper.year}${exam}`;
  }

  downloadHref(paper: Paper): string {
    const driveUrl = (paper.driveUrl || '').trim();
    if (driveUrl) {
      return this.toDriveDownloadUrl(driveUrl);
    }
    return this.api.downloadUrl(paper.id);
  }

  competitiveDownloadHref(paper: CompetitivePaper): string {
    return this.api.competitiveDownloadUrl(paper.id);
  }

  competitivePreviewHref(paper: CompetitivePaper): string {
    return this.api.competitivePreviewUrl(paper.id);
  }

  private buildSemesterGroups(): void {
    const map = new Map<number, Paper[]>();
    for (const paper of this.papers) {
      const semester = this.toSemesterValue(paper.semester);
      const group = map.get(semester);
      if (group) {
        group.push(paper);
      } else {
        map.set(semester, [paper]);
      }
    }

    for (const rows of map.values()) {
      rows.sort((a, b) => Number(b.year) - Number(a.year) || b.id - a.id);
    }

    const sortedSemesters = [...map.keys()].sort((a, b) => {
      if (a === 0) return 1;
      if (b === 0) return -1;
      return a - b;
    });

    this.semesterGroups = sortedSemesters.map((semester) => ({
      semester,
      papers: map.get(semester) || []
    }));
  }

  private buildCompetitiveYearGroups(): void {
    const map = new Map<number, CompetitivePaper[]>();
    for (const paper of this.competitivePapers) {
      const year = Number(paper.year);
      const group = map.get(year);
      if (group) {
        group.push(paper);
      } else {
        map.set(year, [paper]);
      }
    }

    for (const rows of map.values()) {
      rows.sort((a, b) => b.id - a.id);
    }

    const years = [...map.keys()].sort((a, b) => b - a);
    this.competitiveYearGroups = years.map((year) => ({
      year,
      papers: map.get(year) || []
    }));
  }

  private toSemesterValue(raw: number): number {
    const value = Number(raw);
    if (!Number.isInteger(value)) return 0;
    if (value < 1 || value > 8) return 0;
    return value;
  }

  private toDriveDownloadUrl(rawUrl: string): string {
    const fileId = this.extractDriveFileId(rawUrl);
    if (!fileId) return rawUrl;
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  private extractDriveFileId(rawUrl: string): string {
    try {
      const url = new URL(rawUrl);
      if (!url.hostname.includes('drive.google.com')) return '';
      const idFromQuery = url.searchParams.get('id');
      if (idFromQuery) return idFromQuery;
      const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
      if (pathMatch && pathMatch[1]) return pathMatch[1];
      return '';
    } catch (_error) {
      return '';
    }
  }

  hasInitialDataResolved(): boolean {
    return this.initialAcademicResolved && this.initialCompetitiveResolved;
  }

  private startWakeUpTimer(): void {
    this.clearWakeUpTimer();
    this.showWakeUpNotice = false;
    this.wakeUpTimer = setTimeout(() => {
      if (!this.hasInitialDataResolved()) {
        this.showWakeUpNotice = true;
      }
    }, 1500);
  }

  private clearWakeUpTimer(): void {
    if (this.wakeUpTimer) {
      clearTimeout(this.wakeUpTimer);
      this.wakeUpTimer = null;
    }
  }

  private markInitialAcademicResolved(): void {
    this.initialAcademicResolved = true;
    this.finishWakeUpNoticeIfReady();
  }

  private markInitialCompetitiveResolved(): void {
    this.initialCompetitiveResolved = true;
    this.finishWakeUpNoticeIfReady();
  }

  private finishWakeUpNoticeIfReady(): void {
    if (this.hasInitialDataResolved()) {
      this.showWakeUpNotice = false;
      this.clearWakeUpTimer();
    }
  }

  private syncSeo(): void {
    const focusParts = [
      this.universityFilter || 'PTU',
      this.courseFilter || 'All Courses',
      this.departmentFilter,
      this.semesterFilter ? `Semester ${this.semesterFilter}` : ''
    ].filter(Boolean);
    const focusText = focusParts.join(' ');
    const isHomePage = this.currentSeoPath === '/';
    const title = isHomePage
      ? 'PTU Question Papers, Previous Year Papers and Competitive Exam PYQs | UTpaper'
      : `${focusText} Question Papers | UTpaper`;
    const description = isHomePage
      ? 'Browse PTU and other university previous year question papers semester-wise. Download BTECH, BCA, BBA, MBA, MCA and competitive exam PYQs on UTpaper.'
      : `Browse ${focusText} previous year question papers on UTpaper. Download university PYQs and competitive exam papers in one place.`;
    const keywords = [...focusParts, 'question papers', 'previous year papers', 'PYQ', 'UTpaper'].join(', ');

    this.seo.update({
      title,
      description,
      keywords,
      path: this.currentSeoPath,
      type: 'website',
      structuredData: this.buildStructuredData(focusText, description, this.currentSeoPath)
    });
  }

  private buildStructuredData(focusText: string, description: string, path: string): Array<Record<string, unknown>> {
    const pageUrl = `https://utpaper.in${path}`;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'UTpaper',
        url: 'https://utpaper.in/'
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'UTpaper',
        url: 'https://utpaper.in/'
      },
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${focusText} Question Papers`,
        url: pageUrl,
        description
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: this.faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer
          }
        }))
      }
    ];
  }

  private applySelectionFromRoute(params: ParamMap): void {
    const universitySlug = params.get('university');
    const courseSlug = params.get('course');

    if (!universitySlug) {
      this.pickUniversity(this.universityMenus[0], false, '/');
      return;
    }

    const selectedUniversity = this.findUniversityBySlug(universitySlug) ?? this.universityMenus[0];
    const selectedCourse = courseSlug ? this.findCourseBySlug(selectedUniversity, courseSlug) : '';
    const path = this.buildAcademicPath(selectedUniversity.name, selectedCourse);

    this.activeUniversity = selectedUniversity;
    this.universityFilter = selectedUniversity.name;

    if (selectedCourse) {
      this.pickCourse(selectedCourse, false, path);
    } else {
      this.pickAllCourses(false, path);
    }
  }

  private navigateToAcademicRoute(universityName: string, course = '', shouldScroll = false): void {
    this.router.navigate(this.academicRouteLink(universityName, course)).then(() => {
      if (shouldScroll) {
        document.getElementById('directory')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  private buildAcademicPath(universityName: string, course = ''): string {
    const universitySlug = this.slugify(universityName);
    return course ? `/question-papers/${universitySlug}/${this.slugify(course)}` : `/question-papers/${universitySlug}`;
  }

  private findUniversityBySlug(slug: string): UniversityMenu | undefined {
    return this.universityMenus.find((university) => this.slugify(university.name) === slug);
  }

  private findCourseBySlug(university: UniversityMenu, slug: string): string {
    return university.courses.find((course) => this.slugify(course) === slug) || '';
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
