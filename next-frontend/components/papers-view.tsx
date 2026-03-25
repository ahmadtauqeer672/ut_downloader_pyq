import Link from 'next/link';
import { PapersFilterForm } from '@/components/papers-filter-form';
import {
  FEATURE_ITEMS,
  UNIVERSITY_OPTIONS
} from '@/lib/data';
import {
  competitiveDownloadHref,
  groupCompetitiveByYear,
  groupPapersBySemester,
  paperDownloadHref
} from '@/lib/api';
import { competitiveExamHref, courseHref, universityHref } from '@/lib/slug';
import { CompetitivePaper, CompetitiveSummary, Paper, UniversityOption } from '@/lib/types';

interface PapersViewProps {
  heading: string;
  description: string;
  university?: UniversityOption | null;
  course?: string | null;
  department?: string | null;
  semester?: string | null;
  papers: Paper[];
  competitiveSummary: CompetitiveSummary;
  competitivePapers?: CompetitivePaper[];
  showAcademicPapers?: boolean;
}

function semesterLabel(semester: number): string {
  return semester > 0 ? `Semester ${semester}` : 'General papers';
}

function paperLine(paper: Paper): string {
  const detailBits = [paper.subject, paper.examType, String(paper.year)];
  if (paper.department) detailBits.unshift(paper.department);
  return `${paper.title} | ${detailBits.join(' | ')}`;
}

