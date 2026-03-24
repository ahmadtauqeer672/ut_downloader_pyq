import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/backend-proxy';

interface PaperRouteProps {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: PaperRouteProps) {
  const { id } = await params;
  const formData = await request.formData();

  return proxyToBackend({
    method: 'PUT',
    path: `/papers/${id}`,
    request,
    body: formData
  });
}

export async function DELETE(request: NextRequest, { params }: PaperRouteProps) {
  const { id } = await params;
  return proxyToBackend({
    method: 'DELETE',
    path: `/papers/${id}`,
    request
  });
}
