'use client';

import { useEffect } from 'react';
import { markTestOpened } from '@/lib/new-tests';

// Renders nothing; records that this test was opened so it stops showing as "New" for the student.
export function MarkTestOpened({ testId }: { testId: number }) {
  useEffect(() => {
    markTestOpened(testId);
  }, [testId]);
  return null;
}
