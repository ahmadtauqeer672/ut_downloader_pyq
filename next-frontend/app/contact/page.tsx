import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Contact | UTpaper',
  description:
    'Contact UTpaper for paper corrections, broken file reports, copyright concerns, and general feedback about the website.',
  path: '/contact'
});

export default function ContactPage() {
  return (
    <>
      <section className="card disclaimer-hero">
        <p className="eyebrow">Contact</p>
        <h1>Contact UTpaper</h1>
        <p className="hero__lede">
          Use this page for paper corrections, broken download links, feedback, and copyright-related concerns about
          content shown on utpaper.in.
        </p>
        <div className="button-row">
          <Link className="button button--primary" href="/">
            Back to home
          </Link>
        </div>
      </section>

      <section className="card disclaimer-copy">
        <p>
          If you find an incorrect paper title, wrong year, broken file link, duplicate upload, or a missing subject
          route, please contact the UTpaper team with as much detail as possible so the issue can be reviewed faster.
        </p>
        <p>
          For copyright or ownership concerns, please include the paper title, route URL, proof of ownership, and the
          specific request you want reviewed. Clear reports help speed up verification and removal decisions.
        </p>
        <p>
          When sending a support request, it is helpful to include:
        </p>
        <p>
          1. Your name or organization
          <br />
          2. The exact paper title or page URL
          <br />
          3. A short description of the issue
          <br />
          4. Any proof or reference links needed to review the request
        </p>
        <p>
          If you are setting up this page for production, add your public support email, business contact form, or
          verified social/business contact method here so users and rights holders can reach you directly.
        </p>
        <p>
          UTpaper aims to review valid reports as quickly as possible, but response time may vary depending on the
          request volume and the information provided.
        </p>
      </section>
    </>
  );
}
