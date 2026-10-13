import Link from 'next/link';
import { SUPPORT_EMAIL } from '@/lib/data';

// "email us at …" when a support address is configured, otherwise a link to the contact page.
export function SupportContact({ subject }: { subject?: string }) {
  if (!SUPPORT_EMAIL) return <Link href="/contact">our Contact page</Link>;
  const href = `mailto:${SUPPORT_EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
  return <a href={href}>{SUPPORT_EMAIL}</a>;
}
