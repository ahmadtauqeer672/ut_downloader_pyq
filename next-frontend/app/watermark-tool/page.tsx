import type { Metadata } from 'next';
import { WatermarkToolClient } from '@/components/watermark-tool-client';

export const metadata: Metadata = {
  title: 'Watermark Tool | UTpaper',
  description: 'Private PDF watermark tool for UTpaper administrators.',
  robots: {
    index: false,
    follow: false
  }
};

export default function WatermarkToolPage() {
  return <WatermarkToolClient />;
}
