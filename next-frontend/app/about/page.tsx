import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'About Us | UTpaper',
  description: 'Meet the software engineer behind UTpaper and learn more about the mission behind the platform.',
  path: '/about',
  keywords: ['About UTpaper', 'Ahmad Tauqeer', 'Software Engineer', 'UTpaper founder']
});

const profile = {
  name: 'Tauqeer Ahmad',
  role: 'Software Engineer',
  intro:
    'I build practical web tools that help students find resources faster, with a focus on clean design, smooth user experience, and reliable performance.',
  about:
    'UTpaper was created to make previous year papers easier to browse and download. Instead of forcing students through confusing routes and slow pages, the goal is to keep everything direct, simple, and useful.',
  focus:
    'My work is centered on frontend development, product-minded problem solving, and building platforms that feel fast on both desktop and mobile.'
};

export default function AboutPage() {
  return (
    <section className="about-showcase">
      <div className="about-showcase__intro">
        <span className="about-showcase__line" />
        <p className="about-showcase__eyebrow">About Me</p>
        <h1>
          I&apos;m {profile.name}, a <br />
          {profile.role}
        </h1>
        <p className="about-showcase__lede">{profile.intro}</p>

        <div className="about-showcase__actions">
          <Link className="button button--primary" href="/">
            Back to Home
          </Link>
          <Link className="button button--secondary" href="/question-papers/ptu">
            Browse Papers
          </Link>
        </div>
      </div>

      <div className="about-showcase__visual">
        <div className="about-showcase__glow" />
        <div className="about-showcase__photo-frame">
          <Image
            src="/about-founder.jpg"
            alt={`${profile.name} portrait`}
            width={900}
            height={900}
            priority
            className="about-showcase__photo"
          />
        </div>
      </div>

      <aside className="about-showcase__side">
        <article className="about-panel">
          <p className="about-panel__title">About Me</p>
          <p>{profile.about}</p>
          <Link className="about-panel__link" href="/about">
            Learn more
          </Link>
        </article>

        <article className="about-panel">
          <p className="about-panel__title">My Work</p>
          <p>{profile.focus}</p>
          <Link className="about-panel__link" href="/question-papers/ptu">
            Browse portfolio
          </Link>
        </article>

        <article className="about-panel">
          <p className="about-panel__title">Focus Areas</p>
          <div className="about-showcase__tags">
            <span>Frontend</span>
            <span>Student Tools</span>
            <span>UI Systems</span>
            <span>Fast UX</span>
          </div>
        </article>
      </aside>
    </section>
  );
}
