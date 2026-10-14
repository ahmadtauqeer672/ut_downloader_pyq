import Link from 'next/link';
import { ChevronIcon, ClockIcon, LanguageIcon, MarksIcon, QuestionIcon, UsersIcon } from '@/components/icons';
import { JsonLdScript } from '@/components/json-ld-script';
import { FaqItem, breadcrumbJsonLd, faqJsonLd } from '@/lib/seo';
import { testHref } from '@/lib/slug';
import { MockTest, TestPreview, TestSeriesDetail } from '@/lib/types';

export const KIND_LABEL = { pyq: 'Previous Year Paper', exam: 'Full Mock Test', subject: 'Subject Test' } as const;

// Marks like 0.3333 read better as "1/3".
function marksText(value: number) {
  if (Number.isInteger(value)) return String(value);
  for (const d of [2, 3, 4, 5]) {
    const n = value * d;
    if (Math.abs(n - Math.round(n)) < 0.01) return `${Math.round(n)}/${d}`;
  }
  return value.toFixed(2);
}

function listText(items: string[]) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function describeTest(test: MockTest) {
  const marking = test.negativeMarks > 0 ? `${marksText(test.negativeMarks)} negative marking` : 'no negative marking';
  const what = test.kind === 'pyq' ? 'with the official answer key' : 'based on the latest exam pattern';
  return `Attempt ${test.title} online for free ${what}: ${test.questionCount} questions, ${test.durationMinutes} minutes, ${marking}. Instant score, all-India rank and detailed solutions on UTpaper.`;
}

interface TestLandingProps {
  test: MockTest;
  series: TestSeriesDetail;
  preview: TestPreview | null;
}

