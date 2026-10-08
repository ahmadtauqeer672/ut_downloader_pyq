import { NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';
import { proxyToBackend } from '@/lib/backend-proxy';

// Test series, candidate and attempt endpoints share one JSON proxy.
// Routes with their own handlers (papers, competitive papers, admin login) take precedence over this catch-all.
const ALLOWED_PREFIXES = ['test-series', 'tests', 'attempts', 'students', 'admin/test-series', 'admin/tests', 'admin/questions', 'admin/students', 'admin/series-logos'];

interface CatchAllProps {
  params: Promise<{ path: string[] }>;
}

async function handle(request: NextRequest, { params }: CatchAllProps) {
  const { path } = await params;
  const joined = path.map(encodeURIComponent).join('/');

  if (!ALLOWED_PREFIXES.some((prefix) => joined === prefix || joined.startsWith(`${prefix}/`))) {
    return Response.json({ message: 'Not found' }, { status: 404 });
  }

  const hasBody = request.method !== 'GET' && request.method !== 'DELETE';
  // File uploads (series logos) are forwarded as multipart; fetch sets the boundary header itself.
  const isMultipart = (request.headers.get('content-type') || '').includes('multipart/form-data');
  const response = await proxyToBackend({
    method: request.method,
    path: `/${joined}${request.nextUrl.search}`,
    request,
    body: !hasBody ? undefined : isMultipart ? await request.formData() : await request.text(),
    headers: hasBody && !isMultipart ? { 'content-type': 'application/json' } : {}
  });

  if (response.ok && request.method !== 'GET' && joined.startsWith('admin/')) {
    revalidateTag('test-series');
  }

  return response;
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