export function PapersView({
  heading,
  description,
  university,
  course,
  department,
  semester,
  papers,
  competitiveSummary,
  competitivePapers = [],
  showAcademicPapers = true
}: PapersViewProps) {
  const activeUniversity = university ?? UNIVERSITY_OPTIONS[0] ?? null;
  const semesterGroups = groupPapersBySemester(papers);
  const competitiveGroups = groupCompetitiveByYear(competitivePapers);

  return (
    <>
      <section className="hero">
        <div className="card hero__main">
          <p className="eyebrow">Academic Resource Hub</p>
          <h1>{heading}</h1>
          <p className="hero__lede">{description}</p>
          <p className="hero__note">
            Browse PTU, PU Chandigarh, GNDU, MDU and GTU question papers with cleaner URLs, better crawlability and
            server-rendered HTML for search engines.
          </p>
          <div className="button-row">
            <a className="button button--primary" href="#paper-directory">
              Browse question papers
            </a>
            <Link className="button button--secondary" href={courseHref('PTU', 'BTECH')}>
              Open PTU BTECH papers
            </Link>
          </div>
        </div>

        <aside className="card hero__side">
          <p className="eyebrow">Trending on UTpaper</p>
          <h2 className="section-title">Start with high-demand paper categories</h2>
          <div className="hero-stat-grid">
            <article className="stat-card">
              <strong>{papers.length}</strong>
              <p>Papers on this page</p>
            </article>
            <article className="stat-card">
              <strong>{competitiveSummary.totalCount}</strong>
              <p>Total competitive papers</p>
            </article>
          </div>
          <div className="shortcut-grid">
            <Link className="chip" href={courseHref('PTU', 'BTECH')}>
              PTU BTECH
            </Link>
            <Link className="chip" href={courseHref('PTU', 'BCA')}>
              PTU BCA
            </Link>
            <Link className="chip" href={courseHref('PTU', 'MBA')}>
              PTU MBA
            </Link>
            
          </div>
        </aside>
      </section>

      <section className="section content-grid">
        <article className="card section-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Why students use UTpaper</p>
              <h2 className="section-title">Find university question papers faster</h2>
            </div>
          </div>

          <p className="section-copy">
            UTpaper is built for students who want quick access to previous year question papers without hopping between
            many websites. You can browse dedicated university and course URLs, then open or download papers directly.
          </p>

          <div className="feature-grid">
            {FEATURE_ITEMS.map((item) => (
              <article className="feature-card" key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </article>

        <aside className="card section-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Page focus</p>
              <h2 className="section-title">Current route details</h2>
            </div>
          </div>

          <div className="badge-line">
            <span>{university?.name ?? 'All universities'}</span>
            <span>{course ?? 'All courses'}</span>
            <span>{papers.length} papers</span>
          </div>

          <p className="muted-copy">
            This page is server-rendered in Next.js so Google can crawl the real content and metadata more easily than a
            purely client-side app shell.
          </p>

          <div className="chip-row">
            {UNIVERSITY_OPTIONS.map((option) => (
              <Link className="chip" href={universityHref(option.name)} key={option.name}>
                {option.name}
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section id="paper-directory" className="section paper-layout">
        <div className="card section-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Academic library</p>
              <h2 className="section-title">Academic question paper directory</h2>
            </div>
          </div>

          <PapersFilterForm
            universities={UNIVERSITY_OPTIONS}
            initialUniversity={activeUniversity?.name ?? 'PTU'}
            initialCourse={course ?? ''}
            initialDepartment={department ?? ''}
            initialSemester={semester ?? ''}
          />

          {showAcademicPapers ? (
            semesterGroups.length > 0 ? (
            semesterGroups.map((group) => (
              <article className="paper-group" key={group.semester}>
                <div className="paper-group__head">
                  <h3>{semesterLabel(group.semester)}</h3>
                  <span className="chip">{group.papers.length} papers</span>
                </div>

                <div className="paper-list">
                  {group.papers.map((paper) => (
                    <div className="paper-item" key={paper.id}>
                      <div>
                        <a className="paper-link" href={paperDownloadHref(paper.id)} target="_blank" rel="noreferrer">
                          {paperLine(paper)}
                        </a>
                        <p className="paper-meta">
                          {paper.university} / {paper.course}
                          {paper.department ? ` / ${paper.department}` : ''} / {paper.subject}
                        </p>
                      </div>

                      <div className="paper-actions">
                        <a href={paperDownloadHref(paper.id)} target="_blank" rel="noreferrer">
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
              <strong>No academic papers found for this route yet.</strong>
              <p className="empty-state">
                Try a broader university page or another course route while more papers are being uploaded.
              </p>
            </div>
            )
          ) : (
            <div className="notice-card">
              <strong>Select your route and click Apply Filters.</strong>
              <p className="empty-state">Question papers will appear here after you apply the current selection.</p>
            </div>
          )}
        </div>

        <div>
          <article className="card section-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Competitive exams</p>
                <h2 className="section-title">Year-wise exam paper summary</h2>
              </div>
            </div>

            {competitiveSummary.exams.length > 0 ? (
              <div className="chip-row">
                {competitiveSummary.exams.map((exam) => (
                  <Link className="chip" href={competitiveExamHref(exam)} key={exam}>
                    {exam}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="empty-state">Competitive exam data will appear here when papers are uploaded.</p>
            )}
          </article>

          {competitiveGroups.length > 0 && (
            <article className="card section-card section">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Competitive samples</p>
                  <h2 className="section-title">Recent competitive exam papers</h2>
                </div>
              </div>

              {competitiveGroups.slice(0, 3).map((group) => (
                <div className="competitive-card" key={group.year}>
                  <h3>{group.year}</h3>
                  <div className="paper-list">
                    {group.papers.slice(0, 4).map((paper) => (
                      <div className="paper-item" key={paper.id}>
                        <div>
                          <a
                            className="paper-link"
                            href={competitiveDownloadHref(paper.id)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {paper.title}
                          </a>
                          <p className="paper-meta">{paper.examName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </article>
          )}
        </div>
      </section>

      <section className="section card section-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Browse routes</p>
            <h2 className="section-title">University and course pages</h2>
          </div>
        </div>

        <div className="route-grid">
          {UNIVERSITY_OPTIONS.map((option) => (
            <article className="route-card" key={option.name}>
              <strong>{option.name}</strong>
              <div className="route-list">
                <Link href={universityHref(option.name)}>All {option.name} courses</Link>
                {option.courses.map((item) => (
                  <Link href={courseHref(option.name, item)} key={item}>
                    {option.name} {item}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

    </>
  );
}
