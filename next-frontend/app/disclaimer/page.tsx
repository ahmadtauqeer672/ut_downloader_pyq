import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Disclaimer | UTpaper',
  description:
    'Read the UTpaper disclaimer for previous year question papers, study materials, copyright concerns, and content removal requests.',
  path: '/disclaimer'
});

export default function DisclaimerPage() {
  return (
    <>
      <section className="card disclaimer-hero">
        <p className="eyebrow">Legal notice</p>
        <h1>Disclaimer</h1>
        <p className="hero__lede">
          Please read this page carefully before using the study materials and previous year question papers available
          on utpaper.in.
        </p>
        <div className="button-row">
          <Link className="button button--primary" href="/">
            Back to home
          </Link>
        </div>
      </section>

      <section className="card disclaimer-copy">
        <p>
          The content available on utpaper.in is provided for educational and informational purposes only. All previous
          year question papers, study materials, and related content uploaded on this website are collected from various
          publicly available sources on the internet.
        </p>
        <p>
          We do not claim ownership of any such materials unless explicitly stated. If you are the rightful owner of
          any content and believe that your copyrighted material has been used improperly, please contact us, and we
          will take appropriate action, including removal of the content.
        </p>
        <p>
          While we strive to ensure accuracy and authenticity, utpaper.in makes no guarantees regarding the
          completeness, reliability, or accuracy of the content. Users are advised to verify information from official
          sources.
        </p>
        <p>
          By using this website, you agree that utpaper.in is not responsible for any loss, damage, or inconvenience
          caused by the use of the content provided.
        </p>
      </section>
    </>
  );
}
