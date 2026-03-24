import { NextRequest } from 'next/server';
import { API_BASE_URL } from '@/lib/data';

interface ProxyOptions {
  method: string;
  path: string;
  request: NextRequest;
  body?: BodyInit | null;
  headers?: Record<string, string>;
}

export async function proxyToBackend({ method, path, request, body, headers = {} }: ProxyOptions) {
  const authorization = request.headers.get('authorization');
  const backendHeaders = new Headers(headers);

  if (authorization) {
    backendHeaders.set('authorization', authorization);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: backendHeaders,
    body,
    cache: 'no-store'
  });

  const text = await response.text();
  const contentType = response.headers.get('content-type') || 'application/json; charset=utf-8';

  return new Response(text, {
    status: response.status,
    headers: {
      'content-type': contentType
    }
  });
}
