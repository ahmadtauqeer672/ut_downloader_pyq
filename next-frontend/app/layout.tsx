import type { Metadata } from 'next';
import '@/app/globals.css';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'UTpaper | Question Papers, Previous Year Papers and PYQ Downloads',
  description:
    'Browse PTU and other university previous year question papers semester-wise. Download BTECH, BCA, BBA, MBA, MCA and competitive exam PYQs on UTpaper.'
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <SiteHeader />
          <main className="page-shell">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
