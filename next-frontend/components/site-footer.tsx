import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p>UTpaper helps students browse university and competitive exam papers in one place.</p>
        <p>
          <Link href="/disclaimer">Disclaimer</Link>
        </p>
      </div>
    </footer>
  );
}
