import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paper } from '../models/paper';
import { CompetitivePaper } from '../models/competitive-paper';
import { AdminSessionService } from './admin-session.service';

export interface PaperFilters {
  university?: string;
  course?: string;
  department?: string;
  semester?: string;
  subject?: string;
  year?: string;
}

export interface PaperListResponse {
  items: Paper[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextOffset: number | null;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface CompetitivePaperFilters {
  examName?: string;
  year?: string;
}

export interface CompetitiveSummaryResponse {
  exams: string[];
  totalCount: number;
}

export interface AdminLoginResponse {
  token: string;
  userId: string;
  expiresAt: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'https://ut-downloader-pyq.onrender.com/api';

  constructor(
    private readonly http: HttpClient,
    private readonly adminSession: AdminSessionService
  ) {}

  loginAdmin(userId: string, password: string): Observable<AdminLoginResponse> {
    return this.http.post<AdminLoginResponse>(`${this.baseUrl}/admin/login`, { userId, password });
  }

  listPapers(filters: PaperFilters): Observable<Paper[]>;
  listPapers(filters: PaperFilters, pagination: PaginationOptions): Observable<PaperListResponse>;
  listPapers(filters: PaperFilters, pagination?: PaginationOptions): Observable<PaperListResponse | Paper[]> {
    const usePagination = Boolean(pagination);
    let params = new HttpParams();
    if (usePagination) {
      params = params.set('paginate', 'true');
    }
    if (filters.university?.trim()) params = params.set('university', filters.university.trim());
    if (filters.course?.trim()) params = params.set('course', filters.course.trim());
    if (filters.department?.trim()) params = params.set('department', filters.department.trim());
    if (filters.semester?.trim()) params = params.set('semester', filters.semester.trim());
    if (filters.subject?.trim()) params = params.set('subject', filters.subject.trim());
    if (filters.year?.trim()) params = params.set('year', filters.year.trim());

    if (usePagination && pagination?.limit !== undefined) {
      params = params.set('limit', String(pagination.limit));
    }
    if (usePagination && pagination?.offset !== undefined) {
      params = params.set('offset', String(pagination.offset));
    }

    return this.http.get<PaperListResponse | Paper[]>(`${this.baseUrl}/papers`, { params });
  }

  uploadPaper(form: FormData): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/papers`, form, {
      headers: this.adminHeaders()
    });
  }

  updatePaper(form: FormData, id: number): Observable<Paper> {
    return this.http.put<Paper>(`${this.baseUrl}/papers/${id}`, form, {
      headers: this.adminHeaders()
    });
  }

  deletePaper(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/papers/${id}`, { headers: this.adminHeaders() });
  }

  listCompetitiveExams(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/competitive-exams`);
  }

  getCompetitiveSummary(): Observable<CompetitiveSummaryResponse> {
    return this.http.get<CompetitiveSummaryResponse>(`${this.baseUrl}/competitive-summary`);
  }

  listCompetitivePapers(filters: CompetitivePaperFilters): Observable<CompetitivePaper[]> {
    let params = new HttpParams();
    if (filters.examName?.trim()) params = params.set('examName', filters.examName.trim());
    if (filters.year?.trim()) params = params.set('year', filters.year.trim());
    return this.http.get<CompetitivePaper[]>(`${this.baseUrl}/competitive-papers`, { params });
  }

  uploadCompetitivePaper(form: FormData): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/competitive-papers`, form, {
      headers: this.adminHeaders()
    });
  }

  updateCompetitivePaper(form: FormData, id: number): Observable<CompetitivePaper> {
    return this.http.put<CompetitivePaper>(`${this.baseUrl}/competitive-papers/${id}`, form, {
      headers: this.adminHeaders()
    });
  }

  deleteCompetitivePaper(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/competitive-papers/${id}`, {
      headers: this.adminHeaders()
    });
  }

  downloadUrl(id: number): string {
    return `${this.baseUrl}/papers/${id}/download`;
  }

  previewUrl(id: number): string {
    return `${this.baseUrl}/papers/${id}/preview`;
  }

  competitiveDownloadUrl(id: number): string {
    return `${this.baseUrl}/competitive-papers/${id}/download`;
  }

  competitivePreviewUrl(id: number): string {
    return `${this.baseUrl}/competitive-papers/${id}/preview`;
  }

  private adminHeaders(): HttpHeaders {
    const token = this.adminSession.authToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
