import Link from 'next/link';
import { SupportContact } from '@/components/support-contact';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Privacy Policy | UTpaper',
  description:
    'How UTpaper collects, uses and protects your information, including account details, Google sign-in data and mock test results.',
  path: '/privacy-policy'
});

const LAST_UPDATED = '13 October 2026';

export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="card disclaimer-hero">
        <p className="eyebrow">Privacy</p>
        <h1>Privacy Policy</h1>
        <p className="hero__lede">
          This page explains what information UTpaper (utpaper.in) collects, why we collect it, who it is shared with,
          and how you can see or delete it.
        </p>
        <p className="legal-updated">Last updated: {LAST_UPDATED}</p>
        <div className="button-row">
          <Link className="button button--primary" href="/">
            Back to home
          </Link>
        </div>
      </section>

      <section className="card disclaimer-copy legal-copy">
        <h2>1. Using UTpaper without an account</h2>
        <p>
          You can browse and download previous year question papers without creating an account. When you visit, our
          hosting providers automatically record basic technical information such as your IP address, browser and
          device type, and the pages you request. This is used only to keep the website running, secure and fast.
        </p>

        <h2>2. Information we collect when you create an account</h2>
        <p>An account is needed to attempt mock tests. We collect:</p>
        <ul>
          <li>
            <strong>Email address and name.</strong> If you sign up with email, your name is taken from the part of your
            email before the “@” unless you provide one.
          </li>
          <li>
            <strong>Password.</strong> We never store your password itself, only a secure one-way hash of it.
          </li>
          <li>
            <strong>Mobile number</strong>, only if you choose to provide it.
          </li>
        </ul>

        <h2>3. Sign in with Google</h2>
        <p>If you choose “Continue with Google”, Google shares the following with us, with your permission:</p>
        <ul>
          <li>your name,</li>
          <li>your email address and whether Google has verified it, and</li>
          <li>a Google account ID that lets us recognise you the next time you sign in.</li>
        </ul>
        <p>
          We use this information <strong>only to create your UTpaper account and sign you in</strong>. We do not
          receive your Google password, and we do not access your contacts, Gmail, Drive, or any other Google data. We
          do not sell Google user data, use it for advertising, or share it with anyone except as described in section 6.
          Our use of information received from Google follows the{' '}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
            Google API Services User Data Policy
          </a>
          , including its Limited Use requirements.
        </p>
        <p>
          If you sign in with Google using the same email as an existing UTpaper account, the two are linked. After that
          the account signs in through Google only.
        </p>

        <h2>4. Mock test activity</h2>
        <p>
          When you attempt a test we save your answers, score, number of correct and wrong answers, time taken and the
          date of the attempt. This lets you resume a test, see your results and solutions, and get a rank. Your rank is
          calculated by comparing scores with other candidates; other users see only rank numbers, never your name or
          email.
        </p>

        <h2>5. How we use your information</h2>
        <ul>
          <li>to sign you in and keep you signed in,</li>
          <li>to run tests, save your progress and show your results, rank and attempt history,</li>
          <li>to reply when you contact us, and</li>
          <li>to protect the website from misuse, for example by limiting repeated login attempts.</li>
        </ul>
        <p>We do not sell your personal information, and we do not send marketing emails.</p>

        <h2>6. Service providers</h2>
        <p>
          We use trusted providers to run UTpaper. They process data only on our behalf and only to provide their
          service:
        </p>
        <ul>
          <li>
            <strong>Vercel</strong> (website hosting) and <strong>Render</strong> (application server),
          </li>
          <li>
            <strong>Neon</strong> (database where your account and test results are stored),
          </li>
          <li>
            <strong>Cloudinary</strong> (question images and study files), and
          </li>
          <li>
            <strong>Google</strong> (Sign in with Google).
          </li>
        </ul>
        <p>These providers may store data on servers outside India.</p>
        <p>We may also disclose information if required by law or to protect the safety of our users.</p>

        <h2>7. Storage in your browser</h2>
        <p>
          After you log in, your browser stores a sign-in token so that you stay logged in for up to 30 days. It is
          removed when you log out. If you use Sign in with Google, Google may set its own cookies to show the sign-in
          prompt. UTpaper does not currently use advertising or analytics cookies. If that changes, we will update this
          policy first.
        </p>

        <h2>8. How long we keep data and how to delete it</h2>
        <p>
          We keep your account and test history for as long as your account exists. To see the data we hold about you,
          correct it, or delete your account and all your test attempts, write to <SupportContact subject="Delete my UTpaper account" />{' '}
          from your registered email address. We will complete deletion within 30 days. You can also remove UTpaper’s
          access to your Google account at any time from{' '}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">
            your Google Account permissions
          </a>
          .
        </p>

        <h2>9. Security</h2>
        <p>
          All traffic to UTpaper is encrypted with HTTPS, passwords are stored only as hashes, and access to the database
          is restricted. No method of storing data online is completely secure, but we work to protect your information.
        </p>

        <h2>10. Students under 18</h2>
        <p>
          UTpaper is meant for students preparing for exams. If you are under 18, please use UTpaper with the permission
          of a parent or guardian. A parent or guardian can ask us to delete a child’s account using the contact details
          below.
        </p>

        <h2>11. External links</h2>
        <p>
          Some study files are hosted on Google Drive or other websites. Their own privacy policies apply when you open
          them.
        </p>

        <h2>12. Changes and contact</h2>
        <p>
          We will update this page when our practices change and show the new date at the top. For any privacy question
          or request, contact us at <SupportContact subject="Privacy question" />.
        </p>
      </section>
    </>
  );
}
