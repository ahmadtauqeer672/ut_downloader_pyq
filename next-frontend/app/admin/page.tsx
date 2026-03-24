import type { Metadata } from 'next';
import { AdminPanelClient } from '@/components/admin-panel-client';

export const metadata: Metadata = {
  title: 'Admin Panel | UTpaper',
  description: 'UTpaper admin login and management dashboard.',
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminPage() {
  return <AdminPanelClient />;
}
