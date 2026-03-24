import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
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
      </div>
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
    </section>

    <section class="seo-intro" aria-label="Homepage introduction">
      <article class="seo-card">
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

        <div class="preset-wrap">
          <button type="button" class="preset-chip" (click)="applyPreset('PTU', 'BTECH')">PTU BTECH Papers</button>
          <button type="button" class="preset-chip" (click)="applyPreset('PTU', 'BCA')">PTU BCA Papers</button>
          <button type="button" class="preset-chip" (click)="applyPreset('PTU', 'MBA')">PTU MBA Papers</button>
          <button type="button" class="preset-chip" (click)="applyPreset('PU Chandigarh', 'BTECH')">PU BTECH Papers</button>
          <button type="button" class="preset-chip" (click)="applyPreset('GNDU', 'B.COM')">GNDU B.COM Papers</button>
          <button type="button" class="preset-chip" (click)="applyPreset('GTU', 'BPHARM')">GTU BPHARM Papers</button>
        </div>
      </article>

      <aside class="seo-card seo-side">
        <h2>Popular Searches</h2>
        <ul class="seo-list">
          <li>PTU question papers all semesters</li>
          <li>PTU BTECH previous year papers</li>
          <li>PTU BCA and MBA question papers</li>
          <li>Semester-wise university PYQ downloads</li>
          <li>Competitive exam papers year-wise</li>
        </ul>
      </aside>
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
            <h3>Academic Question Paper Directory</h3>
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
        <h2 id="homepage-faq-title">Frequently Asked Questions</h2>
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
      .hero {
        background: linear-gradient(135deg, #0f2f53, #174c7f);
        color: #e9f1ff;
        border-radius: 16px;
        padding: 1.2rem;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .eyebrow {
        margin: 0;
        font-size: 0.76rem;
        letter-spacing: 0.11em;
        text-transform: uppercase;
        opacity: 0.85;
      }
      .hero-copy {
        min-width: 0;
      }
      .hero h1 {
        margin: 0.35rem 0;
        font-size: 2rem;
        line-height: 1.15;
      }
      .hero .sub {
        margin: 0;
        max-width: 780px;
        opacity: 0.9;
      }
      .hero-note {
        margin: 0.85rem 0 0;
        max-width: 760px;
        color: rgba(233, 241, 255, 0.88);
        line-height: 1.65;
      }
      .seo-intro {
        display: grid;
        grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.9fr);
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .seo-card,
      .faq-card {
        background: #ffffff;
        border: 1px solid #dbe4ef;
        border-radius: 14px;
        padding: 1rem;
      }
      .seo-card h2,
      .faq-head h2 {
        margin: 0 0 0.65rem;
        color: #16324f;
      }
      .seo-card p,
      .faq-head p,
      .faq-item p {
        margin: 0;
        color: #4d5d70;
        line-height: 1.7;
      }
      .seo-card p + p {
        margin-top: 0.75rem;
      }
      .preset-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 0.55rem;
        margin-top: 1rem;
      }
      .preset-chip {
        border: 1px solid #cbdcf7;
        border-radius: 999px;
        padding: 0.52rem 0.82rem;
        background: #f8fbff;
        color: #0f2f7a;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }
      .preset-chip:hover {
        background: #edf5ff;
      }
      .seo-side {
        background: linear-gradient(180deg, #ffffff, #f8fbff);
      }
      .seo-list {
        margin: 0;
        padding-left: 1.1rem;
        color: #23415f;
      }
      .seo-list li + li {
        margin-top: 0.6rem;
      }
      .hero-stat-wrap {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
      .hero-stat {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 0.7rem 0.9rem;
        text-align: center;
        min-width: 120px;
      }
      .hero-stat span {
        display: block;
        font-size: 1.4rem;
        font-weight: 700;
      }
      .directory-card,
      .competitive-card {
        background: #ffffff;
        border: 1px solid #dbe4ef;
        border-radius: 14px;
        padding: 1rem;
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
        margin-bottom: 0.8rem;
      }
      .directory-card h3,
      .competitive-head h3 {
        margin: 0;
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
        border: 1px solid #e3eaf3;
        border-radius: 12px;
        padding: 0.7rem;
        background: #fbfdff;
      }
      .panel h4 {
        margin: 0 0 0.6rem;
        font-size: 0.95rem;
      }
      .panel select,
      .btech-panel select {
        width: 100%;
        border: 1px solid #d0dbe8;
        background: #ffffff;
        color: #1f2d3b;
        border-radius: 8px;
        padding: 0.58rem 0.65rem;
        cursor: pointer;
        font: inherit;
      }
      .btech-controls {
        margin-top: 0.8rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.8rem;
      }
      .btech-panel {
        border: 1px solid #e3eaf3;
        border-radius: 12px;
        padding: 0.75rem;
        background: #f8fbff;
      }
      .btech-panel h4 {
        margin: 0 0 0.55rem;
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
        border-radius: 12px;
        background: #ffffff;
        overflow: hidden;
      }
      .semester-head,
      .year-head {
        display: flex;
        justify-content: space-between;
        gap: 0.7rem;
        align-items: center;
        background: #f8fbff;
        border-bottom: 1px solid #e3eaf3;
        padding: 0.7rem 0.85rem;
      }
      .semester-head h4,
      .year-head h4 {
        margin: 0;
        color: #c15f00;
      }
      .semester-head small,
      .year-head small {
        color: #4d5d70;
      }
      .semester-list,
      .year-list {
        padding: 0.2rem 0.85rem 0.65rem;
      }
      .paper-row {
        display: flex;
        justify-content: space-between;
        gap: 0.7rem;
        align-items: center;
        border-bottom: 1px dashed #e2e8f0;
        padding: 0.65rem 0;
      }
      .paper-row:last-child {
        border-bottom: 0;
      }
      .paper-link {
        color: #0f2f7a;
        text-decoration: none;
        font-weight: 500;
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
        border-radius: 8px;
        border: 1px solid #0f766e;
        padding: 0.52rem 0.8rem;
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        background: #0f766e;
        color: #ffffff;
      }
      .competitive-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.8rem;
        margin-bottom: 0.75rem;
      }
      .competitive-head p {
        margin: 0.2rem 0 0;
        color: #4d5d70;
      }
      .exam-chip-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        margin-bottom: 0.8rem;
      }
      .exam-chip-wrap button {
        border: 1px solid #d1dbe8;
        border-radius: 999px;
        padding: 0.4rem 0.75rem;
        background: #fff;
        color: #1f2d3b;
        cursor: pointer;
      }
      .exam-chip-wrap button.active {
        background: #0f766e;
        color: #fff;
        border-color: #0f766e;
      }
      .message {
        color: #b91c1c;
      }
      .empty {
        padding: 0.95rem;
        border: 1px dashed #c2cfde;
        border-radius: 10px;
        color: #4d5d70;
        background: #ffffff;
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
        border-radius: 10px;
        border: 1px solid #0f766e;
        padding: 0.55rem 1rem;
        background: #0f766e;
        color: #fff;
        font-weight: 700;
        cursor: pointer;
      }
      .load-more button[disabled] {
        opacity: 0.65;
        cursor: not-allowed;
      }
      .faq-card {
        margin-top: 1rem;
      }
      .faq-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
        margin-bottom: 0.9rem;
      }
      .faq-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.9rem;
      }
      .faq-item {
        border: 1px solid #dbe4ef;
        border-radius: 12px;
        padding: 0.95rem;
        background: #fbfdff;
      }
      .faq-item h3 {
        margin: 0 0 0.45rem;
        color: #16324f;
        font-size: 1rem;
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
        .faq-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 840px) {
        .hero {
          flex-direction: column;
          align-items: flex-start;
        }
        .hero h1 {
          font-size: 1.65rem;
        }
        .hero-stat-wrap {
          width: 100%;
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
          padding: 0.9rem;
          gap: 0.55rem;
        }
        .hero h1 {
          font-size: 1.35rem;
        }
        .hero-stat {
          flex: 1;
          min-width: 140px;
        }
        .seo-card,
        .faq-card,
        .directory-card,
        .competitive-card {
          padding: 0.9rem 0.85rem;
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
  private readonly seo = inject(SeoService);

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
    this.pickUniversity(this.activeUniversity);
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

  pickUniversity(uni: UniversityMenu): void {
    this.activeUniversity = uni;
    this.universityFilter = uni.name;
    this.courseFilter = '';
    this.departmentFilter = '';
    this.semesterFilter = '';
    this.syncSeo();
    this.resetAndLoadPapers();
  }

  pickAllCourses(): void {
    this.courseFilter = '';
    this.departmentFilter = '';
    this.semesterFilter = '';
    this.syncSeo();
    this.resetAndLoadPapers();
  }

  pickCourse(course: string): void {
    this.courseFilter = course;
    this.departmentFilter = '';
    this.semesterFilter = '';
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
    this.syncSeo();
    this.resetAndLoadPapers();

    document.getElementById('directory')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    const title = `${focusText} Question Papers | UTpaper`;
    const description = `Browse ${focusText} previous year question papers on UTpaper. Download university PYQs and competitive exam papers in one place.`;
    const keywords = [...focusParts, 'question papers', 'previous year papers', 'PYQ', 'UTpaper'].join(', ');

    this.seo.update({
      title,
      description,
      keywords,
      path: '/',
      type: 'website',
      structuredData: this.buildStructuredData(focusText, description)
    });
  }

  private buildStructuredData(focusText: string, description: string): Array<Record<string, unknown>> {
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
        url: 'https://utpaper.in/',
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
}
