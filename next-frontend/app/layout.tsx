import type { Metadata } from 'next';
import { Lato } from 'next/font/google';
import '@/app/globals.css';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { buildMetadata } from '@/lib/seo';

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
  variable: '--font-sans'
});

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'UTpaper | Question Papers, Previous Year Papers and PYQ Downloads',
    description:
      'Browse PTU and other university previous year question papers semester-wise. Download BTECH, BCA, BBA, MBA, MCA and competitive exam PYQs on UTpaper.'
  }),
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg'
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={lato.variable}>
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
