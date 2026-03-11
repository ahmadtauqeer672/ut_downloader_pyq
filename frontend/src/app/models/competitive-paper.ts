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
