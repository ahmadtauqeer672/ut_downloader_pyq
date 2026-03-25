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
    <section className="about-page">
      <div className="card about-hero">
        <div>
          <p className="eyebrow">About Us</p>
          <h1>Meet the person building UTpaper</h1>
          <p className="hero__lede">
            A focused profile page with background, mission, and the story behind this student-first platform.
          </p>
        </div>

        <div className="button-row">
          <Link className="button button--primary" href="/">
            Back to Home
          </Link>
          <Link className="button button--secondary" href="/question-papers/ptu">
            Browse Papers
          </Link>
        </div>
      </div>

      <div className="about-grid">
        <article className="card about-profile">
          <div className="about-profile__media">
            <Image
              src="/about-founder.jpg"
              alt={`${profile.name} portrait`}
              width={720}
              height={720}
              priority
              className="about-profile__image"
            />
          </div>

          <div className="about-profile__copy">
            <p className="eyebrow">Profile Card</p>
            <h2>{profile.name}</h2>
            <p className="about-profile__role">{profile.role}</p>
            <p className="about-profile__intro">{profile.intro}</p>

            <div className="about-badges">
              <span>Frontend Development</span>
              <span>Student Tools</span>
              <span>Product Design</span>
            </div>
          </div>
        </article>

        <article className="card about-story">
          <p className="eyebrow">About Me</p>
          <h2>Building useful tools with a simple goal</h2>
          <p>{profile.about}</p>
          <p>{profile.focus}</p>

          <div className="about-story__panel">
            <strong>What drives this work</strong>
            <p>
              Better access, faster discovery, and a smoother experience for students who just want the right paper
              without wasting time.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
