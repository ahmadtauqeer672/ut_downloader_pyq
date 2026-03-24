'use client';

import { CompetitivePaper, Paper } from '@/lib/types';

export interface AdminSession {
  token: string;
  userId: string;
  expiresAt: number;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

function authHeaders(token: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loginAdmin(userId: string, password: string): Promise<AdminSession> {
  const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId, password })
  });

  return parseResponse<AdminSession>(response);
}

export async function listAdminPapers(): Promise<Paper[]> {
  const response = await fetch('/api/papers', {
    cache: 'no-store'
  });
  return parseResponse<Paper[]>(response);
}

export async function uploadPaper(form: FormData, token: string): Promise<unknown> {
  const response = await fetch('/api/papers', {
    method: 'POST',
    headers: authHeaders(token),
    body: form
  });
  return parseResponse(response);
}

export async function updatePaper(id: number, form: FormData, token: string): Promise<Paper> {
  const response = await fetch(`/api/papers/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: form
  });
  return parseResponse<Paper>(response);
}

export async function deletePaper(id: number, token: string): Promise<{ message: string }> {
  const response = await fetch(`/api/papers/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token)
  });
  return parseResponse<{ message: string }>(response);
}

export async function listCompetitiveExams(): Promise<string[]> {
  const response = await fetch('/api/competitive-exams', {
    cache: 'no-store'
  });
  return parseResponse<string[]>(response);
}

export async function listCompetitivePapers(examName = ''): Promise<CompetitivePaper[]> {
  const query = examName ? `?examName=${encodeURIComponent(examName)}` : '';
  const response = await fetch(`/api/competitive-papers${query}`, {
    cache: 'no-store'
  });
  return parseResponse<CompetitivePaper[]>(response);
}

export async function uploadCompetitivePaper(form: FormData, token: string): Promise<unknown> {
  const response = await fetch('/api/competitive-papers', {
    method: 'POST',
    headers: authHeaders(token),
    body: form
  });
  return parseResponse(response);
}

export async function updateCompetitivePaper(id: number, form: FormData, token: string): Promise<CompetitivePaper> {
  const response = await fetch(`/api/competitive-papers/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: form
  });
  return parseResponse<CompetitivePaper>(response);
}

export async function deleteCompetitivePaper(id: number, token: string): Promise<{ message: string }> {
  const response = await fetch(`/api/competitive-papers/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token)
  });
  return parseResponse<{ message: string }>(response);
}
