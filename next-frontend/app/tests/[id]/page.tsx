import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TestAttemptClient } from '@/components/test-attempt-client';

export const metadata: Metadata = {
  title: 'Attempt Test | UTpaper',
  robots: { index: false, follow: false }
};

interface TestPageProps {
  params: Promise<{ id: string }>;
}

export default async function TestPage({ params }: TestPageProps) {
  const { id } = await params;
  const testId = Number(id);
  if (!Number.isInteger(testId) || testId <= 0) notFound();

  return <TestAttemptClient testId={testId} />;
}
