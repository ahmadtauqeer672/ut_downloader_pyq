import { API_BASE_URL } from '@/lib/data';
import { CompetitivePaper, CompetitiveSummary, Paper, SemesterGroup, YearGroup } from '@/lib/types';

interface PaperFilterOptions {
  university?: string;
  course?: string;
  department?: string;
  semester?: string;
  subject?: string;
  year?: string;
  limit?: number;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    next: { revalidate: 1800 }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function listPapers(filters: PaperFilterOptions): Promise<Paper[]> {
  const params = new URLSearchParams();
  params.set('paginate', 'true');
  params.set('limit', String(filters.limit ?? 80));

  if (filters.university) params.set('university', filters.university);
  if (filters.course) params.set('course', filters.course);
  if (filters.department) params.set('department', filters.department);
  if (filters.semester) params.set('semester', filters.semester);
  if (filters.subject) params.set('subject', filters.subject);
  if (filters.year) params.set('year', filters.year);

  const query = params.toString();
  const payload = await fetchJson<{ items: Paper[] }>(`/papers?${query}`);
  return payload.items ?? [];
}

export async function getCompetitiveSummary(): Promise<CompetitiveSummary> {
  return fetchJson<CompetitiveSummary>('/competitive-summary');
}

export async function listCompetitiveExams(): Promise<string[]> {
  return fetchJson<string[]>('/competitive-exams');
}

export async function listCompetitivePapers(examName: string): Promise<CompetitivePaper[]> {
  const params = new URLSearchParams();
  params.set('examName', examName);
  return fetchJson<CompetitivePaper[]>(`/competitive-papers?${params.toString()}`);
}

export function groupPapersBySemester(papers: Paper[]): SemesterGroup[] {
  const semesterMap = new Map<number, Paper[]>();

  for (const paper of papers) {
    const semester = Number(paper.semester) || 0;
    const bucket = semesterMap.get(semester) ?? [];
    bucket.push(paper);
    semesterMap.set(semester, bucket);
  }

  return [...semesterMap.entries()]
    .sort((a, b) => {
      if (a[0] === 0) return 1;
      if (b[0] === 0) return -1;
      return a[0] - b[0];
    })
    .map(([semester, semesterPapers]) => ({
      semester,
      papers: semesterPapers.sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return a.subject.localeCompare(b.subject);
      })
    }));
}

export function groupCompetitiveByYear(papers: CompetitivePaper[]): YearGroup[] {
  const yearMap = new Map<number, CompetitivePaper[]>();

  for (const paper of papers) {
    const year = Number(paper.year);
    const bucket = yearMap.get(year) ?? [];
    bucket.push(paper);
    yearMap.set(year, bucket);
  }

  return [...yearMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, yearPapers]) => ({
      year,
      papers: yearPapers.sort((a, b) => a.title.localeCompare(b.title))
    }));
}

export function paperDownloadHref(id: number): string {
  return `${API_BASE_URL}/papers/${id}/download`;
}

export function paperPreviewHref(id: number): string {
  return `${API_BASE_URL}/papers/${id}/preview`;
}

export function competitiveDownloadHref(id: number): string {
  return `${API_BASE_URL}/competitive-papers/${id}/download`;
}