// Server-rendered landing page for one test: everything a searcher wants to know before attempting,
// written from the test data so it stays correct as tests change.
export function TestLanding({ test, series, preview }: TestLandingProps) {
  const exam = series.examName || series.title;
  const kind = KIND_LABEL[test.kind];
  const totalMarks = marksText(test.questionCount * test.marksPerQuestion);
  const sections = test.sections ?? [];
  const counts = new Map((preview?.sectionCounts ?? []).map((s) => [s.name, s.count]));
  const qualifying = sections.filter((s) => s.qualifying).map((s) => s.name);
  const others = series.tests.filter((other) => other.id !== test.id).slice(0, 8);
  const attemptHref = `/tests/${test.id}`;
  const samples = preview?.sampleQuestions ?? [];

  const faqs: FaqItem[] = [
    {
      question: `Is the ${test.title} free to attempt?`,
      answer:
        'Yes. The test is completely free on UTpaper. Sign in with Google or create a free account, click Attempt test, and your score, rank and solutions appear as soon as you submit.'
    },
    {
      question: 'How many questions and how much time does this test have?',
      answer: `The test has ${test.questionCount} questions for ${totalMarks} marks and must be finished in ${test.durationMinutes} minutes.${
        test.negativeMarks > 0 ? ` Each wrong answer deducts ${marksText(test.negativeMarks)} mark.` : ' There is no negative marking.'
      }`
    }
  ];
  if (test.kind === 'pyq') {
    faqs.push({
      question: `Are the answers in this ${exam} previous year paper official?`,
      answer:
        'Yes. The answer key follows the official final answer key released by the exam board. Where an official answer is debatable, the explanation says so.'
    });
  }
  if (sections.length > 0) {
    faqs.push({
      question: 'What are the sections in this test?',
      answer:
        `The test has ${sections.length} sections: ${listText(
          sections.map((s) => `${s.name}${counts.has(s.name) ? ` (${counts.get(s.name)} questions)` : ''}`)
        )}.` +
        (qualifying.length > 0
          ? ` ${listText(qualifying)} ${qualifying.length === 1 ? 'is' : 'are'} qualifying only: you must reach the pass mark, but those marks are not added to your total.`
          : '') +
        (test.notAttemptedOption
          ? ' Every question also has a “Question not attempted” option; a question left completely blank is penalised like a wrong answer, as in the real exam.'
          : '')
    });
  }
  faqs.push({
    question: 'Can I reattempt the test and see solutions?',
    answer:
      'Yes. After submitting you see the correct answer and explanation for every question, your accuracy, section-wise marks and all-India rank. You can reattempt as many times as you like.'
  });

  return (
    <>
      <JsonLdScript
        payload={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Test Series', path: '/test-series' },
          { name: series.title, path: `/test-series/${series.slug}` },
          { name: test.title, path: testHref(test, series.slug) }
        ])}
      />
      <JsonLdScript payload={faqJsonLd(faqs)} />

      <nav className="sd-crumbs tp-crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <ChevronIcon className="icon icon--sm" />
        <Link href="/test-series">Test Series</Link>
        <ChevronIcon className="icon icon--sm" />
        <Link href={`/test-series/${series.slug}`}>{exam}</Link>
        <ChevronIcon className="icon icon--sm" />
        <span aria-current="page">{kind}</span>
      </nav>

      <section className="tp-hero">
        <div className="tp-hero__main">
          <p className="tp-eyebrow">
            <span className="sd-tag sd-tag--free">Free</span>
            <span>{kind}</span>
            {test.category ? <span>· {test.category}</span> : null}
          </p>
          <h1>{test.title}</h1>
          <p className="tp-lede">{describeTest(test)}</p>
          <ul className="sd-test__stats tp-stats">
            <li>
              <QuestionIcon className="icon icon--sm" />
              <b>{test.questionCount}</b> Questions
            </li>
            <li>
              <MarksIcon className="icon icon--sm" />
              <b>{totalMarks}</b> Marks
            </li>
            <li>
              <ClockIcon className="icon icon--sm" />
              <b>{test.durationMinutes}</b> Minutes
            </li>
            <li>
              <LanguageIcon className="icon icon--sm" />
              <b>{test.language}</b>
            </li>
            {test.attemptCount > 0 ? (
              <li>
                <UsersIcon className="icon icon--sm" />
                <b>{test.attemptCount.toLocaleString('en-IN')}</b> attempts
              </li>
            ) : null}
          </ul>
          <div className="tp-actions">
            <Link className="button button--primary button--lg" href={attemptHref}>
              Attempt test free →
            </Link>
            <Link className="button button--ghost" href={`/test-series/${series.slug}`}>
              All {exam} tests
            </Link>
          </div>
        </div>

        <aside className="tp-details">
          <h2>Test details</h2>
          <dl>
            <div>
              <dt>Exam</dt>
              <dd>{exam}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{kind}</dd>
            </div>
            <div>
              <dt>Questions</dt>
              <dd>{test.questionCount}</dd>
            </div>
            <div>
              <dt>Total marks</dt>
              <dd>{totalMarks}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{test.durationMinutes} minutes</dd>
            </div>
            <div>
              <dt>Marking</dt>
              <dd>
                +{marksText(test.marksPerQuestion)} per correct
                {test.negativeMarks > 0 ? `, −${marksText(test.negativeMarks)} per wrong` : ', no negative marking'}
              </dd>
            </div>
            <div>
              <dt>Language</dt>
              <dd>{test.language}</dd>
            </div>
            {sections.length > 0 ? (
              <div>
                <dt>Sections</dt>
                <dd>{sections.map((s) => `${s.name}${s.qualifying ? ' (qualifying)' : ''}`).join(', ')}</dd>
              </div>
            ) : null}
            <div>
              <dt>Price</dt>
              <dd>Free</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="seo-copy tp-copy">
        <h2>About {test.title}</h2>
        <p>
          {test.kind === 'pyq'
            ? `This is the actual ${test.title} converted into an online test with the official answer key. Attempt it with the real time limit of ${test.durationMinutes} minutes to see exactly how you would score in the ${exam} exam, then go through the solutions to fix weak topics.`
            : `This ${kind.toLowerCase()} for ${exam} follows the real exam pattern: ${test.questionCount} questions in ${test.durationMinutes} minutes${
                test.negativeMarks > 0 ? ` with ${marksText(test.negativeMarks)} negative marking` : ''
              }. Attempt it like the real exam and compare your rank with other aspirants.`}{' '}
          It is one of {series.tests.length} free tests in the <Link href={`/test-series/${series.slug}`}>{series.title}</Link>.
        </p>

        {sections.length > 0 ? (
          <>
            <h2>Section-wise pattern</h2>
            <div className="section-table-wrap">
              <table className="section-table">
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Questions</th>
                    <th>Marks</th>
                    <th>Counts for merit?</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map((s) => (
                    <tr key={s.name}>
                      <td>{s.name}</td>
                      <td>{counts.get(s.name) ?? '—'}</td>
                      <td>{counts.has(s.name) ? marksText((counts.get(s.name) ?? 0) * test.marksPerQuestion) : '—'}</td>
                      <td>{s.qualifying ? `Qualifying only (${s.passPercent}% to pass)` : 'Yes'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {samples.length > 0 ? (
          <>
            <h2>Sample questions from this test</h2>
            <ol className="tp-samples">
              {samples.map((q) => (
                <li key={q.position}>
                  <p>
                    <strong>Q{q.position}.</strong> {q.question}
                  </p>
                  <ol type="A">
                    {q.options.map((option, index) => (
                      <li key={index}>{option}</li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
            <p>
              <Link href={attemptHref}>Attempt the full test</Link> to answer all {test.questionCount} questions and see the
              correct answers with explanations.
            </p>
          </>
        ) : null}

        <h2>How to attempt</h2>
        <ol className="tp-steps">
          <li>Click “Attempt test free” and sign in with Google or your UTpaper account.</li>
          <li>
            The timer starts at {test.durationMinutes} minutes. Use the question palette to move between questions and mark
            questions for review.
          </li>
          <li>
            Submit when done. You get your score, accuracy{sections.length > 0 ? ', section-wise marks' : ''} and all-India
            rank instantly, with the solution for every question.
          </li>
        </ol>

        <h2>Frequently asked questions</h2>
        <dl className="seo-faq">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <dt>{faq.question}</dt>
              <dd>{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      {others.length > 0 ? (
        <section className="tp-more">
          <div className="section-head">
            <div>
              <p className="eyebrow">More in this series</p>
              <h2 className="section-title">Other {exam} tests</h2>
            </div>
            <Link className="button button--ghost button--sm" href={`/test-series/${series.slug}`}>
              View all {series.tests.length}
            </Link>
          </div>
          <ul className="tp-more__list">
            {others.map((other) => (
              <li key={other.id}>
                <Link href={testHref(other, series.slug)}>
                  <span>{other.title}</span>
                  <small>
                    {KIND_LABEL[other.kind]} · {other.questionCount} Qs · {other.durationMinutes} min
                  </small>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
