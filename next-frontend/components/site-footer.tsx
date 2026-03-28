import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Link className="brand" href="/">
            <span className="brand__badge brand__badge--logo">UT</span>
            <span>
              <p className="brand__name">UTpaper</p>
              <p className="brand__tag">Question papers, previous year papers and PYQ downloads</p>
            </span>
          </Link>
          <p className="site-footer__copy">
            Browse university and competitive exam papers in one place, with fast routes for PTU and other popular
            categories.
          </p>
        </div>

        <div className="site-footer__links">
          <div className="site-footer__group">
            <p className="site-footer__title">Explore</p>
            <nav aria-label="Explore footer links">
              <Link href="/">Home</Link>
              <Link href="/question-papers/ptu">PTU Papers</Link>
              <Link href="/question-papers/ptu/btech">PTU BTECH</Link>
            </nav>
          </div>

          <div className="site-footer__group">
            <p className="site-footer__title">Important</p>
            <nav aria-label="Important footer links">
              <Link href="/about">About Us</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/privacy-policy">Privacy Policy</Link>
              <Link href="/disclaimer">Disclaimer</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
