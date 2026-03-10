import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { Paper } from '../models/paper';
import { CompetitivePaper } from '../models/competitive-paper';

@Component({
  selector: 'app-upload-paper',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="card">
      <h2>Developer Upload (Academic)</h2>
      <p class="hint">For BTECH, department and semester are required. Upload file or paste Google Drive file link.</p>

      <form (submit)="uploadAcademic($event)" class="grid">
        <input [(ngModel)]="uploadTitle" name="uploadTitle" placeholder="Paper Title" required />
        <select [(ngModel)]="uploadUniversity" name="uploadUniversity" required>
          <option value="" disabled>Select university</option>
          <option *ngFor="let u of universityOptions" [value]="u">{{ u }}</option>
        </select>

        <select [(ngModel)]="uploadCourse" name="uploadCourse" (change)="onCourseChange()" required>
          <option value="" disabled>Select course</option>
          <option *ngFor="let c of courseOptions" [value]="c">{{ c }}</option>
        </select>

        <select *ngIf="isBtechSelected()" [(ngModel)]="uploadDepartment" name="uploadDepartment" required>
          <option value="" disabled>Select BTECH department</option>
          <option *ngFor="let d of btechDepartments" [value]="d">{{ d }}</option>
        </select>

        <select *ngIf="isBtechSelected()" [(ngModel)]="uploadSemester" name="uploadSemester" required>
          <option value="" disabled>Select semester</option>
          <option *ngFor="let s of semesters" [value]="s">Semester {{ s }}</option>
        </select>

        <input [(ngModel)]="uploadSubject" name="uploadSubject" placeholder="Subject" required />
        <input [(ngModel)]="uploadYear" name="uploadYear" placeholder="Year" required />
        <input [(ngModel)]="uploadExamType" name="uploadExamType" placeholder="Exam Type" required />
        <input [(ngModel)]="uploadDriveUrl" name="uploadDriveUrl" placeholder="Google Drive File Link (optional)" />
        <input [(ngModel)]="adminKey" name="adminKey" type="password" placeholder="Admin Key" required />
        <input type="file" (change)="onFileChange($event)" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
        <button type="submit">Upload Academic Paper</button>
      </form>

      <p *ngIf="message" class="message">{{ message }}</p>
    </section>

    <section class="card">
      <div class="manage-head">
        <h3>Manage Academic Papers</h3>
        <button type="button" class="refresh-btn" (click)="loadUploadedPapers()">Refresh</button>
      </div>

      <p class="hint">Enter Admin Key for delete access.</p>
      <div class="manage-auth">
        <input
          [(ngModel)]="manageAdminKey"
          name="manageAdminKey"
          type="password"
          placeholder="Admin Key for Academic Delete"
        />
      </div>
      <p *ngIf="manageMessage" class="manage-message">{{ manageMessage }}</p>

      <div class="loading" *ngIf="loadingPapers">Loading papers...</div>
      <div class="empty" *ngIf="!loadingPapers && papers.length === 0">No academic papers available.</div>

      <div class="paper-list" *ngIf="!loadingPapers && papers.length > 0">
        <article class="paper-row" *ngFor="let paper of papers">
          <div class="paper-meta">
            <h4>{{ paper.title }}</h4>
            <p>
              {{ paper.course }}{{ paper.department ? ' / ' + paper.department : '' }}
              {{ paper.semester ? '/ Sem ' + paper.semester : '' }} / {{ paper.subject }} / {{ paper.year }}
            </p>
          </div>
          <button
            type="button"
            class="delete-btn"
            (click)="deletePaper(paper)"
            [disabled]="deleteInProgressId === paper.id"
          >
            {{ deleteInProgressId === paper.id ? 'Deleting...' : 'Delete' }}
          </button>
        </article>
      </div>
    </section>

    <section class="card">
      <h2>Competitive Exam Upload (Year-wise)</h2>
      <p class="hint">Add exam papers like GATE, UPSC, CAT, SSC etc. Students will see papers grouped by year.</p>

      <form (submit)="uploadCompetitive($event)" class="grid">
        <input [(ngModel)]="competitiveExamName" name="competitiveExamName" placeholder="Exam Name (e.g. GATE CSE)" required />
        <input [(ngModel)]="competitiveTitle" name="competitiveTitle" placeholder="Paper Title" required />
        <input [(ngModel)]="competitiveYear" name="competitiveYear" placeholder="Year (YYYY)" required />
        <input [(ngModel)]="competitiveDriveUrl" name="competitiveDriveUrl" placeholder="Google Drive File Link (optional)" />
        <input [(ngModel)]="competitiveAdminKey" name="competitiveAdminKey" type="password" placeholder="Admin Key" required />
        <input type="file" (change)="onCompetitiveFileChange($event)" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
        <button type="submit">Upload Competitive Paper</button>
      </form>

      <p *ngIf="competitiveMessage" class="message">{{ competitiveMessage }}</p>
    </section>

    <section class="card">
      <div class="manage-head">
        <h3>Manage Competitive Papers</h3>
        <button type="button" class="refresh-btn" (click)="loadCompetitivePapers()">Refresh</button>
      </div>

      <p class="hint">Select exam (optional) and delete old competitive papers.</p>
      <div class="manage-grid">
        <input
          [(ngModel)]="manageCompetitiveAdminKey"
          name="manageCompetitiveAdminKey"
          type="password"
          placeholder="Admin Key for Competitive Delete"
        />
        <select [(ngModel)]="manageCompetitiveExamFilter" name="manageCompetitiveExamFilter" (change)="loadCompetitivePapers()">
          <option value="">All Competitive Exams</option>
          <option *ngFor="let exam of competitiveExams" [value]="exam">{{ exam }}</option>
        </select>
      </div>

      <p *ngIf="competitiveManageMessage" class="manage-message">{{ competitiveManageMessage }}</p>
      <div class="loading" *ngIf="loadingCompetitivePapers">Loading competitive papers...</div>
      <div class="empty" *ngIf="!loadingCompetitivePapers && competitivePapers.length === 0">No competitive papers available.</div>

      <div class="paper-list" *ngIf="!loadingCompetitivePapers && competitivePapers.length > 0">
        <article class="paper-row" *ngFor="let paper of competitivePapers">
          <div class="paper-meta">
            <h4>{{ paper.title }}</h4>
            <p>{{ paper.examName }} / Year {{ paper.year }}</p>
          </div>
          <button
            type="button"
            class="delete-btn"
            (click)="deleteCompetitivePaper(paper)"
            [disabled]="competitiveDeleteInProgressId === paper.id"
          >
            {{ competitiveDeleteInProgressId === paper.id ? 'Deleting...' : 'Delete' }}
          </button>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
      .card {
        background: #ffffff;
        border: 1px solid #d8dee6;
        border-radius: 12px;
        padding: 1.1rem;
        margin-bottom: 1rem;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
        gap: 0.75rem;
      }
      .manage-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 0.75rem;
      }
      input,
      select,
      button {
        padding: 0.65rem;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        background: #fff;
      }
      button {
        border: none;
        background: #1ea84a;
        color: #fff;
        cursor: pointer;
      }
      .hint {
        color: #475569;
      }
      .message {
        color: #0f766e;
        margin-top: 0.75rem;
      }
      .manage-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.7rem;
      }
      .manage-head h3 {
        margin: 0;
      }
      .refresh-btn {
        background: #0f766e;
        color: #fff;
      }
      .manage-message {
        color: #0f766e;
        margin: 0.55rem 0;
      }
      .manage-auth {
        margin: 0.55rem 0 0;
      }
      .loading,
      .empty {
        border: 1px dashed #cbd5e1;
        border-radius: 10px;
        padding: 0.65rem;
        color: #475569;
        background: #f8fafc;
      }
      .paper-list {
        margin-top: 0.6rem;
        display: grid;
        gap: 0.55rem;
      }
      .paper-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.8rem;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        background: #fff;
        padding: 0.65rem 0.75rem;
      }
      .paper-meta h4 {
        margin: 0;
        font-size: 0.95rem;
      }
      .paper-meta p {
        margin: 0.2rem 0 0;
        color: #475569;
        font-size: 0.84rem;
      }
      .delete-btn {
        background: #b91c1c;
        color: #fff;
        border: none;
        white-space: nowrap;
      }
      .delete-btn:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }
      @media (max-width: 700px) {
        .paper-row {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `
  ]
})
export class UploadPaperComponent implements OnInit {
  readonly universityOptions = ['PTU', 'PU Chandigarh', 'GNDU', 'MDU', 'GTU', 'OTHER'];
  readonly courseOptions = ['BTECH', 'BCA', 'BBA', 'MBA', 'MCA', 'MTECH', 'BSC', 'B.COM', 'OTHER'];
  readonly btechDepartments = ['CSE', 'CIVIL', 'ELECTRONICS', 'ELECTRICAL', 'MECHANICAL'];
  readonly semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

  message = '';
  manageMessage = '';
  uploadTitle = '';
  uploadUniversity = 'PTU';
  uploadCourse = '';
  uploadDepartment = '';
  uploadSemester = '';
  uploadSubject = '';
  uploadYear = '';
  uploadExamType = '';
  uploadDriveUrl = '';
  adminKey = '';
  manageAdminKey = '';
  selectedFile: File | null = null;
  papers: Paper[] = [];
  loadingPapers = false;
  deleteInProgressId: number | null = null;

  competitiveMessage = '';
  competitiveManageMessage = '';
  competitiveExamName = '';
  competitiveTitle = '';
  competitiveYear = '';
  competitiveDriveUrl = '';
  competitiveAdminKey = '';
  competitiveSelectedFile: File | null = null;
  competitivePapers: CompetitivePaper[] = [];
  competitiveExams: string[] = [];
  manageCompetitiveAdminKey = '';
  manageCompetitiveExamFilter = '';
  loadingCompetitivePapers = false;
  competitiveDeleteInProgressId: number | null = null;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadUploadedPapers();
    this.loadCompetitiveExams();
    this.loadCompetitivePapers();
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  onCompetitiveFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.competitiveSelectedFile = input.files?.[0] ?? null;
  }

  onCourseChange(): void {
    if (!this.isBtechSelected()) {
      this.uploadDepartment = '';
      this.uploadSemester = '';
    }
  }

  isBtechSelected(): boolean {
    return this.uploadCourse.trim().toUpperCase() === 'BTECH';
  }

  uploadAcademic(event: Event): void {
    event.preventDefault();

    const normalizedDriveUrl = this.uploadDriveUrl.trim();
    if (!this.selectedFile && !normalizedDriveUrl) {
      this.message = 'Select a file or provide Google Drive file link.';
      return;
    }

    if (!this.uploadCourse) {
      this.message = 'Select course.';
      return;
    }

    if (this.isBtechSelected() && (!this.uploadDepartment || !this.uploadSemester)) {
      this.message = 'For BTECH, select department and semester.';
      return;
    }

    if (!/^\d{4}$/.test(this.uploadYear.trim())) {
      this.message = 'Enter a valid 4-digit year.';
      return;
    }

    const form = new FormData();
    form.append('title', this.uploadTitle);
    form.append('university', this.uploadUniversity);
    form.append('course', this.uploadCourse);
    form.append('department', this.uploadDepartment);
    form.append('semester', this.uploadSemester);
    form.append('subject', this.uploadSubject);
    form.append('year', this.uploadYear);
    form.append('examType', this.uploadExamType);
    if (this.selectedFile) {
      form.append('file', this.selectedFile);
    }
    if (normalizedDriveUrl) {
      form.append('driveUrl', normalizedDriveUrl);
    }

    this.api.uploadPaper(form, this.adminKey).subscribe({
      next: () => {
        this.message = 'Academic paper uploaded successfully.';
        this.uploadTitle = '';
        this.uploadUniversity = 'PTU';
        this.uploadCourse = '';
        this.uploadDepartment = '';
        this.uploadSemester = '';
        this.uploadSubject = '';
        this.uploadYear = '';
        this.uploadExamType = '';
        this.uploadDriveUrl = '';
        this.selectedFile = null;
        this.loadUploadedPapers();
      },
      error: (err) => {
        this.message = err?.error?.message || 'Upload failed.';
      }
    });
  }

  uploadCompetitive(event: Event): void {
    event.preventDefault();

    const exam = this.competitiveExamName.trim();
    const title = this.competitiveTitle.trim();
    const year = this.competitiveYear.trim();
    const driveUrl = this.competitiveDriveUrl.trim();

    if (!exam || !title || !year) {
      this.competitiveMessage = 'Exam name, title and year are required.';
      return;
    }

    if (!/^\d{4}$/.test(year)) {
      this.competitiveMessage = 'Enter a valid 4-digit year.';
      return;
    }

    if (!this.competitiveSelectedFile && !driveUrl) {
      this.competitiveMessage = 'Select a file or provide Google Drive file link.';
      return;
    }

    const form = new FormData();
    form.append('examName', exam);
    form.append('title', title);
    form.append('year', year);
    if (driveUrl) {
      form.append('driveUrl', driveUrl);
    }
    if (this.competitiveSelectedFile) {
      form.append('file', this.competitiveSelectedFile);
    }

    this.api.uploadCompetitivePaper(form, this.competitiveAdminKey).subscribe({
      next: () => {
        this.competitiveMessage = 'Competitive paper uploaded successfully.';
        this.competitiveExamName = '';
        this.competitiveTitle = '';
        this.competitiveYear = '';
        this.competitiveDriveUrl = '';
        this.competitiveSelectedFile = null;
        this.loadCompetitiveExams();
        this.loadCompetitivePapers();
      },
      error: (err) => {
        this.competitiveMessage = err?.error?.message || 'Competitive upload failed.';
      }
    });
  }

  loadUploadedPapers(): void {
    this.loadingPapers = true;
    this.api.listPapers({}).subscribe({
      next: (rows) => {
        this.papers = rows;
        this.manageMessage = '';
        this.loadingPapers = false;
      },
      error: () => {
        this.manageMessage = 'Failed to load papers.';
        this.loadingPapers = false;
      }
    });
  }

  loadCompetitiveExams(): void {
    this.api.listCompetitiveExams().subscribe({
      next: (rows) => {
        this.competitiveExams = rows;
      },
      error: () => {
        this.competitiveExams = [];
      }
    });
  }

  loadCompetitivePapers(): void {
    this.loadingCompetitivePapers = true;
    this.api
      .listCompetitivePapers({
        examName: this.manageCompetitiveExamFilter
      })
      .subscribe({
        next: (rows) => {
          this.competitivePapers = rows;
          this.competitiveManageMessage = '';
          this.loadingCompetitivePapers = false;
        },
        error: () => {
          this.competitiveManageMessage = 'Failed to load competitive papers.';
          this.loadingCompetitivePapers = false;
        }
      });
  }

  deletePaper(paper: Paper): void {
    const key = this.manageAdminKey.trim();
    if (!key) {
      this.manageMessage = 'Enter Admin Key in manage section before deleting.';
      return;
    }

    const confirmed = window.confirm(`Delete "${paper.title}" permanently?`);
    if (!confirmed) return;

    this.deleteInProgressId = paper.id;
    this.api.deletePaper(paper.id, key).subscribe({
      next: (resp) => {
        this.manageMessage = resp.message || 'Paper deleted successfully.';
        this.papers = this.papers.filter((row) => row.id !== paper.id);
      },
      error: (err) => {
        this.manageMessage = err?.error?.message || 'Delete failed.';
      },
      complete: () => {
        this.deleteInProgressId = null;
      }
    });
  }

  deleteCompetitivePaper(paper: CompetitivePaper): void {
    const key = this.manageCompetitiveAdminKey.trim();
    if (!key) {
      this.competitiveManageMessage = 'Enter Admin Key in competitive manage section before deleting.';
      return;
    }

    const confirmed = window.confirm(`Delete "${paper.title}" permanently?`);
    if (!confirmed) return;

    this.competitiveDeleteInProgressId = paper.id;
    this.api.deleteCompetitivePaper(paper.id, key).subscribe({
      next: (resp) => {
        this.competitiveManageMessage = resp.message || 'Competitive paper deleted successfully.';
        this.competitivePapers = this.competitivePapers.filter((row) => row.id !== paper.id);
        this.loadCompetitiveExams();
      },
      error: (err) => {
        this.competitiveManageMessage = err?.error?.message || 'Delete failed.';
      },
      complete: () => {
        this.competitiveDeleteInProgressId = null;
      }
    });
  }
}
