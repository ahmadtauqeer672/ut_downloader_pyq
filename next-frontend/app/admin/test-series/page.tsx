import type { Metadata } from 'next';
import { AdminTestSeriesClient } from '@/components/admin-test-series-client';

export const metadata: Metadata = {
  title: 'Manage Test Series | UTpaper',
  robots: { index: false, follow: false }
};

export default function AdminTestSeriesPage() {
  return <AdminTestSeriesClient />;
}
