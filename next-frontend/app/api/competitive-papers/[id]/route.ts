import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/backend-proxy';

interface CompetitivePaperRouteProps {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: CompetitivePaperRouteProps) {
  const { id } = await params;
  const formData = await request.formData();

  return proxyToBackend({
    method: 'PUT',
    path: `/competitive-papers/${id}`,
    request,
    body: formData
  });
}

export async function DELETE(request: NextRequest, { params }: CompetitivePaperRouteProps) {
  const { id } = await params;
  return proxyToBackend({
    method: 'DELETE',
    path: `/competitive-papers/${id}`,
    request
  });
}
