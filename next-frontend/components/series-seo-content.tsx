import { JsonLdScript } from '@/components/json-ld-script';
import { FaqItem, breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from '@/lib/seo';
import { TestSeriesDetail } from '@/lib/types';

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

// Crawlable text for a series page: exam pattern derived from the tests, plus FAQs, with matching
// structured data. Everything here is generated from the series data, so it stays correct as tests change.
export function SeriesSeoContent({ series }: { series: TestSeriesDetail }) {
  const tests = series.tests;
  const exam = series.examName || series.title;
  const totalQuestions = tests.reduce((sum, test) => sum + test.questionCount, 0);
  const pyqCount = tests.filter((test) => test.kind === 'pyq').length;
  const withNegative = tests.filter((test) => test.negativeMarks > 0);
  const sectionNames = [...new Set(tests.flatMap((test) => (test.sections ?? []).map((section) => section.name)))];
  const qualifying = [...new Set(tests.flatMap((test) => (test.sections ?? []).filter((s) => s.qualifying).map((s) => s.name)))];
  const languages = [...new Set(tests.map((test) => test.language).filter(Boolean))];

  const faqs: FaqItem[] = [
    {
      question: `Is the ${series.title} free?`,
      answer: `Yes. All ${tests.length} tests in this series are free on UTpaper. Create a free account or sign in with Google, attempt the test online and get your score, all-India rank and detailed solutions instantly.`
    },
    {
      question: `How many questions are there in the ${exam} tests?`,
      answer:
        tests.length === 1
          ? `The test has ${totalQuestions} questions and a time limit of ${tests[0].durationMinutes} minutes.`
          : `The series has ${tests.length} tests with ${totalQuestions} questions in total. Each test shows its number of questions, marks and time limit before you start.`
    },
    {
      question: `Is there negative marking in the ${exam} mock tests?`,
      answer:
        withNegative.length === 0
          ? 'No. These tests have no negative marking.'
          : withNegative.length === tests.length
            ? `Yes. Each wrong answer deducts ${marksText(withNegative[0].negativeMarks)} mark, following the real exam pattern.`
            : `Some tests have negative marking of ${marksText(withNegative[0].negativeMarks)} mark per wrong answer; the test instructions show the exact rule before you start.`
    }
  ];
  if (sectionNames.length > 0) {
    faqs.push({
      question: `What is the exam pattern of the ${exam} test?`,
      answer:
        `The tests are divided into ${listText(sectionNames)} sections` +
        (qualifying.length > 0
          ? `. ${listText(qualifying)} ${qualifying.length === 1 ? 'is' : 'are'} qualifying only: you must reach the pass mark, but the marks are not added to your merit score.`
          : '.') +
        (tests.some((test) => test.notAttemptedOption)
          ? ' Every question also has a “Question not attempted” option; a question left completely blank is penalised like a wrong answer.'
          : '')
    });
  }
  if (pyqCount > 0) {
    faqs.push({
      question: `Does this series include ${exam} previous year question papers?`,
      answer: `Yes. ${pyqCount} of the ${tests.length} tests are previous year papers with the official answer key, so you can attempt the real paper online with a timer and see where you stand.`
    });
  }
  faqs.push({
    question: 'Can I see the solutions after the test?',
    answer: 'Yes. After submitting you get your score, rank, accuracy, section-wise marks and the correct answer with explanation for every question. You can reattempt any test as many times as you like.'
  });

  return (
    <>
      <JsonLdScript
        payload={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Test Series', path: '/test-series' },
          { name: series.title, path: `/test-series/${series.slug}` }
        ])}
      />
      <JsonLdScript
        payload={itemListJsonLd(
          series.title,
          tests.map((test) => ({ name: test.title, path: `/tests/${test.id}` }))
        )}
      />
      <JsonLdScript payload={faqJsonLd(faqs)} />

      <section className="seo-copy">
        <h2>About {series.title}</h2>
        <p>
          Practise {exam} online with {tests.length === 1 ? 'a free full-length test' : `${tests.length} free tests`} on UTpaper.
          {pyqCount > 0 ? ` ${pyqCount === tests.length ? 'All' : pyqCount} of them ${pyqCount === 1 ? 'is a' : 'are'} previous year ${pyqCount === 1 ? 'paper' : 'papers'} with the official answer key, so you attempt the real exam paper with a real timer.` : ''}
          {' '}Every attempt gives you an instant score, all-India rank, accuracy and detailed solutions
          {languages.length > 0 ? `. Tests are available in ${listText(languages)}` : ''}.
        </p>

        <h2>{exam} exam pattern on UTpaper</h2>
        <div className="section-table-wrap">
          <table className="section-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Questions</th>
                <th>Time</th>
                <th>Marking</th>
                {sectionNames.length > 0 ? <th>Sections</th> : null}
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test.id}>
                  <td>{test.title}</td>
                  <td>{test.questionCount}</td>
                  <td>{test.durationMinutes} min</td>
                  <td>
                    +{marksText(test.marksPerQuestion)}
                    {test.negativeMarks > 0 ? ` / −${marksText(test.negativeMarks)}` : ', no negative'}
                  </td>
                  {sectionNames.length > 0 ? (
                    <td>{(test.sections ?? []).map((s) => `${s.name}${s.qualifying ? ' (qualifying)' : ''}`).join(', ') || '—'}</td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
    </>
  );
}
