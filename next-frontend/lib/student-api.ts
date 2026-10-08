'use client';

import {
  AttemptResult,
  AttemptStart,
  AttemptSummary,
  MockTest,
  StudentSession,
  TestQuestion,
  TestSeries,
  StudentRecord
} from '@/lib/types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: { method?: string; token?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (init.token) headers.Authorization = `Bearer ${init.token}`;
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`/api/${path}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: 'no-store'
  });

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = (data as { message?: string } | null)?.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

// ---- Candidate ----
export function registerStudent(input: { email: string; password: string }) {
  return request<StudentSession>('students/register', { method: 'POST', body: input });
}

export function loginStudent(input: { email: string; password: string }) {
  return request<StudentSession>('students/login', { method: 'POST', body: input });
}

export function listMyAttempts(token: string) {
  return request<AttemptSummary[]>('students/me/attempts', { token });
}

export function getTest(id: number) {
  return request<MockTest>(`tests/${id}`);
}

export function startAttempt(testId: number, token: string) {
  return request<AttemptStart>(`tests/${testId}/start`, { method: 'POST', token });
}

export function saveAnswers(attemptId: number, answers: Record<string, number>, token: string) {
  return request<{ ok: boolean }>(`attempts/${attemptId}/answers`, { method: 'PUT', token, body: { answers } });
}

export function submitAttempt(attemptId: number, answers: Record<string, number>, token: string) {
  return request<{ attemptId: number }>(`attempts/${attemptId}/submit`, { method: 'POST', token, body: { answers } });
}

export function getAttemptResult(attemptId: number, token: string) {
  return request<AttemptResult>(`attempts/${attemptId}`, { token });
}

// ---- Admin ----
export interface SeriesInput {
  title: string;
  slug?: string;
  examName: string;
  category: string;
  description: string;
  isPublished: boolean;
}

export interface TestInput {
  title: string;
  kind: string;
  category: string;
  language: string;
  difficulty: string;
  durationMinutes: number;
  marksPerQuestion: number;
  negativeMarks: number;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
}

export interface QuestionInput {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  imageUrl?: string;
  optionImages?: string[];
}

export const adminTestApi = {
  listSeries: (token: string) => request<TestSeries[]>('admin/test-series', { token }),
  createSeries: (input: SeriesInput, token: string) =>
    request<TestSeries>('admin/test-series', { method: 'POST', token, body: input }),
  updateSeries: (id: number, input: SeriesInput, token: string) =>
    request<TestSeries>(`admin/test-series/${id}`, { method: 'PUT', token, body: input }),
  deleteSeries: (id: number, token: string) => request(`admin/test-series/${id}`, { method: 'DELETE', token }),
  uploadLogo: async (id: number, file: File, token: string) => {
    const form = new FormData();
    form.append('logo', file);
    const response = await fetch(`/api/admin/test-series/${id}/logo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });
    const data = (await response.json().catch(() => null)) as { logoUrl?: string; message?: string } | null;
    if (!response.ok) throw new ApiError(data?.message || 'Logo upload failed', response.status);
    return data?.logoUrl ?? '';
  },
  listLogos: (token: string) => request<{ logoUrl: string; examName: string | null }[]>('admin/series-logos', { token }),
  useLogo: (id: number, logoUrl: string, token: string) =>
    request<{ logoUrl: string }>(`admin/test-series/${id}/logo`, { method: 'PUT', token, body: { logoUrl } }),
  removeLogo: (id: number, token: string) => request<{ logoUrl: string }>(`admin/test-series/${id}/logo`, { method: 'DELETE', token }),

  listTests: (seriesId: number, token: string) => request<MockTest[]>(`admin/test-series/${seriesId}/tests`, { token }),
  createTest: (seriesId: number, input: TestInput, token: string) =>
    request<MockTest>(`admin/test-series/${seriesId}/tests`, { method: 'POST', token, body: input }),
  updateTest: (id: number, input: TestInput, token: string) =>
    request<MockTest>(`admin/tests/${id}`, { method: 'PUT', token, body: input }),
  deleteTest: (id: number, token: string) => request(`admin/tests/${id}`, { method: 'DELETE', token }),

  listQuestions: (testId: number, token: string) => request<TestQuestion[]>(`admin/tests/${testId}/questions`, { token }),
  addQuestions: (testId: number, questions: QuestionInput[], token: string) =>
    request<{ added: number }>(`admin/tests/${testId}/questions`, { method: 'POST', token, body: { questions } }),
  updateQuestion: (id: number, input: QuestionInput, token: string) =>
    request(`admin/questions/${id}`, { method: 'PUT', token, body: input }),
  deleteQuestion: (id: number, token: string) => request(`admin/questions/${id}`, { method: 'DELETE', token }),

  listStudents: (token: string) => request<StudentRecord[]>('admin/students', { token })
};
