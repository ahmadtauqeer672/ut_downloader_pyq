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
