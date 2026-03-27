import { NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';
import { proxyToBackend } from '@/lib/backend-proxy';

interface PaperRouteProps {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: PaperRouteProps) {
  const { id } = await params;
  const formData = await request.formData();

  const response = await proxyToBackend({
    method: 'PUT',
    path: `/papers/${id}`,
    request,
    body: formData
  });

  if (response.ok) {
    revalidateTag('papers');
  }

  return response;
}

export async function DELETE(request: NextRequest, { params }: PaperRouteProps) {
  const { id } = await params;
  const response = await proxyToBackend({
    method: 'DELETE',
    path: `/papers/${id}`,
    request
  });

  if (response.ok) {
    revalidateTag('papers');
  }

  return response;
}
