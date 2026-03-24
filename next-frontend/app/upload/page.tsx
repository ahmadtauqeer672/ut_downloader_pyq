import type { Metadata } from 'next';
import { UploadWorkspaceClient } from '@/components/upload-workspace-client';

export const metadata: Metadata = {
  title: 'Manage Papers | UTpaper',
  description: 'Private upload and paper management area for UTpaper administrators.',
  robots: {
    index: false,
    follow: false
  }
};

export default function UploadPage() {
  return <UploadWorkspaceClient />;
}
