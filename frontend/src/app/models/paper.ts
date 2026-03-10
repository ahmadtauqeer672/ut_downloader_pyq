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
  uploadedAt: string;
}
