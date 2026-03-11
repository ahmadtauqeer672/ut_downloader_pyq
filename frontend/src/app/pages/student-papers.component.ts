import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { Paper } from '../models/paper';
import { CompetitivePaper } from '../models/competitive-paper';

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

@Component({
  selector: 'app-student-papers',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="hero">
      <div>
        <p class="eyebrow">Academic Resource Hub</p>
        <h2>Browse Previous Year Papers</h2>
        <p class="sub">Academic papers are semester-wise. Competitive exam papers are year-wise.</p>
      </div>
      <div class="hero-stat-wrap">
        <div class="hero-stat">
          <span>{{ papers.length }}</span>
          <small>Academic Papers</small>
        </div>
        <div class="hero-stat">
          <span>{{ competitivePapers.length }}</span>
          <small>Competitive Papers</small>
        </div>
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
              <h4>Universities</h4>
              <button
                type="button"
                *ngFor="let uni of universityMenus"
                (click)="pickUniversity(uni)"
                [class.active]="universityFilter === uni.name"
              >
                {{ uni.name }}
              </button>
            </div>

            <div class="panel">
              <h4>Courses</h4>
              <button type="button" (click)="pickAllCourses()" [class.active]="courseFilter === ''">All Courses</button>
              <button
                type="button"
                *ngFor="let c of activeUniversity.courses"
                (click)="pickCourse(c)"
                [class.active]="courseFilter === c"
              >
                {{ c }}
              </button>
            </div>
          </div>

          <div class="btech-controls" *ngIf="isBtechSelected()">
            <div class="btech-panel">
              <h4>BTECH Departments</h4>
              <div class="chip-wrap">
                <button type="button" (click)="pickAllDepartments()" [class.active]="departmentFilter === ''">All Departments</button>
                <button
                  type="button"
                  *ngFor="let d of btechDepartments"
                  (click)="pickDepartment(d)"
                  [class.active]="departmentFilter === d"
                >
                  {{ d }}
                </button>
              </div>
            </div>

            <div class="btech-panel">
              <h4>Semester</h4>
              <div class="chip-wrap">
                <button type="button" (click)="pickAllSemesters()" [class.active]="semesterFilter === ''">All Semesters</button>
                <button
                  type="button"
                  *ngFor="let s of semesters"
                  (click)="pickSemester(s)"
                  [class.active]="semesterFilter === s"
                >
                  Sem {{ s }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="result-wrap">
          <p *ngIf="message" class="message">{{ message }}</p>

          <div class="semester-wrap" *ngIf="semesterGroups.length > 0; else emptyAcademic">
            <article class="semester-block" *ngFor="let group of semesterGroups">
              <header class="semester-head">
                <h4>{{ semesterTitle(group.semester) }}</h4>
                <small>{{ group.papers.length }} papers</small>
              </header>

              <div class="semester-list">
                <div class="paper-row" *ngFor="let paper of group.papers">
                  <a class="paper-link" [href]="downloadHref(paper)" target="_blank" rel="noopener">
                    {{ paperLine(paper) }}
                  </a>
                  <div class="row-actions">
                    <button type="button" class="preview" (click)="openPreview(paper)">Preview</button>
                    <a [href]="downloadHref(paper)" target="_blank" rel="noopener">Download</a>
                  </div>
                </div>
              </div>
            </article>
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
            <button type="button" class="refresh-competitive" (click)="loadCompetitiveExams()">Refresh</button>
          </header>

          <p *ngIf="competitiveMessage" class="message">{{ competitiveMessage }}</p>

          <div class="exam-chip-wrap" *ngIf="competitiveExams.length > 0; else noExam">
            <button
              type="button"
              *ngFor="let exam of competitiveExams"
              (click)="selectCompetitiveExam(exam)"
              [class.active]="selectedCompetitiveExam === exam"
            >
              {{ exam }}
            </button>
          </div>

          <ng-template #noExam>
            <div class="empty">No competitive exams uploaded yet.</div>
          </ng-template>

          <div class="competitive-year-wrap" *ngIf="selectedCompetitiveExam && competitiveYearGroups.length > 0">
            <article class="year-block" *ngFor="let group of competitiveYearGroups">
              <header class="year-head">
                <h4>{{ selectedCompetitiveExam }} {{ group.year }} PAPERS</h4>
                <small>{{ group.papers.length }} papers</small>
              </header>

              <div class="year-list">
                <div class="paper-row" *ngFor="let paper of group.papers">
                  <a class="paper-link" [href]="competitiveDownloadHref(paper)" target="_blank" rel="noopener">
                    {{ paper.title }} - {{ paper.year }}
                  </a>
                  <div class="row-actions">
                    <a class="preview-link" [href]="competitivePreviewHref(paper)" target="_blank" rel="noopener">Open</a>
                    <a [href]="competitiveDownloadHref(paper)" target="_blank" rel="noopener">Download</a>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div class="empty" *ngIf="selectedCompetitiveExam && competitiveYearGroups.length === 0">
            No papers found for {{ selectedCompetitiveExam }}.
          </div>
        </section>
      </div>
    </section>

    <section class="preview-overlay" *ngIf="previewPaper" (click)="closePreview()">
      <article class="preview-modal" (click)="$event.stopPropagation()">
        <header>
          <h3>{{ previewPaper.title }}</h3>
          <button type="button" (click)="closePreview()">Close</button>
        </header>

        <div class="preview-body">
          <iframe
            *ngIf="previewType(previewPaper) === 'pdf'"
            [src]="api.previewUrl(previewPaper.id)"
            title="PDF Preview"
          ></iframe>

          <img
            *ngIf="previewType(previewPaper) === 'image'"
            [src]="api.previewUrl(previewPaper.id)"
            alt="Paper preview"
          />

          <div class="unsupported" *ngIf="previewType(previewPaper) === 'other'">
            Preview not supported for this file type. Use download.
          </div>
        </div>
      </article>
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
      .hero h2 {
        margin: 0.35rem 0;
        font-size: 1.6rem;
      }
      .hero .sub {
        margin: 0;
        max-width: 780px;
        opacity: 0.9;
      }
      .hero > div:first-child {
        min-width: 0;
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
      .panel button {
        width: 100%;
        margin-bottom: 0.45rem;
        border: 1px solid #d0dbe8;
        background: #ffffff;
        color: #1f2d3b;
        border-radius: 8px;
        padding: 0.58rem 0.65rem;
        text-align: left;
        cursor: pointer;
      }
      .panel button.active {
        background: #0f766e;
        color: #ffffff;
        border-color: #0f766e;
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
      .chip-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
      }
      .chip-wrap button {
        border: 1px solid #d1dbe8;
        border-radius: 999px;
        padding: 0.38rem 0.68rem;
        background: #fff;
        color: #1f2d3b;
        cursor: pointer;
      }
      .chip-wrap button.active {
        background: #0f766e;
        color: #fff;
        border-color: #0f766e;
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
        flex-shrink: 0;
      }
      .row-actions button,
      .row-actions a {
        border-radius: 8px;
        border: 1px solid #0f766e;
        padding: 0.45rem 0.7rem;
        text-decoration: none;
        font-size: 0.84rem;
        font-weight: 600;
        cursor: pointer;
      }
      .row-actions button,
      .row-actions .preview-link {
        background: #ffffff;
        color: #0f766e;
      }
      .row-actions a {
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
      .refresh-competitive {
        border: 1px solid #0f766e;
        background: #0f766e;
        color: #fff;
        border-radius: 8px;
        padding: 0.5rem 0.72rem;
        font-weight: 600;
        cursor: pointer;
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
      .preview-overlay {
        position: fixed;
        inset: 0;
        background: rgba(7, 16, 29, 0.6);
        display: grid;
        place-items: center;
        z-index: 80;
        padding: 1rem;
      }
      .preview-modal {
        width: min(1000px, 95vw);
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #d5dfeb;
      }
      .preview-modal header {
        padding: 0.65rem 0.8rem;
        border-bottom: 1px solid #e4eaf3;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.8rem;
      }
      .preview-modal h3 {
        margin: 0;
        font-size: 1rem;
      }
      .preview-modal header button {
        border: 1px solid #c7d3e1;
        background: #ffffff;
        border-radius: 8px;
        padding: 0.4rem 0.65rem;
        cursor: pointer;
      }
      .preview-body {
        height: min(78vh, 760px);
        background: #f8fafc;
      }
      .preview-body iframe,
      .preview-body img {
        width: 100%;
        height: 100%;
        border: 0;
        display: block;
        object-fit: contain;
      }
      .unsupported {
        display: grid;
        place-items: center;
        height: 100%;
        color: #475569;
      }
      @media (max-width: 1080px) {
        .content-columns {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 840px) {
        .hero {
          flex-direction: column;
          align-items: flex-start;
        }
        .hero-stat-wrap {
          width: 100%;
        }
        .directory-grid,
        .btech-controls {
          grid-template-columns: 1fr;
        }
        .paper-row {
          flex-direction: column;
          align-items: flex-start;
        }
        .competitive-head {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `
  ]
})
export class StudentPapersComponent implements OnInit {
  papers: Paper[] = [];
  semesterGroups: SemesterGroup[] = [];
  message = '';
  previewPaper: Paper | null = null;

  competitiveExams: string[] = [];
  selectedCompetitiveExam = '';
  competitivePapers: CompetitivePaper[] = [];
  competitiveYearGroups: CompetitiveYearGroup[] = [];
  competitiveMessage = '';

  universityFilter = '';
  courseFilter = '';
  departmentFilter = '';
  semesterFilter = '';

  readonly btechDepartments = ['CSE', 'CIVIL', 'ELECTRONICS', 'ELECTRICAL', 'MECHANICAL'];
  readonly semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

  universityMenus: UniversityMenu[] = [
    { name: 'PTU', courses: ['BTECH', 'BCA', 'BBA', 'MBA', 'MCA'] },
    { name: 'PU Chandigarh', courses: ['BTECH', 'BSC', 'BCA', 'MTECH'] },
    { name: 'GNDU', courses: ['BTECH', 'B.COM', 'MCA', 'MSC-IT'] },
    { name: 'MDU', courses: ['BTECH', 'BBA', 'MTECH', 'MBA'] },
    { name: 'GTU', courses: ['BTECH', 'BPHARM', 'MBA', 'MCA'] }
  ];

  activeUniversity: UniversityMenu = this.universityMenus[0];

  constructor(public readonly api: ApiService) {}

  ngOnInit(): void {
    this.pickUniversity(this.activeUniversity);
    this.loadCompetitiveExams();
  }

  isBtechSelected(): boolean {
    return this.courseFilter.trim().toUpperCase() === 'BTECH';
  }

  pickUniversity(uni: UniversityMenu): void {
    this.activeUniversity = uni;
    this.universityFilter = uni.name;
    this.courseFilter = '';
    this.departmentFilter = '';
    this.semesterFilter = '';
    this.loadPapers();
  }

  pickAllCourses(): void {
    this.courseFilter = '';
    this.departmentFilter = '';
    this.semesterFilter = '';
    this.loadPapers();
  }

  pickCourse(course: string): void {
    this.courseFilter = course;
    this.departmentFilter = '';
    this.semesterFilter = '';
    this.loadPapers();
  }

  pickAllDepartments(): void {
    this.departmentFilter = '';
    this.loadPapers();
  }

  pickDepartment(department: string): void {
    this.departmentFilter = department;
    this.loadPapers();
  }

  pickAllSemesters(): void {
    this.semesterFilter = '';
    this.loadPapers();
  }

  pickSemester(semester: string): void {
    this.semesterFilter = semester;
    this.loadPapers();
  }

  loadPapers(): void {
    this.api
      .listPapers({
        university: this.universityFilter,
        course: this.courseFilter,
        department: this.departmentFilter,
        semester: this.semesterFilter
      })
      .subscribe({
        next: (rows) => {
          this.papers = rows;
          this.buildSemesterGroups();
          this.message = '';
        },
        error: () => {
          this.papers = [];
          this.semesterGroups = [];
          this.message = 'Failed to load papers.';
        }
      });
  }

  loadCompetitiveExams(): void {
    this.api.listCompetitiveExams().subscribe({
      next: (rows) => {
        this.competitiveExams = rows;
        if (!rows.length) {
          this.selectedCompetitiveExam = '';
          this.competitivePapers = [];
          this.competitiveYearGroups = [];
          return;
        }

        if (!this.selectedCompetitiveExam || !rows.includes(this.selectedCompetitiveExam)) {
          this.selectedCompetitiveExam = rows[0];
        }
        this.loadCompetitivePapers();
      },
      error: () => {
        this.competitiveExams = [];
        this.selectedCompetitiveExam = '';
        this.competitivePapers = [];
        this.competitiveYearGroups = [];
        this.competitiveMessage = 'Failed to load competitive exams.';
      }
    });
  }

  selectCompetitiveExam(exam: string): void {
    this.selectedCompetitiveExam = exam;
    this.loadCompetitivePapers();
  }

  loadCompetitivePapers(): void {
    if (!this.selectedCompetitiveExam) {
      this.competitivePapers = [];
      this.competitiveYearGroups = [];
      return;
    }

    this.api
      .listCompetitivePapers({
        examName: this.selectedCompetitiveExam
      })
      .subscribe({
        next: (rows) => {
          this.competitivePapers = rows;
          this.buildCompetitiveYearGroups();
          this.competitiveMessage = '';
        },
        error: () => {
          this.competitivePapers = [];
          this.competitiveYearGroups = [];
          this.competitiveMessage = 'Failed to load competitive papers.';
        }
      });
  }

  openPreview(paper: Paper): void {
    const driveUrl = (paper.driveUrl || '').trim();
    if (driveUrl) {
      window.open(driveUrl, '_blank', 'noopener');
      return;
    }
    this.previewPaper = paper;
  }

  closePreview(): void {
    this.previewPaper = null;
  }

  previewType(paper: Paper): 'pdf' | 'image' | 'other' {
    const lower = (paper.fileName || paper.fileUrl || '').toLowerCase().split('?')[0];
    if (lower.endsWith('.pdf')) return 'pdf';
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image';
    return 'other';
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
}
