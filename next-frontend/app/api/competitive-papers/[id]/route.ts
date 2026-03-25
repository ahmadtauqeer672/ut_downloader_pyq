import { NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';
import { proxyToBackend } from '@/lib/backend-proxy';

interface CompetitivePaperRouteProps {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: CompetitivePaperRouteProps) {
  const { id } = await params;
  const formData = await request.formData();

  const response = await proxyToBackend({
    method: 'PUT',
    path: `/competitive-papers/${id}`,
    request,
    body: formData
  });

  if (response.ok) {
    revalidateTag('competitive-summary');
    revalidateTag('competitive-papers');
  }

  return response;
}

export async function DELETE(request: NextRequest, { params }: CompetitivePaperRouteProps) {
  const { id } = await params;
  const response = await proxyToBackend({
    method: 'DELETE',
    path: `/competitive-papers/${id}`,
    request
  });

  if (response.ok) {
    revalidateTag('competitive-summary');
    revalidateTag('competitive-papers');
  }

  return response;
}
