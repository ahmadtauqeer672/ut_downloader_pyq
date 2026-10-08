import Link from 'next/link';
import { StudentNav } from '@/components/student-nav';

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" href="/">
          <span className="brand__badge brand__badge--logo">UT</span>
          <span>
            <p className="brand__name">UTpaper</p>
            <p className="brand__tag">Previous year papers &amp; mock tests</p>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          <Link className="site-nav__home" href="/">
            Home
          </Link>
          <Link href="/question-papers/ptu">Question Papers</Link>
          <Link className="site-nav__series" href="/test-series">
            Test Series <span className="nav-new">New</span>
          </Link>
          <StudentNav />
        </nav>
      </div>
    </header>
  );
}
