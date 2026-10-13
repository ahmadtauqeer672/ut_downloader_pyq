import Link from 'next/link';
import { SupportContact } from '@/components/support-contact';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Disclaimer and Terms of Use | UTpaper',
  description:
    'Terms of use and disclaimer for UTpaper: previous year papers, mock tests and results, student accounts, and copyright or removal requests.',
  path: '/disclaimer'
});

const LAST_UPDATED = '13 October 2026';

export default function DisclaimerPage() {
  return (
    <>
      <section className="card disclaimer-hero">
        <p className="eyebrow">Legal notice</p>
        <h1>Disclaimer and Terms of Use</h1>
        <p className="hero__lede">
          By using utpaper.in, its question papers or its mock tests, you agree to these terms. Please read them
          carefully.
        </p>
        <p className="legal-updated">Last updated: {LAST_UPDATED}</p>
        <div className="button-row">
          <Link className="button button--primary" href="/">
            Back to home
          </Link>
        </div>
      </section>

      <section className="card disclaimer-copy legal-copy">
        <h2>1. Educational use only</h2>
        <p>
          The content on utpaper.in is provided for educational and practice purposes only. Previous year question
          papers and study materials are collected from publicly available sources on the internet.
        </p>

        <h2>2. No affiliation with exam bodies</h2>
        <p>
          UTpaper is an independent website. We are <strong>not affiliated with, endorsed by, or connected to</strong>{' '}
          any university, board, recruitment agency or exam conducting body, such as PTU, BSEB, SSC, RRB, BPSC, DSSSB or
          any state commission. Exam names and logos are shown only to identify the exam a test relates to, and they
          remain the property of their respective owners. Always check official notices, syllabi and answer keys on the
          official websites.
        </p>

        <h2>3. Mock tests, scores and ranks</h2>
        <p>
          Mock tests are for practice. Scores, ranks and percentiles are calculated only among UTpaper users and do not
          predict or guarantee your result in any real exam. Questions, answer keys and solutions are prepared carefully,
          but they may contain mistakes. If you find an error, please report it so we can correct it.
        </p>

        <h2>4. Your account</h2>
        <ul>
          <li>Provide a real email address that you own. Each account is for one person only.</li>
          <li>Keep your password private. You are responsible for activity on your account.</li>
          <li>
            You may delete your account at any time. See the <Link href="/privacy-policy">Privacy Policy</Link>.
          </li>
        </ul>

        <h2>5. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>copy, scrape or resell tests, questions or solutions in bulk,</li>
          <li>try to manipulate scores or ranks, or attempt tests through automated tools,</li>
          <li>try to access other users’ accounts or disrupt the website or its servers.</li>
        </ul>
        <p>We may suspend or close accounts that break these terms.</p>

        <h2>6. Copyright and removal requests</h2>
        <p>
          We do not claim ownership of third-party materials unless stated. If you own content shown on UTpaper and
          believe it is used improperly, contact us at <SupportContact subject="Copyright / removal request" /> with the
          page link and proof of ownership. We will review the request and remove the content where appropriate.
        </p>

        <h2>7. No warranty and limitation of liability</h2>
        <p>
          UTpaper is provided “as is”. We do not guarantee that the content is complete, accurate or always available,
          and we may change or remove features at any time. To the extent allowed by law, UTpaper is not responsible for
          any loss, damage or inconvenience caused by using the website or relying on its content.
        </p>

        <h2>8. Changes to these terms</h2>
        <p>
          We may update these terms from time to time and will show the new date at the top of this page. Continuing to
          use UTpaper after a change means you accept the updated terms. These terms are governed by the laws of India.
        </p>

        <h2>9. Contact</h2>
        <p>
          Questions about these terms? Contact us at <SupportContact />.
        </p>
      </section>
    </>
  );
}
