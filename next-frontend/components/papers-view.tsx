import Link from 'next/link';
import { PapersFilterForm } from '@/components/papers-filter-form';
import { BSEB_10TH_SUBJECTS, UNIVERSITY_OPTIONS } from '@/lib/data';
import {
  competitiveDownloadHref,
  groupCompetitiveByYear,
  groupPapersBySemester,
  paperDownloadHref
} from '@/lib/api';
import { competitiveExamHref, courseHref, courseSubjectHref } from '@/lib/slug';
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
  showPaperList?: boolean;
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
  showAcademicPapers = true,
  showPaperList = true
}: PapersViewProps) {
  const activeUniversity = university ?? UNIVERSITY_OPTIONS[0] ?? null;
  const semesterGroups = groupPapersBySemester(papers);
  const competitiveGroups = groupCompetitiveByYear(competitivePapers);
  const isBseb10thPage = university?.name === 'BIHAR BOARD (BSEB)' && course === '10TH';
  const isBsebSubjectPage = isBseb10thPage && Boolean(subject);
  const useBsebYearArchive = isBseb10thPage;
  const directYearGroups = groupPapersByYear(papers);
  const heroNote = isBsebSubjectPage
    ? `All Bihar Board 10th ${subject} papers are listed year-wise below. Open any paper to view or download it as a PDF.`
    : isBseb10thPage
    ? 'Pick a subject to see its papers year-wise, or scroll down for the full list. Every paper opens as a free PDF.'
    : 'No sign-up needed to download papers. Pick your university and course, then open any paper as a PDF.';
  const popularLinks = [
    { label: 'PTU BTECH', hint: 'Semester-wise papers', href: courseHref('PTU', 'BTECH') },
    { label: 'PTU BCA', hint: 'All semesters', href: courseHref('PTU', 'BCA') },
    { label: 'PTU MBA', hint: 'All semesters', href: courseHref('PTU', 'MBA') },
    { label: 'Bihar Board Class 10', hint: 'Subject-wise papers', href: courseHref('BIHAR BOARD (BSEB)', '10TH') }
  ];

  return (
    <>
      <section className="hero">
        <div className="card hero__main">
          <h1>{heading}</h1>
          <p className="hero__lede">{description}</p>
          <p className="hero__note">{heroNote}</p>
          <div className="button-row">
            <a className="button button--primary" href="#paper-directory">
              Browse question papers
            </a>
            <Link className="button button--secondary" href="/test-series">
              Take a free mock test
            </Link>
          </div>
        </div>

        <aside className="card hero__side">
          <h2 className="hero__side-title">Popular right now</h2>
          <nav className="quick-links" aria-label="Popular paper categories">
            {popularLinks.map((item) => (
              <Link className="quick-link" href={item.href} key={item.label}>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </span>
                <span className="quick-link__arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </nav>
          {competitiveSummary.totalCount > 0 ? (
            <p className="hero__side-note">
              Plus <b>{competitiveSummary.totalCount}</b> competitive exam papers across {competitiveSummary.exams.length}{' '}
              exams.
            </p>
          ) : null}
        </aside>
      </section>

      {isBseb10thPage ? (
        <section className="section card section-card">
          <div className="section-head">
            <div>
              <h2 className="section-title">Bihar Board 10th papers, subject-wise</h2>
            </div>
          </div>

          <p className="section-copy">
            Browse BSEB Class 10 previous year question papers subject-wise in one place. UTpaper helps students find
            Bihar Board 10th papers faster without going through confusing links and multiple websites.
          </p>

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
        </section>
      ) : null}

      <section id="paper-directory" className="section paper-layout paper-directory-section">
        <div className="card section-card">
          <div className="section-head">
            <div>
              <h2 className="section-title">
                {isBsebSubjectPage
                  ? `${subject} papers, year-wise`
                  : isBseb10thPage
                    ? 'All subjects, year-wise'
                    : 'Find your question paper'}
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

          {!showPaperList ? null : showAcademicPapers ? (
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
              <strong>No papers found for this selection yet.</strong>
              <p className="empty-state">
                Try another course or semester. New papers are added regularly.
              </p>
            </div>
            )
          ) : (
            <div className="notice-card">
              <strong>Choose your filters and click Apply Filters.</strong>
              <p className="empty-state">Question papers will appear here after you apply the current selection.</p>
            </div>
          )}
        </div>

        <div>
          <aside className="card section-card promo-card">
            <span className="promo-card__badge">New on UTpaper</span>
            <h2 className="section-title">Free mock tests</h2>
            <p className="muted-copy">
              Practise with timed mock tests, see your score and rank instantly, and check the correct answer with
              explanation for every question.
            </p>
            <ul className="promo-card__list">
              <li>Full-length mocks &amp; subject tests</li>
              <li>Instant result with solutions</li>
              <li>Track every attempt in one place</li>
            </ul>
            <Link className="button button--primary" href="/test-series">
              Start a free test
            </Link>
          </aside>

          <article className="card section-card section">
            <div className="section-head">
              <div>
                <h2 className="section-title">Competitive exam papers</h2>
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
    </>
  );
}
