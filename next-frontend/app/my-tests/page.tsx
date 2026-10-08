import type { Metadata } from 'next';
import { MyTestsClient } from '@/components/my-tests-client';

export const metadata: Metadata = {
  title: 'My Tests | UTpaper',
  robots: { index: false, follow: false }
};

export default function MyTestsPage() {
  return <MyTestsClient />;
}
