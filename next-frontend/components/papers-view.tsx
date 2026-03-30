import Link from 'next/link';
import { PapersFilterForm } from '@/components/papers-filter-form';
import {
  BSEB_10TH_SUBJECTS,
  FEATURE_ITEMS,
  UNIVERSITY_OPTIONS
} from '@/lib/data';
import {
  competitiveDownloadHref,
  groupCompetitiveByYear,
  groupPapersBySemester,
  paperDownloadHref
} from '@/lib/api';
import { competitiveExamHref, courseHref, courseSubjectHref, universityHref } from '@/lib/slug';
import { CompetitivePaper, CompetitiveSummary, Paper, UniversityOption } from '@/lib/types';

interface PapersViewProps {
  heading: string;
  description: string;
  university?: UniversityOption | null;
  course?: string | null;
  department?: string | null;
  semester?: string | null;
  subject?: string | null;
  papers: Paper[];
  competitiveSummary: CompetitiveSummary;
  competitivePapers?: CompetitivePaper[];
  showAcademicPapers?: boolean;
}

function semesterLabel(semester: number): string {
  return semester > 0 ? `Semester ${semester}` : 'General papers';
}

function groupPapersByYear(papers: Paper[]): Array<{ year: number; papers: Paper[] }> {
  const yearMap = new Map<number, Paper[]>();

  for (const paper of papers) {
    const year = Number(paper.year) || 0;
    const bucket = yearMap.get(year) ?? [];
    bucket.push(paper);
    yearMap.set(year, bucket);
  }

  return [...yearMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, yearPapers]) => ({
      year,
      papers: yearPapers.sort((a, b) => (a.subject || a.title).localeCompare(b.subject || b.title))
    }));
}

function paperLabel(paper: Paper): string {
  return paper.subject || paper.title;
}

