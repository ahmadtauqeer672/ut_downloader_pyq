import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TestResultClient } from '@/components/test-result-client';

export const metadata: Metadata = {
  title: 'Test Result | UTpaper',
  robots: { index: false, follow: false }
};

interface ResultPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { id } = await params;
  const attemptId = Number(id);
  if (!Number.isInteger(attemptId) || attemptId <= 0) notFound();

  return <TestResultClient attemptId={attemptId} />;
}
