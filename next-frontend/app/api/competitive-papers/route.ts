import { NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';
import { proxyToBackend } from '@/lib/backend-proxy';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.search;
  return proxyToBackend({
    method: 'GET',
    path: `/competitive-papers${query}`,
    request
  });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const response = await proxyToBackend({
    method: 'POST',
    path: '/competitive-papers',
    request,
    body: formData
  });

  if (response.ok) {
    revalidateTag('competitive-summary');
    revalidateTag('competitive-papers');
  }

  return response;
}
