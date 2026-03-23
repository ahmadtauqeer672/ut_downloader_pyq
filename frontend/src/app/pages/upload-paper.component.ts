import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { Paper } from '../models/paper';
import { CompetitivePaper } from '../models/competitive-paper';
import {
  ACADEMIC_UNIVERSITY_OPTIONS,
  AcademicUniversityOption,
  BTECH_DEPARTMENTS,
  SEMESTERS
} from '../data/academic-options';

interface AcademicEditDraft {
  title: string;
  university: string;
  course: string;
  department: string;
  semester: string;
  subject: string;
  year: string;
  examType: string;
  driveUrl: string;
}

interface CompetitiveEditDraft {
  examName: string;
  title: string;
  year: string;
  driveUrl: string;
}

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
        <select [(ngModel)]="uploadUniversity" name="uploadUniversity" (change)="onUniversityChange()" required>
          <option value="" disabled>Select university</option>
          <option *ngFor="let u of universityOptions" [value]="u.name">{{ u.name }}</option>
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

      <p class="hint">You are logged in as admin and can edit or delete papers below.</p>
      <p *ngIf="manageMessage" class="manage-message">{{ manageMessage }}</p>

      <div class="loading" *ngIf="loadingPapers">Loading papers...</div>
      <div class="empty" *ngIf="!loadingPapers && papers.length === 0">No academic papers available.</div>

      <div class="paper-list" *ngIf="!loadingPapers && papers.length > 0">
        <article class="paper-row" *ngFor="let paper of papers">
          <div class="paper-main">
            <div class="paper-meta">
              <h4>{{ paper.title }}</h4>
              <p>
                {{ paper.course }}{{ paper.department ? ' / ' + paper.department : '' }}
                {{ paper.semester ? '/ Sem ' + paper.semester : '' }} / {{ paper.subject }} / {{ paper.year }}
              </p>
            </div>

            <form *ngIf="editingPaperId === paper.id && editPaperDraft" class="edit-grid" (submit)="savePaperEdit($event, paper)">
              <input [(ngModel)]="editPaperDraft.title" name="editTitle" placeholder="Paper Title" required />

              <select [(ngModel)]="editPaperDraft.university" name="editUniversity" (change)="onEditUniversityChange()" required>
                <option value="" disabled>Select university</option>
                <option *ngFor="let u of universityOptions" [value]="u.name">{{ u.name }}</option>
              </select>

              <select [(ngModel)]="editPaperDraft.course" name="editCourse" (change)="onEditCourseChange()" required>
                <option value="" disabled>Select course</option>
                <option *ngFor="let c of editCourseOptions" [value]="c">{{ c }}</option>
              </select>

              <select *ngIf="isEditingBtechSelected()" [(ngModel)]="editPaperDraft.department" name="editDepartment" required>
                <option value="" disabled>Select BTECH department</option>
                <option *ngFor="let d of btechDepartments" [value]="d">{{ d }}</option>
              </select>

              <select *ngIf="isEditingBtechSelected()" [(ngModel)]="editPaperDraft.semester" name="editSemester" required>
                <option value="" disabled>Select semester</option>
                <option *ngFor="let s of semesters" [value]="s">Semester {{ s }}</option>
              </select>

              <input [(ngModel)]="editPaperDraft.subject" name="editSubject" placeholder="Subject" required />
              <input [(ngModel)]="editPaperDraft.year" name="editYear" placeholder="Year" required />
              <input [(ngModel)]="editPaperDraft.examType" name="editExamType" placeholder="Exam Type" required />
              <input [(ngModel)]="editPaperDraft.driveUrl" name="editDriveUrl" placeholder="New Google Drive Link (optional)" />
              <input type="file" (change)="onEditFileChange($event)" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />

              <p class="edit-note">Leave replacement file and Drive link empty to keep the current file source.</p>

              <div class="row-actions edit-actions">
                <button type="submit" class="save-btn" [disabled]="saveInProgressId === paper.id">
                  {{ saveInProgressId === paper.id ? 'Saving...' : 'Save' }}
                </button>
                <button type="button" class="cancel-btn" (click)="cancelPaperEdit()" [disabled]="saveInProgressId === paper.id">Cancel</button>
              </div>
            </form>
          </div>

          <div class="row-actions">
            <button
              type="button"
              class="edit-btn"
              (click)="startPaperEdit(paper)"
              [disabled]="saveInProgressId === paper.id"
            >
              {{ editingPaperId === paper.id ? 'Editing' : 'Edit' }}
            </button>
            <button
              type="button"
              class="delete-btn"
              (click)="deletePaper(paper)"
              [disabled]="deleteInProgressId === paper.id || saveInProgressId === paper.id"
            >
              {{ deleteInProgressId === paper.id ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
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

      <p class="hint">Select exam (optional) and edit or delete competitive papers.</p>
      <div class="manage-grid">
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
          <div class="paper-main">
            <div class="paper-meta">
              <h4>{{ paper.title }}</h4>
              <p>{{ paper.examName }} / Year {{ paper.year }}</p>
            </div>

            <form
              *ngIf="editingCompetitivePaperId === paper.id && editCompetitiveDraft"
              class="edit-grid"
              (submit)="saveCompetitivePaperEdit($event, paper)"
            >
              <input [(ngModel)]="editCompetitiveDraft.examName" name="editCompetitiveExamName" placeholder="Exam Name" required />
              <input [(ngModel)]="editCompetitiveDraft.title" name="editCompetitiveTitle" placeholder="Paper Title" required />
              <input [(ngModel)]="editCompetitiveDraft.year" name="editCompetitiveYear" placeholder="Year (YYYY)" required />
              <input [(ngModel)]="editCompetitiveDraft.driveUrl" name="editCompetitiveDriveUrl" placeholder="New Google Drive Link (optional)" />
              <input type="file" (change)="onCompetitiveEditFileChange($event)" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />

              <p class="edit-note">Leave replacement file and Drive link empty to keep the current file source.</p>

              <div class="row-actions edit-actions">
                <button type="submit" class="save-btn" [disabled]="competitiveSaveInProgressId === paper.id">
                  {{ competitiveSaveInProgressId === paper.id ? 'Saving...' : 'Save' }}
                </button>
                <button
                  type="button"
                  class="cancel-btn"
                  (click)="cancelCompetitivePaperEdit()"
                  [disabled]="competitiveSaveInProgressId === paper.id"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          <div class="row-actions">
            <button
              type="button"
              class="edit-btn"
              (click)="startCompetitivePaperEdit(paper)"
              [disabled]="competitiveSaveInProgressId === paper.id"
            >
              {{ editingCompetitivePaperId === paper.id ? 'Editing' : 'Edit' }}
            </button>
            <button
              type="button"
              class="delete-btn"
              (click)="deleteCompetitivePaper(paper)"
              [disabled]="competitiveDeleteInProgressId === paper.id || competitiveSaveInProgressId === paper.id"
            >
              {{ competitiveDeleteInProgressId === paper.id ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
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
      .paper-main {
        flex: 1;
        min-width: 0;
      }
      .paper-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.8rem;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        background: #fff;
        padding: 0.65rem 0.75rem;
      }
      .row-actions {
        display: flex;
        gap: 0.55rem;
        flex-wrap: wrap;
        flex-shrink: 0;
      }
      .edit-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.65rem;
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px dashed #d8e1ea;
      }
      .edit-note {
        margin: 0;
        color: #64748b;
        font-size: 0.82rem;
        grid-column: 1 / -1;
      }
      .edit-actions {
        grid-column: 1 / -1;
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
      .edit-btn {
        background: #1d4ed8;
        color: #fff;
      }
      .save-btn {
        background: #15803d;
        color: #fff;
      }
      .cancel-btn {
        background: #64748b;
        color: #fff;
      }
      .delete-btn {
        background: #b91c1c;
        color: #fff;
        border: none;
        white-space: nowrap;
      }
      .edit-btn:disabled,
      .save-btn:disabled,
      .cancel-btn:disabled,
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
  readonly universityOptions = ACADEMIC_UNIVERSITY_OPTIONS;
  readonly btechDepartments = BTECH_DEPARTMENTS;
  readonly semesters = SEMESTERS;

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
  selectedFile: File | null = null;
  papers: Paper[] = [];
  loadingPapers = false;
  deleteInProgressId: number | null = null;
  saveInProgressId: number | null = null;
  editingPaperId: number | null = null;
  editPaperDraft: AcademicEditDraft | null = null;
  editSelectedFile: File | null = null;

  competitiveMessage = '';
  competitiveManageMessage = '';
  competitiveExamName = '';
  competitiveTitle = '';
  competitiveYear = '';
  competitiveDriveUrl = '';
  competitiveSelectedFile: File | null = null;
  competitivePapers: CompetitivePaper[] = [];
  competitiveExams: string[] = [];
  manageCompetitiveExamFilter = '';
  loadingCompetitivePapers = false;
  competitiveDeleteInProgressId: number | null = null;
  competitiveSaveInProgressId: number | null = null;
  editingCompetitivePaperId: number | null = null;
  editCompetitiveDraft: CompetitiveEditDraft | null = null;
  competitiveEditSelectedFile: File | null = null;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.onUniversityChange();
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

  get courseOptions(): string[] {
    return this.selectedUniversityOption?.courses ?? [];
  }

  get editCourseOptions(): string[] {
    return this.selectedEditUniversityOption?.courses ?? [];
  }

  private get selectedUniversityOption(): AcademicUniversityOption | undefined {
    return this.universityOptions.find((option) => option.name === this.uploadUniversity);
  }

  private get selectedEditUniversityOption(): AcademicUniversityOption | undefined {
    if (!this.editPaperDraft) return undefined;
    return this.universityOptions.find((option) => option.name === this.editPaperDraft?.university);
  }

  onUniversityChange(): void {
    if (!this.courseOptions.includes(this.uploadCourse)) {
      this.uploadCourse = '';
    }
    this.onCourseChange();
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

  isEditingBtechSelected(): boolean {
    return this.editPaperDraft?.course.trim().toUpperCase() === 'BTECH';
  }

  onEditFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editSelectedFile = input.files?.[0] ?? null;
  }

  onCompetitiveEditFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.competitiveEditSelectedFile = input.files?.[0] ?? null;
  }

  onEditUniversityChange(): void {
    if (!this.editPaperDraft) return;
    if (!this.editCourseOptions.includes(this.editPaperDraft.course)) {
      this.editPaperDraft.course = '';
    }
    this.onEditCourseChange();
  }

  onEditCourseChange(): void {
    if (!this.editPaperDraft) return;
    if (!this.isEditingBtechSelected()) {
      this.editPaperDraft.department = '';
      this.editPaperDraft.semester = '';
    }
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

    this.api.uploadPaper(form).subscribe({
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

  startPaperEdit(paper: Paper): void {
    this.editingPaperId = paper.id;
    this.editSelectedFile = null;
    this.editPaperDraft = {
      title: paper.title,
      university: paper.university,
      course: paper.course,
      department: paper.department || '',
      semester: paper.semester ? String(paper.semester) : '',
      subject: paper.subject,
      year: String(paper.year),
      examType: paper.examType,
      driveUrl: paper.driveUrl || ''
    };
  }

  cancelPaperEdit(): void {
    this.editingPaperId = null;
    this.editPaperDraft = null;
    this.editSelectedFile = null;
  }

  savePaperEdit(event: Event, paper: Paper): void {
    event.preventDefault();

    if (!this.editPaperDraft) {
      return;
    }

    const draft = this.editPaperDraft;
    const normalizedDriveUrl = draft.driveUrl.trim();
    if (!draft.course) {
      this.manageMessage = 'Select course before saving.';
      return;
    }

    if (this.isEditingBtechSelected() && (!draft.department || !draft.semester)) {
      this.manageMessage = 'For BTECH, select department and semester before saving.';
      return;
    }

    if (!/^\d{4}$/.test(draft.year.trim())) {
      this.manageMessage = 'Enter a valid 4-digit year before saving.';
      return;
    }

    const form = new FormData();
    form.append('title', draft.title);
    form.append('university', draft.university);
    form.append('course', draft.course);
    form.append('department', draft.department);
    form.append('semester', draft.semester);
    form.append('subject', draft.subject);
    form.append('year', draft.year);
    form.append('examType', draft.examType);
    if (normalizedDriveUrl) {
      form.append('driveUrl', normalizedDriveUrl);
    }
    if (this.editSelectedFile) {
      form.append('file', this.editSelectedFile);
    }

    this.saveInProgressId = paper.id;
    this.api.updatePaper(form, paper.id).subscribe({
      next: () => {
        this.manageMessage = 'Paper updated successfully.';
        this.cancelPaperEdit();
        this.loadUploadedPapers();
      },
      error: (err) => {
        this.manageMessage = err?.error?.message || 'Update failed.';
      },
      complete: () => {
        this.saveInProgressId = null;
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

    this.api.uploadCompetitivePaper(form).subscribe({
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

  startCompetitivePaperEdit(paper: CompetitivePaper): void {
    this.editingCompetitivePaperId = paper.id;
    this.competitiveEditSelectedFile = null;
    this.editCompetitiveDraft = {
      examName: paper.examName,
      title: paper.title,
      year: String(paper.year),
      driveUrl: paper.driveUrl || ''
    };
  }

  cancelCompetitivePaperEdit(): void {
    this.editingCompetitivePaperId = null;
    this.editCompetitiveDraft = null;
    this.competitiveEditSelectedFile = null;
  }

  saveCompetitivePaperEdit(event: Event, paper: CompetitivePaper): void {
    event.preventDefault();

    if (!this.editCompetitiveDraft) {
      return;
    }

    const draft = this.editCompetitiveDraft;
    const examName = draft.examName.trim();
    const title = draft.title.trim();
    const year = draft.year.trim();
    const driveUrl = draft.driveUrl.trim();

    if (!examName || !title || !year) {
      this.competitiveManageMessage = 'Exam name, title and year are required before saving.';
      return;
    }

    if (!/^\d{4}$/.test(year)) {
      this.competitiveManageMessage = 'Enter a valid 4-digit year before saving.';
      return;
    }

    const form = new FormData();
    form.append('examName', examName);
    form.append('title', title);
    form.append('year', year);
    if (driveUrl) {
      form.append('driveUrl', driveUrl);
    }
    if (this.competitiveEditSelectedFile) {
      form.append('file', this.competitiveEditSelectedFile);
    }

    this.competitiveSaveInProgressId = paper.id;
    this.api.updateCompetitivePaper(form, paper.id).subscribe({
      next: () => {
        this.competitiveManageMessage = 'Competitive paper updated successfully.';
        this.cancelCompetitivePaperEdit();
        this.loadCompetitiveExams();
        this.loadCompetitivePapers();
      },
      error: (err) => {
        this.competitiveManageMessage = err?.error?.message || 'Update failed.';
      },
      complete: () => {
        this.competitiveSaveInProgressId = null;
      }
    });
  }

  loadUploadedPapers(): void {
    this.loadingPapers = true;
    this.api.listPapers({}).subscribe({
      next: (rows) => {
        this.papers = rows;
        if (this.editingPaperId && !rows.some((row) => row.id === this.editingPaperId)) {
          this.cancelPaperEdit();
        }
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
          if (this.editingCompetitivePaperId && !rows.some((row) => row.id === this.editingCompetitivePaperId)) {
            this.cancelCompetitivePaperEdit();
          }
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
    const confirmed = window.confirm(`Delete "${paper.title}" permanently?`);
    if (!confirmed) return;

    this.deleteInProgressId = paper.id;
    this.api.deletePaper(paper.id).subscribe({
      next: (resp) => {
        this.manageMessage = resp.message || 'Paper deleted successfully.';
        this.papers = this.papers.filter((row) => row.id !== paper.id);
        if (this.editingPaperId === paper.id) {
          this.cancelPaperEdit();
        }
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
    const confirmed = window.confirm(`Delete "${paper.title}" permanently?`);
    if (!confirmed) return;

    this.competitiveDeleteInProgressId = paper.id;
    this.api.deleteCompetitivePaper(paper.id).subscribe({
      next: (resp) => {
        this.competitiveManageMessage = resp.message || 'Competitive paper deleted successfully.';
        this.competitivePapers = this.competitivePapers.filter((row) => row.id !== paper.id);
        if (this.editingCompetitivePaperId === paper.id) {
          this.cancelCompetitivePaperEdit();
        }
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
