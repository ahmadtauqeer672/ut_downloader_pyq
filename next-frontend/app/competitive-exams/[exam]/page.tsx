import Link from 'next/link';
import { notFound } from 'next/navigation';
import { competitiveDownloadHref, groupCompetitiveByYear, listCompetitiveExams, listCompetitivePapers } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import { competitiveExamHref, slugify } from '@/lib/slug';

interface CompetitiveExamPageProps {
  params: Promise<{ exam: string }>;
}

async function findExamNameBySlug(examSlug: string): Promise<string | null> {
  const exams = await listCompetitiveExams().catch(() => []);
  return exams.find((exam) => slugify(exam) === examSlug) ?? null;
}

export async function generateMetadata({ params }: CompetitiveExamPageProps) {
  const { exam: examSlug } = await params;
  const examName = await findExamNameBySlug(examSlug);

  if (!examName) {
    return buildMetadata({
      title: 'Competitive Exam Papers | UTpaper',
      description: 'Browse competitive exam previous year papers on UTpaper.'
    });
  }

  return buildMetadata({
    title: `${examName} Previous Year Papers | UTpaper`,
    description: `Browse ${examName} previous year papers year-wise on UTpaper and download competitive exam PYQs faster.`,
    path: `/competitive-exams/${examSlug}`,
    keywords: [`${examName} papers`, `${examName} previous year papers`, 'competitive exam PYQ', 'UTpaper']
  });
}

export default async function CompetitiveExamPage({ params }: CompetitiveExamPageProps) {
  const { exam: examSlug } = await params;
  const examName = await findExamNameBySlug(examSlug);

  if (!examName) {
    notFound();
  }

  const papers = await listCompetitivePapers(examName);
  const yearGroups = groupCompetitiveByYear(papers);

  return (
    <>
      <section className="card section-card competitive-page-head">
        <div className="competitive-page-head__copy">
          <p className="eyebrow">Competitive Exam Papers</p>
          <h1>{examName} Previous Year Papers</h1>
          <p className="competitive-page-head__lede">
            Browse {examName} papers year-wise and download them directly from UTpaper.
          </p>
        </div>
        <div className="chip-row competitive-page-head__actions">
          <Link className="chip" href="/">
            All exam categories
          </Link>
          <a className="chip" href="#competitive-papers">
            Year-wise papers
          </a>
          <Link className="chip" href={competitiveExamHref(examName)}>
            {examName}
          </Link>
        </div>
      </section>

      <section id="competitive-papers" className="section card section-card competitive-archive">
        <div className="section-head competitive-archive__head">
          <div>
            <p className="eyebrow">Year-wise collection</p>
            <h2 className="section-title">{examName} paper archive</h2>
          </div>
          <div className="competitive-archive__summary">
            <span className="chip">{yearGroups.length} years</span>
            <span className="chip">{papers.length} papers</span>
          </div>
        </div>

        {yearGroups.length > 0 ? (
          yearGroups.map((group) => (
            <article className="competitive-year-card" key={group.year}>
              <div className="competitive-year-head">
                <h3>{group.year}</h3>
              </div>

              <div className="competitive-paper-list">
                {group.papers.map((paper) => (
                  <div className="competitive-paper-item" key={paper.id}>
                    <div className="competitive-paper-copy">
                      <a
                        className="paper-link competitive-paper-title"
                        href={competitiveDownloadHref(paper.id)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {paper.title}
                      </a>
                      <p className="paper-meta competitive-paper-meta">{paper.examName}</p>
                    </div>
                    <div className="paper-actions competitive-paper-actions">
                      <a
                        className="competitive-download"
                        href={competitiveDownloadHref(paper.id)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))
        ) : (
          <div className="notice-card">
            <strong>No papers found for {examName} yet.</strong>
            <p className="empty-state">Try another competitive exam from the home page while more papers are added.</p>
          </div>
        )}
      </section>
    </>
  );
}
