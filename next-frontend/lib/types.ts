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
}

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
}

export interface TestSeriesDetail extends TestSeries {
  tests: MockTest[];
}

export interface TestQuestion {
  id: number;
  position: number;
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
  total: number;
  timeTakenSeconds: number;
  submittedAt: string;
  rank: number;
  rankOutOf: number;
  test: MockTest;
  questions: TestQuestion[];
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
}
