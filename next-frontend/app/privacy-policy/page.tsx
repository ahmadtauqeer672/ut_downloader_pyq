import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Privacy Policy | UTpaper',
  description:
    'Read the UTpaper privacy policy for information about analytics, cookies, advertising preparation, and how study resource requests are handled.',
  path: '/privacy-policy'
});

export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="card disclaimer-hero">
        <p className="eyebrow">Privacy</p>
        <h1>Privacy Policy</h1>
        <p className="hero__lede">
          This page explains what information UTpaper may collect, how it is used, and what users should expect while
          browsing question paper pages on utpaper.in.
        </p>
        <div className="button-row">
          <Link className="button button--primary" href="/">
            Back to home
          </Link>
        </div>
      </section>

      <section className="card disclaimer-copy">
        <p>
          UTpaper is built to help students browse and download previous year question papers and related study
          resources. When you use the website, basic technical information such as browser type, device details,
          requested pages, and general usage activity may be collected through server logs, analytics tools, or hosting
          providers to improve site performance and usability.
        </p>
        <p>
          UTpaper may use cookies or similar technologies for essential site functionality, traffic analysis, security,
          and future advertising support. These technologies can help the website remember settings, understand popular
          pages, and improve the browsing experience over time.
        </p>
        <p>
          If UTpaper displays advertising or monetization features in the future, third-party vendors such as Google
          may use cookies to serve ads based on prior visits to this website or other websites. Users can learn more
          about how Google uses information in advertising through Google&apos;s own policies and controls.
        </p>
        <p>
          Any information submitted voluntarily for support, paper corrections, or copyright-related removal requests
          may be used only to review and respond to that request. UTpaper does not intentionally sell personal
          information to third parties.
        </p>
        <p>
          This website may contain links to Google Drive files, external hosts, or third-party websites. UTpaper is not
          responsible for the privacy practices, content, or policies of those external services, and users should
          review them separately when visiting outside links.
        </p>
        <p>
          UTpaper may update this privacy policy when site features, analytics, or advertising setup changes. Continued
          use of the website after updates means you accept the current policy shown on this page.
        </p>
      </section>
    </>
  );
}
