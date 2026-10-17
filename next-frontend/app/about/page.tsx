import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'About UTpaper | Free Mock Tests and Previous Year Papers',
  description:
    'UTpaper is a free platform for government exam mock tests and previous year question papers, built and run by Tauqeer Ahmad. Learn what we offer, how answer keys are verified and how to reach us.',
  path: '/about',
  keywords: ['About UTpaper', 'Tauqeer Ahmad', 'UTpaper founder', 'free mock test platform']
});

const profile = {
  name: 'Tauqeer Ahmad',
  role: 'Full Stack Web Developer',
  intro:
    'I build practical web tools that help students find resources faster, with a focus on clean design, smooth user experience, and reliable performance.',
  about:
    'UTpaper was created to make previous year papers easier to browse and download. Instead of forcing students through confusing routes and slow pages, the goal is to keep everything direct, simple, and useful.',
  focus:
    'My work is centered on frontend development, product-minded problem solving, and building platforms that feel fast on both desktop and mobile.'
};

export default function AboutPage() {
  return (
    <>
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
            <Link className="button button--primary" href="/test-series">
              Browse test series
            </Link>
            <Link className="button button--secondary" href="/question-papers/ptu">
              Browse papers
            </Link>
          </div>
          <p className="about-showcase__love">❤️ Made with love, Jannat Khan ❤️</p>
        </div>

        <aside className="about-showcase__side">
          <article className="about-panel">
            <p className="about-panel__title">About Me</p>
            <p>{profile.about}</p>
            <p>{profile.focus}</p>
          </article>
        </aside>
      </section>

      <section className="seo-copy">
        <h2>What UTpaper is</h2>
        <p>
          UTpaper (utpaper.in) is a free study platform for students preparing for government exams and university
          exams. It started in 2026 as a simple place to download previous year question papers without pop-ups or
          sign-up walls, and has grown into an online test platform where you can attempt real exam papers and mock
          tests with a timer, get your score and all-India rank instantly, and read the solution to every question.
        </p>

        <h2>What you get here</h2>
        <ul>
          <li>
            <strong>Online test series</strong> for teaching and other government exams such as BPSC TRE, Bihar STET,
            DSSSB TGT and RRB JE, with full-length mock tests, subject tests and previous year papers.{' '}
            <Link href="/test-series">Browse all test series</Link>.
          </li>
          <li>
            <strong>Real exam pattern</strong>: the same number of questions, time limit, marks, negative marking,
            sections and qualifying papers as the actual exam, so your mock score means something.
          </li>
          <li>
            <strong>Previous year question papers</strong> to download for free: PTU (IKGPTU) courses, Bihar Board
            Class 10 and competitive exams. <Link href="/question-papers/ptu">Open the question paper library</Link>.
          </li>
          <li>
            <strong>Progress tracking</strong>: every attempt is saved to your account, with score, accuracy, rank and
            section-wise marks, so you can see your improvement over time.
          </li>
        </ul>

        <h2>How the answer keys are prepared</h2>
        <p>
          Previous year papers are converted question by question from the original paper. Answers follow the official
          final answer key published by the exam board (for example BPSC, BSEB or DSSSB). Where the official answer is
          debatable, the explanation of that question says so instead of silently changing the answer. If you find a
          mistake, write to us and we will check the official key and correct it.
        </p>

        <h2>Who runs UTpaper</h2>
        <p>
          UTpaper is built and maintained by {profile.name}, a full stack web developer. There is no coaching institute
          behind it; the aim is simply to give every aspirant free access to the same practice material, with a fast and
          clean experience on mobile and desktop.
        </p>

        <h2>Contact</h2>
        <p>
          Questions, corrections or requests for a new exam or paper are welcome at{' '}
          <a href="mailto:utpaper.help@gmail.com">utpaper.help@gmail.com</a> or through the{' '}
          <Link href="/contact">contact page</Link>. Please also read our{' '}
          <Link href="/privacy-policy">privacy policy</Link> and <Link href="/disclaimer">terms and disclaimer</Link>.
        </p>
      </section>
    </>
  );
}
