import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="card section-card">
      <p className="eyebrow">Not found</p>
      <h1 className="section-title">This paper route does not exist.</h1>
      <p className="section-copy">
        Try going back to the home page or open a known university route such as PTU or PU Chandigarh.
      </p>
      <div className="button-row">
        <Link className="button button--primary" href="/">
          Go to home
        </Link>
        <Link className="button button--secondary" href="/question-papers/ptu">
          Open PTU papers
        </Link>
      </div>
    </section>
  );
}
