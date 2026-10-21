import type { Metadata } from 'next';
import { Lato } from 'next/font/google';
import '@/app/globals.css';
import { GoogleOneTap } from '@/components/google-sign-in';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { JsonLdScript } from '@/components/json-ld-script';
import { buildMetadata, organizationJsonLd, websiteJsonLd } from '@/lib/seo';

const ADSENSE_CLIENT = 'ca-pub-1650044891896708';

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
  variable: '--font-sans'
});

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'UTpaper | Free Mock Tests, Test Series and Previous Year Papers',
    description:
      'Free online test series and mock tests for government exams with instant score, rank and solutions, plus PTU and Bihar Board previous year question papers.'
  }),
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg'
  },
  other: { 'google-adsense-account': ADSENSE_CLIENT }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={lato.variable}>
      <head>
        {/* Plain tag rather than next/script: AdSense's checker rejects the data-nscript attribute. */}
        <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`} crossOrigin="anonymous" />
      </head>
      <body>
        <JsonLdScript payload={organizationJsonLd()} />
        <JsonLdScript payload={websiteJsonLd()} />
        <div className="site-shell">
          <SiteHeader />
          <main className="page-shell">{children}</main>
          <SiteFooter />
          <GoogleOneTap />
        </div>
      </body>
    </html>
  );
}
