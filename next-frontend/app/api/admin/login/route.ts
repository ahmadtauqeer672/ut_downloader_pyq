import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/backend-proxy';

export async function POST(request: NextRequest) {
  const body = await request.text();

  return proxyToBackend({
    method: 'POST',
    path: '/admin/login',
    request,
    body,
    headers: {
      'content-type': 'application/json'
    }
  });
}