export function PapersView({
  heading,
  description,
  university,
  course,
  department,
  semester,
  subject,
  papers,
  competitiveSummary,
  competitivePapers = [],
  showAcademicPapers = true
}: PapersViewProps) {
  const activeUniversity = university ?? UNIVERSITY_OPTIONS[0] ?? null;
  const semesterGroups = groupPapersBySemester(papers);
  const competitiveGroups = groupCompetitiveByYear(competitivePapers);
  const isBseb10thPage = university?.name === 'BIHAR BOARD (BSEB)' && course === '10TH';
  const isBsebSubjectPage = isBseb10thPage && Boolean(subject);
  const useBsebYearArchive = isBseb10thPage;
  const directYearGroups = groupPapersByYear(papers);
  const heroNote = isBsebSubjectPage
    ? `Browse Bihar Board 10th ${subject} previous year papers on a dedicated year-wise page while keeping the main BSEB filter flow available.`
    : isBseb10thPage
    ? 'Browse Bihar Board 10th previous year question papers subject-wise with server-rendered content that helps students and search engines find the right papers faster.'
    : 'Browse PTU, PU Chandigarh, GNDU, MDU and GTU question papers with cleaner URLs, better crawlability and server-rendered HTML for search engines.';
  const pageFocusCopy = isBsebSubjectPage
    ? `This route is focused on BSEB Class 10 ${subject} papers with a year-wise archive that makes subject-specific browsing easier for students and search engines.`
    : isBseb10thPage
    ? 'This page focuses on BSEB Class 10 previous year papers, subject-wise browsing, and clear route text that can support Google indexing for Bihar Board searches.'
    : 'This page is server-rendered in Next.js so Google can crawl the real content and metadata more easily than a purely client-side app shell.';

  return (
    <>
      <section className="hero">
        <div className="card hero__main">
          <p className="eyebrow">Academic Resource Hub</p>
          <h1>{heading}</h1>
          <p className="hero__lede">{description}</p>
          <p className="hero__note">{heroNote}</p>
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
            {isBseb10thPage
              ? 'Browse BSEB Class 10 previous year question papers subject-wise in one place. UTpaper helps students find Bihar Board 10th papers faster without going through confusing links and multiple websites.'
              : 'UTpaper is built for students who want quick access to previous year question papers without hopping between many websites. You can browse dedicated university and course URLs, then open or download papers directly.'}
          </p>

          {isBseb10thPage ? (
            <>
              <p className="section-copy">
                You can open and download Bihar Board 10th question papers for Hindi MT, Hindi SIL, Urdu,
                Mathematics, Science, Social Science and Sanskrit. These papers are useful for understanding exam
                pattern, important chapters and repeated questions.
              </p>

              <p className="section-copy">
                Use the subject filter to quickly find the paper you need. Regular practice with BSEB Class 10
                previous year papers can help students improve revision, time management and confidence before board
                exams.
              </p>

              <div className="feature-grid">
                {BSEB_10TH_SUBJECTS.map((item) => (
                  <Link
                    className="feature-card feature-card--link"
                    href={`${courseSubjectHref(university?.name ?? 'BIHAR BOARD (BSEB)', course ?? '10TH', item)}#paper-directory`}
                    key={item}
                  >
                    <strong>{item}</strong>
                    <p>Bihar Board 10th previous year question papers for {item.toLowerCase()}.</p>
                    <span className="feature-card__hint">Open year-wise papers</span>
                  </Link>
                ))}
              </div>

              <div className="feature-grid section">
                <article className="feature-card">
                  <strong>How can I download Bihar Board 10th question papers?</strong>
                  <p>Select Bihar Board (BSEB), choose Class 10th, then pick a subject and apply filters.</p>
                </article>
                <article className="feature-card">
                  <strong>Which subjects are available for BSEB Class 10 papers?</strong>
                  <p>Hindi MT, Hindi SIL, Urdu, Mathematics, Science, Social Science and Sanskrit are available.</p>
                </article>
                <article className="feature-card">
                  <strong>Are Bihar Board 10th previous year papers useful?</strong>
                  <p>Yes, they help students understand question style, important topics and time management.</p>
                </article>
              </div>
            </>
          ) : (
            <div className="feature-grid">
              {FEATURE_ITEMS.map((item) => (
                <article className="feature-card" key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          )}
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
            {subject ? <span>{subject}</span> : null}
            <span>{papers.length} papers</span>
          </div>

          <p className="muted-copy">{pageFocusCopy}</p>

          <div className="chip-row">
            {UNIVERSITY_OPTIONS.map((option) => (
              <Link className="chip" href={universityHref(option.name)} key={option.name}>
                {option.name}
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section id="paper-directory" className="section paper-layout paper-directory-section">
        <div className="card section-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Academic library</p>
              <h2 className="section-title">
                {isBsebSubjectPage
                  ? `${subject} year-wise paper directory`
                  : isBseb10thPage
                    ? 'All subjects year-wise paper directory'
                    : 'Academic question paper directory'}
              </h2>
            </div>
          </div>

          <PapersFilterForm
            universities={UNIVERSITY_OPTIONS}
            initialUniversity={activeUniversity?.name ?? 'PTU'}
            initialCourse={course ?? ''}
            initialDepartment={department ?? ''}
            initialSemester={semester ?? ''}
            initialSubject={subject ?? ''}
          />

          {showAcademicPapers ? (
            useBsebYearArchive ? (
              directYearGroups.length > 0 ? (
                directYearGroups.map((yearGroup) => (
                  <article className="paper-group paper-group--subject" key={yearGroup.year}>
                    <div className="paper-group__head paper-group__head--subject">
                      <div className="subject-year-heading">
                        <span className="subject-year-heading__label">Year Archive</span>
                        <h3>{yearGroup.year}</h3>
                      </div>
                      <span className="chip chip--subject-count">{yearGroup.papers.length} papers</span>
                    </div>

                    <div className="paper-list paper-list--subject">
                      {yearGroup.papers.map((paper) => (
                        <div className="paper-item paper-item--subject" key={paper.id}>
                          <div className="paper-copy paper-copy--subject">
                            <span className="paper-mini-tag">{paper.examType || 'Question Paper'}</span>
                            <a
                              className="paper-link paper-link--subject"
                              href={paperDownloadHref(paper.id)}
                              target="_blank"
                              rel="nofollow noopener noreferrer"
                            >
                              {isBsebSubjectPage ? paper.title || paper.subject : paper.subject || paper.title}
                            </a>
                            <p className="paper-meta paper-meta--subject">
                              {[paper.subject, paper.examType].filter(Boolean).join(' / ')}
                            </p>
                          </div>

                          <div className="paper-actions paper-actions--subject">
                            <a href={paperDownloadHref(paper.id)} target="_blank" rel="nofollow noopener noreferrer">
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
                  <strong>{isBsebSubjectPage ? `No papers found for ${subject} yet.` : 'No papers found for BSEB 10th yet.'}</strong>
                  <p className="empty-state">
                    {isBsebSubjectPage
                      ? 'Try another BSEB subject page or use the filter above while more papers are being uploaded.'
                      : 'Try a subject filter above while more Bihar Board 10th papers are being uploaded.'}
                  </p>
                </div>
              )
            ) : semesterGroups.length > 0 ? (
            semesterGroups.map((group) => (
              <article className="paper-group" key={group.semester}>
                <div className="paper-group__head">
                  <h3>{semesterLabel(group.semester)}</h3>
                  <span className="chip">{group.papers.length} papers</span>
                </div>

                {groupPapersByYear(group.papers).map((yearGroup) => (
                  <div className="paper-year-group" key={`${group.semester}-${yearGroup.year}`}>
                    <h4 className="paper-year-heading">{yearGroup.year}</h4>

                    <div className="paper-list">
                      {yearGroup.papers.map((paper) => (
                        <div className="paper-item" key={paper.id}>
                          <div>
                            <a
                              className="paper-link"
                              href={paperDownloadHref(paper.id)}
                              target="_blank"
                              rel="nofollow noopener noreferrer"
                            >
                              {paperLabel(paper)}
                            </a>
                          </div>

                          <div className="paper-actions">
                            <a href={paperDownloadHref(paper.id)} target="_blank" rel="nofollow noopener noreferrer">
                              Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
                            rel="nofollow noopener noreferrer"
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
