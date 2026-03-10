import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paper } from '../models/paper';
import { CompetitivePaper } from '../models/competitive-paper';

export interface PaperFilters {
  university?: string;
  course?: string;
  department?: string;
  semester?: string;
  subject?: string;
  year?: string;
}

export interface CompetitivePaperFilters {
  examName?: string;
  year?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'http://localhost:3000/api';

  constructor(private readonly http: HttpClient) {}

  listPapers(filters: PaperFilters): Observable<Paper[]> {
    let params = new HttpParams();
    if (filters.university?.trim()) params = params.set('university', filters.university.trim());
    if (filters.course?.trim()) params = params.set('course', filters.course.trim());
    if (filters.department?.trim()) params = params.set('department', filters.department.trim());
    if (filters.semester?.trim()) params = params.set('semester', filters.semester.trim());
    if (filters.subject?.trim()) params = params.set('subject', filters.subject.trim());
    if (filters.year?.trim()) params = params.set('year', filters.year.trim());
    return this.http.get<Paper[]>(`${this.baseUrl}/papers`, { params });
  }

  uploadPaper(form: FormData, adminKey: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/papers`, form, {
      headers: {
        'x-admin-key': adminKey
      }
    });
  }

  deletePaper(id: number, adminKey: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/papers/${id}`, {
      headers: {
        'x-admin-key': adminKey
      }
    });
  }

  listCompetitiveExams(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/competitive-exams`);
  }

  listCompetitivePapers(filters: CompetitivePaperFilters): Observable<CompetitivePaper[]> {
    let params = new HttpParams();
    if (filters.examName?.trim()) params = params.set('examName', filters.examName.trim());
    if (filters.year?.trim()) params = params.set('year', filters.year.trim());
    return this.http.get<CompetitivePaper[]>(`${this.baseUrl}/competitive-papers`, { params });
  }

  uploadCompetitivePaper(form: FormData, adminKey: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/competitive-papers`, form, {
      headers: {
        'x-admin-key': adminKey
      }
    });
  }

  deleteCompetitivePaper(id: number, adminKey: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/competitive-papers/${id}`, {
      headers: {
        'x-admin-key': adminKey
      }
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
}
