import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" href="/">
          <span className="brand__badge">UT</span>
          <span>
            <p className="brand__name">UTpaper</p>
            <p className="brand__tag">Question papers, previous year papers and PYQ downloads</p>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          <Link href="/">Home</Link>
          <Link href="/question-papers/ptu">PTU Papers</Link>
          <Link href="/question-papers/ptu/btech">PTU BTECH</Link>
          <Link className="site-nav__cta" href="/question-papers/ptu/btech">
            Open PTU BTECH
          </Link>
        </nav>
      </div>
    </header>
  );
}
