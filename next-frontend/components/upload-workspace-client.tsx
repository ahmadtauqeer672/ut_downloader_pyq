'use client';

import Link from 'next/link';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  deleteCompetitivePaper as removeCompetitivePaper,
  deletePaper as removePaper,
  listAdminPapers,
  listCompetitiveExams as fetchCompetitiveExams,
  listCompetitivePapers as fetchCompetitivePapers,
  updateCompetitivePaper as saveCompetitivePaper,
  updatePaper as savePaper,
  uploadCompetitivePaper,
  uploadPaper
} from '@/lib/admin-api-client';
import { competitiveDownloadHref, paperDownloadHref } from '@/lib/api';
import { BSEB_10TH_SUBJECTS, BTECH_DEPARTMENTS, SEMESTERS, UNIVERSITY_OPTIONS } from '@/lib/data';
import { competitiveExamHref, courseHref, courseSubjectHref, universityHref } from '@/lib/slug';
import { CompetitivePaper, Paper } from '@/lib/types';
import { useAdminSession } from '@/lib/use-admin-session';

interface AcademicFormState {
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

interface CompetitiveFormState {
  examName: string;
  title: string;
  year: string;
  driveUrl: string;
}

interface AcademicManageFilters {
  title: string;
  examType: string;
}

interface UploadResultRoute {
  label: string;
  href: string;
  text: string;
}

interface UploadResultState {
  message: string;
  title: string;
  source: string;
  routes: UploadResultRoute[];
}

const initialAcademicForm = (): AcademicFormState => ({
  title: '',
  university: 'PTU',
  course: '',
  department: '',
  semester: '',
  subject: '',
  year: '',
  examType: '',
  driveUrl: ''
});

const initialCompetitiveForm = (): CompetitiveFormState => ({
  examName: '',
  title: '',
  year: '',
  driveUrl: ''
});

const initialAcademicManageFilters = (): AcademicManageFilters => ({
  title: '',
  examType: ''
});

const ACADEMIC_YEAR_OPTIONS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018'] as const;

function getCourses(universityName: string): string[] {
  return UNIVERSITY_OPTIONS.find((option) => option.name === universityName)?.courses ?? [];
}

function isBtech(course: string): boolean {
  return course.trim().toUpperCase() === 'BTECH';
}

function isBsebClass(university: string, course: string): boolean {
  return university.trim().toUpperCase() === 'BIHAR BOARD (BSEB)' && course.trim().toUpperCase() === '10TH';
}

function normalizeAcademicDraftForPaper(paper: Paper): AcademicFormState {
  const isPaperBsebClass = isBsebClass(paper.university, paper.course);
  return {
    title: isPaperBsebClass ? paper.subject : paper.title,
    university: paper.university,
    course: paper.course,
    department: paper.department || '',
    semester: paper.semester ? String(paper.semester) : '',
    subject: paper.subject,
    year: String(paper.year),
    examType: isPaperBsebClass ? 'FINAL' : paper.examType,
    driveUrl: paper.driveUrl || ''
  };
}

function normalizeCompetitiveDraftForPaper(paper: CompetitivePaper): CompetitiveFormState {
  return {
    examName: paper.examName,
    title: paper.title,
    year: String(paper.year),
    driveUrl: paper.driveUrl || ''
  };
}

function buildAcademicUploadResult(form: AcademicFormState, hasLocalFile: boolean): UploadResultState {
  const routes: UploadResultRoute[] = [
    {
      label: 'University route',
      href: universityHref(form.university),
      text: form.university
    },
    {
      label: 'Course route',
      href: courseHref(form.university, form.course),
      text: `${form.university} ${form.course}`
    }
  ];

  if (isBsebClass(form.university, form.course) && form.subject.trim()) {
    routes.push({
      label: 'Subject route',
      href: courseSubjectHref(form.university, form.course, form.subject),
      text: form.subject.trim()
    });
  }

  return {
    message: 'Academic paper uploaded successfully.',
    title: form.title.trim(),
    source: hasLocalFile ? 'Local file upload' : 'Google Drive file link',
    routes
  };
}

function buildCompetitiveUploadResult(form: CompetitiveFormState, hasLocalFile: boolean): UploadResultState {
  return {
    message: 'Competitive paper uploaded successfully.',
    title: form.title.trim(),
    source: hasLocalFile ? 'Local file upload' : 'Google Drive file link',
    routes: [
      {
        label: 'Exam route',
        href: competitiveExamHref(form.examName.trim()),
        text: form.examName.trim()
      }
    ]
  };
}

function UploadResultCard({ message, title, source, routes }: UploadResultState) {
  return (
    <div className="admin-result-card">
      <div className="admin-result-head">
        <strong>{message}</strong>
        <span>Result and route links are ready.</span>
      </div>

      <div className="admin-result-grid">
        <div className="admin-result-item">
          <span>Title</span>
          <strong>{title}</strong>
        </div>

        <div className="admin-result-item">
          <span>Source</span>
          <strong>{source}</strong>
        </div>

        {routes.map((route) => (
          <div className="admin-result-item" key={route.href}>
            <span>{route.label}</span>
            <Link className="admin-route-link" href={route.href}>
              {route.text}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UploadWorkspaceClient() {
  const router = useRouter();
  const { ready, isAuthenticated, token } = useAdminSession();

  const [academicForm, setAcademicForm] = useState<AcademicFormState>(initialAcademicForm);
  const [selectedAcademicFile, setSelectedAcademicFile] = useState<File | null>(null);
  const [academicFileKey, setAcademicFileKey] = useState(0);
  const [academicMessage, setAcademicMessage] = useState('');
  const [academicError, setAcademicError] = useState('');
  const [academicResult, setAcademicResult] = useState<UploadResultState | null>(null);
  const [isUploadingAcademic, setIsUploadingAcademic] = useState(false);

  const [papers, setPapers] = useState<Paper[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [manageMessage, setManageMessage] = useState('');
  const [manageError, setManageError] = useState('');
  const [manageAcademicFilters, setManageAcademicFilters] = useState<AcademicManageFilters>(initialAcademicManageFilters);
  const [editingPaperId, setEditingPaperId] = useState<number | null>(null);
  const [editPaperDraft, setEditPaperDraft] = useState<AcademicFormState | null>(null);
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [editAcademicFileKey, setEditAcademicFileKey] = useState(0);
  const [deleteInProgressId, setDeleteInProgressId] = useState<number | null>(null);
  const [saveInProgressId, setSaveInProgressId] = useState<number | null>(null);

  const [competitiveForm, setCompetitiveForm] = useState<CompetitiveFormState>(initialCompetitiveForm);
  const [selectedCompetitiveFile, setSelectedCompetitiveFile] = useState<File | null>(null);
  const [competitiveFileKey, setCompetitiveFileKey] = useState(0);
  const [competitiveMessage, setCompetitiveMessage] = useState('');
  const [competitiveError, setCompetitiveError] = useState('');
  const [competitiveResult, setCompetitiveResult] = useState<UploadResultState | null>(null);
  const [isUploadingCompetitive, setIsUploadingCompetitive] = useState(false);

  const [competitiveExams, setCompetitiveExams] = useState<string[]>([]);
  const [competitivePapers, setCompetitivePapers] = useState<CompetitivePaper[]>([]);
  const [manageCompetitiveExamFilter, setManageCompetitiveExamFilter] = useState('');
  const [loadingCompetitivePapers, setLoadingCompetitivePapers] = useState(false);
  const [competitiveManageMessage, setCompetitiveManageMessage] = useState('');
  const [competitiveManageError, setCompetitiveManageError] = useState('');
  const [editingCompetitivePaperId, setEditingCompetitivePaperId] = useState<number | null>(null);
  const [editCompetitiveDraft, setEditCompetitiveDraft] = useState<CompetitiveFormState | null>(null);
  const [competitiveEditSelectedFile, setCompetitiveEditSelectedFile] = useState<File | null>(null);
  const [editCompetitiveFileKey, setEditCompetitiveFileKey] = useState(0);
  const [competitiveDeleteInProgressId, setCompetitiveDeleteInProgressId] = useState<number | null>(null);
  const [competitiveSaveInProgressId, setCompetitiveSaveInProgressId] = useState<number | null>(null);

  const courseOptions = getCourses(academicForm.university);
  const editCourseOptions = getCourses(editPaperDraft?.university ?? '');
  const academicCourseLabel = academicForm.university.trim().toUpperCase() === 'BIHAR BOARD (BSEB)' ? 'Class' : 'Course';
  const editCourseLabel =
    editPaperDraft?.university.trim().toUpperCase() === 'BIHAR BOARD (BSEB)' ? 'Class' : 'Course';
  const isAcademicBsebClass = isBsebClass(academicForm.university, academicForm.course);
  const isEditAcademicBsebClass = editPaperDraft ? isBsebClass(editPaperDraft.university, editPaperDraft.course) : false;

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace('/admin');
    }
  }, [ready, isAuthenticated, router]);

  useEffect(() => {
    if (ready && isAuthenticated) {
      void refreshAcademicPapers();
      void refreshCompetitiveExams();
      void refreshCompetitivePapers(manageCompetitiveExamFilter);
    }
  }, [ready, isAuthenticated]);

  async function refreshAcademicPapers(filters: AcademicManageFilters = manageAcademicFilters) {
    setLoadingPapers(true);
    try {
      const rows = await listAdminPapers(filters);
      setPapers(rows);
      setManageMessage('');
      setManageError('');

      if (editingPaperId && !rows.some((row) => row.id === editingPaperId)) {
        cancelPaperEdit();
      }
    } catch {
      setManageError('Failed to load papers.');
    } finally {
      setLoadingPapers(false);
    }
  }

  async function refreshCompetitiveExams() {
    try {
      const rows = await fetchCompetitiveExams();
      setCompetitiveExams(rows);
    } catch {
      setCompetitiveExams([]);
    }
  }

  async function refreshCompetitivePapers(examName = manageCompetitiveExamFilter) {
    setLoadingCompetitivePapers(true);
    try {
      const rows = await fetchCompetitivePapers(examName);
      setCompetitivePapers(rows);
      setCompetitiveManageMessage('');
      setCompetitiveManageError('');

      if (editingCompetitivePaperId && !rows.some((row) => row.id === editingCompetitivePaperId)) {
        cancelCompetitivePaperEdit();
      }
    } catch {
      setCompetitiveManageError('Failed to load competitive papers.');
    } finally {
      setLoadingCompetitivePapers(false);
    }
  }

  function handleAcademicUniversityChange(university: string) {
    const nextCourses = getCourses(university);
    setAcademicForm((current) => {
      const nextCourse = nextCourses.includes(current.course) ? current.course : '';
      const nextIsBseb = isBsebClass(university, nextCourse);
      return {
        ...current,
        university,
        course: nextCourse,
        title: nextIsBseb && current.subject ? current.subject : current.title,
        department: nextCourse && isBtech(nextCourse) ? current.department : '',
        semester: nextCourse && isBtech(nextCourse) ? current.semester : '',
        examType: nextIsBseb ? 'FINAL' : current.examType,
        subject:
          university.trim().toUpperCase() === 'BIHAR BOARD (BSEB)'
            ? nextIsBseb
              ? current.subject
              : ''
            : current.subject
      };
    });
  }

  function handleAcademicCourseChange(course: string) {
    setAcademicForm((current) => {
      const nextIsBseb = isBsebClass(current.university, course);
      return {
        ...current,
        course,
        title: nextIsBseb && current.subject ? current.subject : current.title,
        department: isBtech(course) ? current.department : '',
        semester: isBtech(course) ? current.semester : '',
        examType: nextIsBseb ? 'FINAL' : current.examType,
        subject:
          current.university.trim().toUpperCase() === 'BIHAR BOARD (BSEB)'
            ? nextIsBseb
              ? current.subject
              : ''
            : current.subject
      };
    });
  }

  function handleEditUniversityChange(university: string) {
    const nextCourses = getCourses(university);
    setEditPaperDraft((current) => {
      if (!current) return current;
      const nextCourse = nextCourses.includes(current.course) ? current.course : '';
      const nextIsBseb = isBsebClass(university, nextCourse);
      return {
        ...current,
        university,
        course: nextCourse,
        title: nextIsBseb && current.subject ? current.subject : current.title,
        department: nextCourse && isBtech(nextCourse) ? current.department : '',
        semester: nextCourse && isBtech(nextCourse) ? current.semester : '',
        examType: nextIsBseb ? 'FINAL' : current.examType,
        subject:
          university.trim().toUpperCase() === 'BIHAR BOARD (BSEB)'
            ? nextIsBseb
              ? current.subject
              : ''
            : current.subject
      };
    });
  }

  function handleEditCourseChange(course: string) {
    setEditPaperDraft((current) => {
      if (!current) return current;
      const nextIsBseb = isBsebClass(current.university, course);
      return {
        ...current,
        course,
        title: nextIsBseb && current.subject ? current.subject : current.title,
        department: isBtech(course) ? current.department : '',
        semester: isBtech(course) ? current.semester : '',
        examType: nextIsBseb ? 'FINAL' : current.examType,
        subject:
          current.university.trim().toUpperCase() === 'BIHAR BOARD (BSEB)'
            ? nextIsBseb
              ? current.subject
              : ''
            : current.subject
      };
    });
  }

  function resetAcademicUpload() {
    setAcademicForm(initialAcademicForm());
    setSelectedAcademicFile(null);
    setAcademicFileKey((current) => current + 1);
  }

  function resetCompetitiveUpload() {
    setCompetitiveForm(initialCompetitiveForm());
    setSelectedCompetitiveFile(null);
    setCompetitiveFileKey((current) => current + 1);
  }

  function cancelPaperEdit() {
    setEditingPaperId(null);
    setEditPaperDraft(null);
    setEditSelectedFile(null);
    setEditAcademicFileKey((current) => current + 1);
  }

  function cancelCompetitivePaperEdit() {
    setEditingCompetitivePaperId(null);
    setEditCompetitiveDraft(null);
    setCompetitiveEditSelectedFile(null);
    setEditCompetitiveFileKey((current) => current + 1);
  }

  async function handleAcademicSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAcademicMessage('');
    setAcademicError('');
    setAcademicResult(null);

    if (!selectedAcademicFile && !academicForm.driveUrl.trim()) {
      setAcademicError('Select a file or provide Google Drive file link.');
      return;
    }

    if (!academicForm.course) {
      setAcademicError('Select course.');
      return;
    }

    if (isBtech(academicForm.course) && (!academicForm.department || !academicForm.semester)) {
      setAcademicError('For BTECH, select department and semester.');
      return;
    }

    if (!/^\d{4}$/.test(academicForm.year.trim())) {
      setAcademicError('Enter a valid 4-digit year.');
      return;
    }

    setIsUploadingAcademic(true);

    try {
      const submission = { ...academicForm };
      const form = new FormData();
      form.append('title', academicForm.title);
      form.append('university', academicForm.university);
      form.append('course', academicForm.course);
      form.append('department', academicForm.department);
      form.append('semester', academicForm.semester);
      form.append('subject', academicForm.subject);
      form.append('year', academicForm.year);
      form.append('examType', academicForm.examType);
      if (selectedAcademicFile) form.append('file', selectedAcademicFile);
      if (academicForm.driveUrl.trim()) form.append('driveUrl', academicForm.driveUrl.trim());

      await uploadPaper(form, token);
      setAcademicMessage('Academic paper uploaded successfully.');
      setAcademicResult(buildAcademicUploadResult(submission, Boolean(selectedAcademicFile)));
      resetAcademicUpload();
      await refreshAcademicPapers();
    } catch (error) {
      setAcademicError(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setIsUploadingAcademic(false);
    }
  }

  function startPaperEdit(paper: Paper) {
    setEditingPaperId(paper.id);
    setEditPaperDraft(normalizeAcademicDraftForPaper(paper));
    setEditSelectedFile(null);
    setEditAcademicFileKey((current) => current + 1);
  }

  async function handlePaperEditSave(event: FormEvent<HTMLFormElement>, paper: Paper) {
    event.preventDefault();
    if (!editPaperDraft) return;

    setManageMessage('');
    setManageError('');

    if (!editPaperDraft.course) {
      setManageError('Select course before saving.');
      return;
    }

    if (isBtech(editPaperDraft.course) && (!editPaperDraft.department || !editPaperDraft.semester)) {
      setManageError('For BTECH, select department and semester before saving.');
      return;
    }

    if (!/^\d{4}$/.test(editPaperDraft.year.trim())) {
      setManageError('Enter a valid 4-digit year before saving.');
      return;
    }

    setSaveInProgressId(paper.id);

    try {
      const form = new FormData();
      form.append('title', editPaperDraft.title);
      form.append('university', editPaperDraft.university);
      form.append('course', editPaperDraft.course);
      form.append('department', editPaperDraft.department);
      form.append('semester', editPaperDraft.semester);
      form.append('subject', editPaperDraft.subject);
      form.append('year', editPaperDraft.year);
      form.append('examType', editPaperDraft.examType);
      if (editPaperDraft.driveUrl.trim()) form.append('driveUrl', editPaperDraft.driveUrl.trim());
      if (editSelectedFile) form.append('file', editSelectedFile);

      await savePaper(paper.id, form, token);
      setManageMessage('Paper updated successfully.');
      cancelPaperEdit();
      await refreshAcademicPapers();
    } catch (error) {
      setManageError(error instanceof Error ? error.message : 'Update failed.');
    } finally {
      setSaveInProgressId(null);
    }
  }

  async function handlePaperDelete(paper: Paper) {
    if (!window.confirm(`Delete "${paper.title}" permanently?`)) return;

    setDeleteInProgressId(paper.id);
    setManageMessage('');
    setManageError('');

    try {
      const response = await removePaper(paper.id, token);
      setManageMessage(response.message || 'Paper deleted successfully.');
      setPapers((current) => current.filter((row) => row.id !== paper.id));
      if (editingPaperId === paper.id) cancelPaperEdit();
    } catch (error) {
      setManageError(error instanceof Error ? error.message : 'Delete failed.');
    } finally {
      setDeleteInProgressId(null);
    }
  }

  async function handleCompetitiveSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCompetitiveMessage('');
    setCompetitiveError('');
    setCompetitiveResult(null);

    if (!competitiveForm.examName.trim() || !competitiveForm.title.trim() || !competitiveForm.year.trim()) {
      setCompetitiveError('Exam name, title and year are required.');
      return;
    }

    if (!/^\d{4}$/.test(competitiveForm.year.trim())) {
      setCompetitiveError('Enter a valid 4-digit year.');
      return;
    }

    if (!selectedCompetitiveFile && !competitiveForm.driveUrl.trim()) {
      setCompetitiveError('Select a file or provide Google Drive file link.');
      return;
    }

    setIsUploadingCompetitive(true);

    try {
      const submission = { ...competitiveForm };
      const form = new FormData();
      form.append('examName', competitiveForm.examName.trim());
      form.append('title', competitiveForm.title.trim());
      form.append('year', competitiveForm.year.trim());
      if (competitiveForm.driveUrl.trim()) form.append('driveUrl', competitiveForm.driveUrl.trim());
      if (selectedCompetitiveFile) form.append('file', selectedCompetitiveFile);

      await uploadCompetitivePaper(form, token);
      setCompetitiveMessage('Competitive paper uploaded successfully.');
      setCompetitiveResult(buildCompetitiveUploadResult(submission, Boolean(selectedCompetitiveFile)));
      resetCompetitiveUpload();
      await Promise.all([refreshCompetitiveExams(), refreshCompetitivePapers()]);
    } catch (error) {
      setCompetitiveError(error instanceof Error ? error.message : 'Competitive upload failed.');
    } finally {
      setIsUploadingCompetitive(false);
    }
  }

  function startCompetitivePaperEdit(paper: CompetitivePaper) {
    setEditingCompetitivePaperId(paper.id);
    setEditCompetitiveDraft(normalizeCompetitiveDraftForPaper(paper));
    setCompetitiveEditSelectedFile(null);
    setEditCompetitiveFileKey((current) => current + 1);
  }

  async function handleCompetitiveEditSave(event: FormEvent<HTMLFormElement>, paper: CompetitivePaper) {
    event.preventDefault();
    if (!editCompetitiveDraft) return;

    setCompetitiveManageMessage('');
    setCompetitiveManageError('');

    if (
      !editCompetitiveDraft.examName.trim() ||
      !editCompetitiveDraft.title.trim() ||
      !editCompetitiveDraft.year.trim()
    ) {
      setCompetitiveManageError('Exam name, title and year are required before saving.');
      return;
    }

    if (!/^\d{4}$/.test(editCompetitiveDraft.year.trim())) {
      setCompetitiveManageError('Enter a valid 4-digit year before saving.');
      return;
    }

    setCompetitiveSaveInProgressId(paper.id);

    try {
      const form = new FormData();
      form.append('examName', editCompetitiveDraft.examName.trim());
      form.append('title', editCompetitiveDraft.title.trim());
      form.append('year', editCompetitiveDraft.year.trim());
      if (editCompetitiveDraft.driveUrl.trim()) form.append('driveUrl', editCompetitiveDraft.driveUrl.trim());
      if (competitiveEditSelectedFile) form.append('file', competitiveEditSelectedFile);

      await saveCompetitivePaper(paper.id, form, token);
      setCompetitiveManageMessage('Competitive paper updated successfully.');
      cancelCompetitivePaperEdit();
      await Promise.all([refreshCompetitiveExams(), refreshCompetitivePapers()]);
    } catch (error) {
      setCompetitiveManageError(error instanceof Error ? error.message : 'Update failed.');
    } finally {
      setCompetitiveSaveInProgressId(null);
    }
  }

  async function handleCompetitiveDelete(paper: CompetitivePaper) {
    if (!window.confirm(`Delete "${paper.title}" permanently?`)) return;

    setCompetitiveDeleteInProgressId(paper.id);
    setCompetitiveManageMessage('');
    setCompetitiveManageError('');

    try {
      const response = await removeCompetitivePaper(paper.id, token);
      setCompetitiveManageMessage(response.message || 'Competitive paper deleted successfully.');
      setCompetitivePapers((current) => current.filter((row) => row.id !== paper.id));
      if (editingCompetitivePaperId === paper.id) cancelCompetitivePaperEdit();
      await refreshCompetitiveExams();
    } catch (error) {
      setCompetitiveManageError(error instanceof Error ? error.message : 'Delete failed.');
    } finally {
      setCompetitiveDeleteInProgressId(null);
    }
  }

  if (!ready || !isAuthenticated) {
    return (
      <section className="card admin-card">
        <p className="muted-copy">Checking admin access...</p>
      </section>
    );
  }

  return (
    <div className="admin-stack">
      <section className="card admin-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Admin workspace</p>
            <h1 className="section-title">Developer Upload (Academic)</h1>
            <p className="muted-copy">
              For BTECH, department and semester are required. Upload a file or paste a Google Drive file link.
            </p>
          </div>
          <Link className="button button--secondary" href="/admin">
            Back to Admin
          </Link>
        </div>

        <form className="admin-form-grid admin-upload-grid" onSubmit={handleAcademicSubmit}>
          <label className="filter-field">
            <span>Paper title</span>
            <input
              placeholder="e.g. Computer Science (Shift 1)"
              value={academicForm.title}
              onChange={(event) => setAcademicForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
          </label>

          <label className="filter-field">
            <span>University</span>
            <select
              value={academicForm.university}
              onChange={(event) => handleAcademicUniversityChange(event.target.value)}
              required
            >
              {UNIVERSITY_OPTIONS.map((option) => (
                <option key={option.name} value={option.name}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>{academicCourseLabel}</span>
            <select
              value={academicForm.course}
              onChange={(event) => handleAcademicCourseChange(event.target.value)}
              required
            >
              <option value="" disabled>
                {academicCourseLabel === 'Class' ? 'Select class' : 'Select course'}
              </option>
              {courseOptions.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </label>

          {isBtech(academicForm.course) ? (
            <>
              <label className="filter-field">
                <span>BTECH department</span>
                <select
                  value={academicForm.department}
                  onChange={(event) =>
                    setAcademicForm((current) => ({ ...current, department: event.target.value }))
                  }
                  required
                >
                  <option value="" disabled>
                    Select department
                  </option>
                  {BTECH_DEPARTMENTS.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </label>

              <label className="filter-field">
                <span>Semester</span>
                <select
                  value={academicForm.semester}
                  onChange={(event) => setAcademicForm((current) => ({ ...current, semester: event.target.value }))}
                  required
                >
                  <option value="" disabled>
                    Select semester
                  </option>
                  {SEMESTERS.map((semester) => (
                    <option key={semester} value={semester}>
                      Semester {semester}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          {academicForm.university.trim().toUpperCase() === 'BIHAR BOARD (BSEB)' ? (
            isBsebClass(academicForm.university, academicForm.course) ? (
              <label className="filter-field">
                <span>Subject</span>
                <select
                  value={academicForm.subject}
                  onChange={(event) =>
                    setAcademicForm((current) => ({
                      ...current,
                      subject: event.target.value,
                      title: event.target.value
                    }))
                  }
                  required
                >
                  <option value="" disabled>
                    Select subject
                  </option>
                  {BSEB_10TH_SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </label>
            ) : null
          ) : (
            <label className="filter-field">
              <span>Subject</span>
              <input
                placeholder="e.g. STET"
                value={academicForm.subject}
                onChange={(event) => setAcademicForm((current) => ({ ...current, subject: event.target.value }))}
                required
              />
            </label>
          )}

          <label className="filter-field">
            <span>Year</span>
            <select
              value={academicForm.year}
              onChange={(event) => setAcademicForm((current) => ({ ...current, year: event.target.value }))}
              required
            >
              <option value="" disabled>
                Select year
              </option>
              {ACADEMIC_YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Exam type</span>
            <input
              placeholder="e.g. Final / Mid Sem"
              value={academicForm.examType}
              onChange={(event) => setAcademicForm((current) => ({ ...current, examType: event.target.value }))}
              disabled={isAcademicBsebClass}
              readOnly={isAcademicBsebClass}
              required
            />
          </label>

          <label className="filter-field">
            <span>Google Drive file link</span>
            <input
              placeholder="https://drive.google.com/file/..."
              value={academicForm.driveUrl}
              onChange={(event) => setAcademicForm((current) => ({ ...current, driveUrl: event.target.value }))}
            />
          </label>

          <label className="filter-field">
            <span>Choose file</span>
            <input
              key={academicFileKey}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSelectedAcademicFile(event.target.files?.[0] ?? null)
              }
            />
          </label>

          <div className="button-row admin-form-actions admin-full-width">
            <button className="button button--primary admin-submit" type="submit" disabled={isUploadingAcademic}>
              {isUploadingAcademic ? 'Uploading...' : 'Submit Academic Paper'}
            </button>
            <button
              className="button button--secondary"
              type="button"
              onClick={resetAcademicUpload}
              disabled={isUploadingAcademic}
            >
              Clear
            </button>
          </div>
        </form>

        {academicMessage ? <p className="status-message status-success">{academicMessage}</p> : null}
        {academicError ? <p className="status-message status-error">{academicError}</p> : null}
        {academicResult ? <UploadResultCard {...academicResult} /> : null}
      </section>

      <section className="card admin-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Manage uploads</p>
            <h2 className="section-title">Manage Academic Papers</h2>
            <p className="muted-copy">You are logged in as admin and can filter, edit, or delete papers below.</p>
          </div>
          <button className="button button--secondary" type="button" onClick={() => void refreshAcademicPapers()}>
            Refresh
          </button>
        </div>

        <form
          className="admin-filter-row admin-filter-bar"
          onSubmit={(event) => {
            event.preventDefault();
            void refreshAcademicPapers(manageAcademicFilters);
          }}
        >
          <label className="filter-field admin-filter-field">
            <span>Paper title</span>
            <input
              placeholder="Search by paper title"
              value={manageAcademicFilters.title}
              onChange={(event) =>
                setManageAcademicFilters((current) => ({ ...current, title: event.target.value }))
              }
            />
          </label>

          <label className="filter-field admin-filter-field">
            <span>Exam type</span>
            <input
              placeholder="Search by exam type"
              value={manageAcademicFilters.examType}
              onChange={(event) =>
                setManageAcademicFilters((current) => ({ ...current, examType: event.target.value }))
              }
            />
          </label>

          <button className="button button--secondary admin-filter-submit" type="submit" disabled={loadingPapers}>
            {loadingPapers ? 'Loading...' : 'Show Results'}
          </button>

          <button
            className="button button--secondary admin-filter-submit"
            type="button"
            onClick={() => {
              const clearedFilters = initialAcademicManageFilters();
              setManageAcademicFilters(clearedFilters);
              void refreshAcademicPapers(clearedFilters);
            }}
            disabled={loadingPapers}
          >
            Clear Filters
          </button>
        </form>

        {manageMessage ? <p className="status-message status-success">{manageMessage}</p> : null}
        {manageError ? <p className="status-message status-error">{manageError}</p> : null}

        {loadingPapers ? <div className="notice-card">Loading papers...</div> : null}
        {!loadingPapers && papers.length === 0 ? <div className="notice-card">No academic papers available.</div> : null}

        {!loadingPapers && papers.length > 0 ? (
          <div className="admin-list">
            {papers.map((paper) => (
              <article className="admin-row" key={paper.id}>
                <div className="admin-row__main">
                  <div className="admin-row__meta">
                    <h3>{paper.title}</h3>
                    <p>
                      {paper.course}
                      {paper.department ? ` / ${paper.department}` : ''}
                      {paper.semester ? ` / Sem ${paper.semester}` : ''} / {paper.subject} / {paper.examType} / {paper.year}
                    </p>
                    <div className="paper-actions">
                      <a href={paperDownloadHref(paper.id)} target="_blank" rel="noreferrer">
                        Download
                      </a>
                    </div>
                  </div>

                  {editingPaperId === paper.id && editPaperDraft ? (
                    <form className="admin-form-grid admin-edit-grid" onSubmit={(event) => void handlePaperEditSave(event, paper)}>
                      <label className="filter-field">
                        <span>Paper title</span>
                        <input
                          placeholder="e.g. Computer Science (Shift 1)"
                          value={editPaperDraft.title}
                          onChange={(event) =>
                            setEditPaperDraft((current) => (current ? { ...current, title: event.target.value } : current))
                          }
                          required
                        />
                      </label>

                      <label className="filter-field">
                        <span>University</span>
                        <select
                          value={editPaperDraft.university}
                          onChange={(event) => handleEditUniversityChange(event.target.value)}
                          required
                        >
                          {UNIVERSITY_OPTIONS.map((option) => (
                            <option key={option.name} value={option.name}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="filter-field">
                        <span>{editCourseLabel}</span>
                        <select
                          value={editPaperDraft.course}
                          onChange={(event) => handleEditCourseChange(event.target.value)}
                          required
                        >
                          <option value="" disabled>
                            {editCourseLabel === 'Class' ? 'Select class' : 'Select course'}
                          </option>
                          {editCourseOptions.map((course) => (
                            <option key={course} value={course}>
                              {course}
                            </option>
                          ))}
                        </select>
                      </label>

                      {isBtech(editPaperDraft.course) ? (
                        <>
                          <label className="filter-field">
                            <span>BTECH department</span>
                            <select
                              value={editPaperDraft.department}
                              onChange={(event) =>
                                setEditPaperDraft((current) =>
                                  current ? { ...current, department: event.target.value } : current
                                )
                              }
                              required
                            >
                              <option value="" disabled>
                                Select department
                              </option>
                              {BTECH_DEPARTMENTS.map((department) => (
                                <option key={department} value={department}>
                                  {department}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="filter-field">
                            <span>Semester</span>
                            <select
                              value={editPaperDraft.semester}
                              onChange={(event) =>
                                setEditPaperDraft((current) =>
                                  current ? { ...current, semester: event.target.value } : current
                                )
                              }
                              required
                            >
                              <option value="" disabled>
                                Select semester
                              </option>
                              {SEMESTERS.map((semester) => (
                                <option key={semester} value={semester}>
                                  Semester {semester}
                                </option>
                              ))}
                            </select>
                          </label>
                        </>
                      ) : null}

                      {editPaperDraft.university.trim().toUpperCase() === 'BIHAR BOARD (BSEB)' ? (
                        isBsebClass(editPaperDraft.university, editPaperDraft.course) ? (
                          <label className="filter-field">
                            <span>Subject</span>
                            <select
                              value={editPaperDraft.subject}
                              onChange={(event) =>
                                setEditPaperDraft((current) =>
                                  current
                                    ? { ...current, subject: event.target.value, title: event.target.value }
                                    : current
                                )
                              }
                              required
                            >
                              <option value="" disabled>
                                Select subject
                              </option>
                              {BSEB_10TH_SUBJECTS.map((subject) => (
                                <option key={subject} value={subject}>
                                  {subject}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : null
                      ) : (
                        <label className="filter-field">
                          <span>Subject</span>
                          <input
                            placeholder="e.g. STET"
                            value={editPaperDraft.subject}
                            onChange={(event) =>
                              setEditPaperDraft((current) => (current ? { ...current, subject: event.target.value } : current))
                            }
                            required
                          />
                        </label>
                      )}

                      <label className="filter-field">
                        <span>Year</span>
                        <select
                          value={editPaperDraft.year}
                          onChange={(event) =>
                            setEditPaperDraft((current) => (current ? { ...current, year: event.target.value } : current))
                          }
                          required
                        >
                          <option value="" disabled>
                            Select year
                          </option>
                          {ACADEMIC_YEAR_OPTIONS.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="filter-field">
                        <span>Exam type</span>
                        <input
                          placeholder="e.g. Final / Mid Sem"
                          value={editPaperDraft.examType}
                          onChange={(event) =>
                            setEditPaperDraft((current) =>
                              current ? { ...current, examType: event.target.value } : current
                            )
                          }
                          disabled={isEditAcademicBsebClass}
                          readOnly={isEditAcademicBsebClass}
                          required
                        />
                      </label>

                      <label className="filter-field">
                        <span>New Google Drive link</span>
                        <input
                          placeholder="https://drive.google.com/file/..."
                          value={editPaperDraft.driveUrl}
                          onChange={(event) =>
                            setEditPaperDraft((current) => (current ? { ...current, driveUrl: event.target.value } : current))
                          }
                        />
                      </label>

                      <label className="filter-field">
                        <span>Replacement file</span>
                        <input
                          key={editAcademicFileKey}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            setEditSelectedFile(event.target.files?.[0] ?? null)
                          }
                        />
                      </label>

                      <p className="muted-copy admin-full-width">
                        Leave replacement file and Drive link empty to keep the current file source.
                      </p>

                      <div className="button-row admin-full-width">
                        <button
                          className="button button--primary"
                          type="submit"
                          disabled={saveInProgressId === paper.id}
                        >
                          {saveInProgressId === paper.id ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          className="button button--secondary"
                          type="button"
                          onClick={cancelPaperEdit}
                          disabled={saveInProgressId === paper.id}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>

                <div className="button-row admin-row__actions">
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => startPaperEdit(paper)}
                    disabled={saveInProgressId === paper.id}
                  >
                    {editingPaperId === paper.id ? 'Editing' : 'Edit'}
                  </button>
                  <button
                    className="button admin-danger"
                    type="button"
                    onClick={() => void handlePaperDelete(paper)}
                    disabled={deleteInProgressId === paper.id || saveInProgressId === paper.id}
                  >
                    {deleteInProgressId === paper.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="card admin-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Exam library</p>
            <h2 className="section-title">Competitive Exam Upload (Year-wise)</h2>
            <p className="muted-copy">Add exam papers like GATE, UPSC, CAT, SSC and more.</p>
          </div>
        </div>

        <form className="admin-form-grid admin-upload-grid" onSubmit={handleCompetitiveSubmit}>
          <label className="filter-field">
            <span>Exam name</span>
            <input
              placeholder="e.g. STET"
              value={competitiveForm.examName}
              onChange={(event) => setCompetitiveForm((current) => ({ ...current, examName: event.target.value }))}
              required
            />
          </label>

          <label className="filter-field">
            <span>Paper title</span>
            <input
              placeholder="e.g. Computer Science (Shift 1)"
              value={competitiveForm.title}
              onChange={(event) => setCompetitiveForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
          </label>

          <label className="filter-field">
            <span>Year</span>
            <input
              placeholder="e.g. 2024"
              value={competitiveForm.year}
              onChange={(event) => setCompetitiveForm((current) => ({ ...current, year: event.target.value }))}
              required
            />
          </label>

          <label className="filter-field">
            <span>Google Drive file link</span>
            <input
              placeholder="https://drive.google.com/file/..."
              value={competitiveForm.driveUrl}
              onChange={(event) => setCompetitiveForm((current) => ({ ...current, driveUrl: event.target.value }))}
            />
          </label>

          <label className="filter-field">
            <span>Choose file</span>
            <input
              key={competitiveFileKey}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSelectedCompetitiveFile(event.target.files?.[0] ?? null)
              }
            />
          </label>

          <div className="button-row admin-form-actions admin-full-width">
            <button className="button button--primary admin-submit" type="submit" disabled={isUploadingCompetitive}>
              {isUploadingCompetitive ? 'Uploading...' : 'Submit Competitive Paper'}
            </button>
            <button
              className="button button--secondary"
              type="button"
              onClick={resetCompetitiveUpload}
              disabled={isUploadingCompetitive}
            >
              Clear
            </button>
          </div>
        </form>

        {competitiveMessage ? <p className="status-message status-success">{competitiveMessage}</p> : null}
        {competitiveError ? <p className="status-message status-error">{competitiveError}</p> : null}
        {competitiveResult ? <UploadResultCard {...competitiveResult} /> : null}
      </section>

      <section className="card admin-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Manage uploads</p>
            <h2 className="section-title">Manage Competitive Papers</h2>
            <p className="muted-copy">Select an exam and manage uploaded competitive papers below.</p>
          </div>
          <button className="button button--secondary" type="button" onClick={() => void refreshCompetitivePapers()}>
            Refresh
          </button>
        </div>

        <form
          className="admin-filter-row admin-filter-bar"
          onSubmit={(event) => {
            event.preventDefault();
            void refreshCompetitivePapers(manageCompetitiveExamFilter);
          }}
        >
          <label className="filter-field admin-filter-field">
            <span>Exam filter</span>
            <select
              value={manageCompetitiveExamFilter}
              onChange={(event) => setManageCompetitiveExamFilter(event.target.value)}
            >
              <option value="">All Competitive Exams</option>
              {competitiveExams.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
          </label>
          <button className="button button--secondary admin-filter-submit" type="submit" disabled={loadingCompetitivePapers}>
            {loadingCompetitivePapers ? 'Loading...' : 'Show Results'}
          </button>
        </form>

        {competitiveManageMessage ? <p className="status-message status-success">{competitiveManageMessage}</p> : null}
        {competitiveManageError ? <p className="status-message status-error">{competitiveManageError}</p> : null}

        {loadingCompetitivePapers ? <div className="notice-card">Loading competitive papers...</div> : null}
        {!loadingCompetitivePapers && competitivePapers.length === 0 ? (
          <div className="notice-card">No competitive papers available.</div>
        ) : null}

        {!loadingCompetitivePapers && competitivePapers.length > 0 ? (
          <div className="admin-list">
            {competitivePapers.map((paper) => (
              <article className="admin-row" key={paper.id}>
                <div className="admin-row__main">
                  <div className="admin-row__meta">
                    <h3>{paper.title}</h3>
                    <p>
                      {paper.examName} / Year {paper.year}
                    </p>
                    <div className="paper-actions">
                      <a href={competitiveDownloadHref(paper.id)} target="_blank" rel="noreferrer">
                        Download
                      </a>
                    </div>
                  </div>

                  {editingCompetitivePaperId === paper.id && editCompetitiveDraft ? (
                    <form
                      className="admin-form-grid admin-edit-grid"
                      onSubmit={(event) => void handleCompetitiveEditSave(event, paper)}
                    >
                      <label className="filter-field">
                        <span>Exam name</span>
                        <input
                          placeholder="e.g. STET"
                          value={editCompetitiveDraft.examName}
                          onChange={(event) =>
                            setEditCompetitiveDraft((current) =>
                              current ? { ...current, examName: event.target.value } : current
                            )
                          }
                          required
                        />
                      </label>

                      <label className="filter-field">
                        <span>Paper title</span>
                        <input
                          placeholder="e.g. Computer Science (Shift 1)"
                          value={editCompetitiveDraft.title}
                          onChange={(event) =>
                            setEditCompetitiveDraft((current) =>
                              current ? { ...current, title: event.target.value } : current
                            )
                          }
                          required
                        />
                      </label>

                      <label className="filter-field">
                        <span>Year</span>
                        <input
                          placeholder="e.g. 2024"
                          value={editCompetitiveDraft.year}
                          onChange={(event) =>
                            setEditCompetitiveDraft((current) =>
                              current ? { ...current, year: event.target.value } : current
                            )
                          }
                          required
                        />
                      </label>

                      <label className="filter-field">
                        <span>New Google Drive link</span>
                        <input
                          placeholder="https://drive.google.com/file/..."
                          value={editCompetitiveDraft.driveUrl}
                          onChange={(event) =>
                            setEditCompetitiveDraft((current) =>
                              current ? { ...current, driveUrl: event.target.value } : current
                            )
                          }
                        />
                      </label>

                      <label className="filter-field">
                        <span>Replacement file</span>
                        <input
                          key={editCompetitiveFileKey}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            setCompetitiveEditSelectedFile(event.target.files?.[0] ?? null)
                          }
                        />
                      </label>

                      <p className="muted-copy admin-full-width">
                        Leave replacement file and Drive link empty to keep the current file source.
                      </p>

                      <div className="button-row admin-full-width">
                        <button
                          className="button button--primary"
                          type="submit"
                          disabled={competitiveSaveInProgressId === paper.id}
                        >
                          {competitiveSaveInProgressId === paper.id ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          className="button button--secondary"
                          type="button"
                          onClick={cancelCompetitivePaperEdit}
                          disabled={competitiveSaveInProgressId === paper.id}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>

                <div className="button-row admin-row__actions">
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => startCompetitivePaperEdit(paper)}
                    disabled={competitiveSaveInProgressId === paper.id}
                  >
                    {editingCompetitivePaperId === paper.id ? 'Editing' : 'Edit'}
                  </button>
                  <button
                    className="button admin-danger"
                    type="button"
                    onClick={() => void handleCompetitiveDelete(paper)}
                    disabled={
                      competitiveDeleteInProgressId === paper.id || competitiveSaveInProgressId === paper.id
                    }
                  >
                    {competitiveDeleteInProgressId === paper.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
