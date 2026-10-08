import Link from 'next/link';

const FOOTER_GROUPS = [
  {
    title: 'Question Papers',
    links: [
      { label: 'PTU BTECH', href: '/question-papers/ptu/btech' },
      { label: 'PTU BCA', href: '/question-papers/ptu/bca' },
      { label: 'PTU MBA', href: '/question-papers/ptu/mba' },
      { label: 'All PTU courses', href: '/question-papers/ptu' },
      { label: 'Bihar Board Class 10', href: '/question-papers/bihar-board-bseb/10th' }
    ]
  },
  {
    title: 'Mock Tests',
    links: [
      { label: 'All test series', href: '/test-series' },
      { label: 'My tests & results', href: '/my-tests' }
    ]
  },
  {
    title: 'UTpaper',
    links: [
      { label: 'About us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy policy', href: '/privacy-policy' },
      { label: 'Disclaimer', href: '/disclaimer' }
    ]
  }
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Link className="brand" href="/">
            <span className="brand__badge brand__badge--logo">UT</span>
            <span>
              <p className="brand__name">UTpaper</p>
              <p className="brand__tag">Previous year papers &amp; mock tests</p>
            </span>
          </Link>
          <p className="site-footer__copy">
            Free previous year question papers for PTU, Bihar Board and competitive exams, plus online mock tests with
            instant results and solutions.
          </p>
          <Link className="site-footer__cta" href="/test-series">
            Take a free mock test <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="site-footer__links">
          {FOOTER_GROUPS.map((group) => (
            <div className="site-footer__group" key={group.title}>
              <p className="site-footer__title">{group.title}</p>
              <nav aria-label={`${group.title} links`}>
                {group.links.map((link) => (
                  <Link href={link.href} key={link.href}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>

      <div className="site-footer__bottom">
        <div className="site-footer__bottom-inner">
          <p>© {year} UTpaper. All papers are free to download.</p>
          <Link href="/admin">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
