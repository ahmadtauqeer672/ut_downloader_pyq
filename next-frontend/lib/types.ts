export interface Paper {
  id: number;
  title: string;
  university: string;
  course: string;
  department: string;
  semester: number;
  subject: string;
  year: number;
  examType: string;
  fileName: string;
  driveUrl?: string;
  fileUrl?: string;
  filePublicId?: string;
  uploadedAt: string;
}

export interface CompetitivePaper {
  id: number;
  title: string;
  examName: string;
  year: number;
  fileName: string;
  driveUrl?: string;
  fileUrl?: string;
  filePublicId?: string;
  uploadedAt: string;
}

export interface CompetitiveSummary {
  exams: string[];
  totalCount: number;
}

export interface UniversityOption {
  name: string;
  courses: string[];
}

export interface SemesterGroup {
  semester: number;
  papers: Paper[];
}

export interface YearGroup {
  year: number;
  papers: CompetitivePaper[];
}

export type TestKind = 'exam' | 'subject' | 'pyq';
export type TestDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface TestSeries {
  id: number;
  slug: string;
  title: string;
  examName: string;
  category: string;
  logoUrl: string;
  ownLogoUrl: string;
  description: string;
  isPublished: boolean;
  createdAt: string;
  testCount: number;
  examTestCount: number;
  subjectTestCount: number;
  pyqTestCount: number;
  studentCount: number;
  // Older API responses may not include these yet.
  attemptCount?: number;
  languages?: string[];
}

// A group of questions in an exam-style test. Qualifying sections must reach passPercent of their
// marks but are left out of the merit score (e.g. the Language part of BPSC TRE).
export interface TestSection {
  name: string;
  qualifying: boolean;
  passPercent: number;
}

export interface SectionScore extends TestSection {
  correct: number;
  wrong: number;
  skipped: number;
  unmarked: number;
  total: number;
  score: number;
  maxScore: number;
  passed: boolean;
}

// Answer value for the explicit "question not attempted" choice.
export const NOT_ATTEMPTED = -1;

export interface MockTest {
  id: number;
  seriesId: number;
  title: string;
  kind: TestKind;
  category: string;
  language: string;
  difficulty: TestDifficulty;
  durationMinutes: number;
  marksPerQuestion: number;
  negativeMarks: number;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  questionCount: number;
  attemptCount: number;
  seriesTitle?: string;
  seriesSlug?: string;
  sections?: TestSection[];
  // BPSC-style: an extra "not attempted" option; questions left completely blank are penalised.
  notAttemptedOption?: boolean;
}

export interface TestSeriesDetail extends TestSeries {
  tests: MockTest[];
}

// Crawlable preview of a test for its landing page (no answers).
export interface TestPreview {
  sampleQuestions: { position: number; section: string; question: string; options: string[] }[];
  sectionCounts: { name: string; count: number }[];
}

export interface TestQuestion {
  id: number;
  position: number;
  section?: string;
  question: string;
  options: string[];
  imageUrl?: string;
  optionImages?: string[];
  correctIndex?: number;
  explanation?: string;
}

export interface StudentProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface StudentSession {
  token: string;
  expiresAt: number;
  student: StudentProfile;
}

export interface AttemptStart {
  attemptId: number;
  test: MockTest;
  questions: TestQuestion[];
  answers: Record<string, number>;
  remainingSeconds: number;
}

export interface AttemptResult {
  id: number;
  testId: number;
  answers: Record<string, number>;
  score: number;
  maxScore: number;
  correct: number;
  wrong: number;
  skipped: number;
  unmarked?: number;
  total: number;
  timeTakenSeconds: number;
  submittedAt: string;
  qualified?: boolean;
  sectionScores?: SectionScore[];
  rank: number;
  rankOutOf: number;
  // Signature for the public share link /r/<id>-<shareSig>; missing on older backends.
  shareSig?: string;
  test: MockTest;
  questions: TestQuestion[];
}

// Public summary of a shared result (no answers, no email).
export interface SharedResult {
  id: number;
  testId: number;
  score: number;
  maxScore: number;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  qualified?: boolean;
  submittedAt: string;
  rank: number;
  rankOutOf: number;
  studentName: string;
  test: Pick<MockTest, 'id' | 'title' | 'kind' | 'questionCount' | 'durationMinutes' | 'seriesTitle' | 'seriesSlug'>;
}

export interface AttemptSummary {
  id: number;
  testId: number;
  testTitle: string;
  seriesTitle: string;
  seriesSlug: string;
  score: number;
  maxScore: number;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  timeTakenSeconds: number;
  startedAt: string;
  submittedAt: string | null;
}

export interface StudentRecord extends StudentProfile {
  createdAt: string;
  attemptCount: number;
  lastAttemptAt: string | null;
}

export interface SeriesUpdate {
  seriesSlug: string;
  seriesTitle: string;
  tests: { id: number; title: string; createdAt: string }[];
}

export interface StudentAttemptRecord {
  id: number;
  testId: number;
  testTitle: string;
  seriesTitle: string;
  score: number;
  maxScore: number;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  timeTakenSeconds: number;
  submittedAt: string;
}
