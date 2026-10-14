import Link from 'next/link';
import { JsonLdScript } from '@/components/json-ld-script';
import { FaqItem, faqJsonLd } from '@/lib/seo';
import { TestSeries } from '@/lib/types';

// Crawlable text under the homepage test series browser, with FAQ structured data.
export function HomeSeoContent({ seriesList }: { seriesList: TestSeries[] }) {
  const exams = [...new Set(seriesList.map((series) => series.examName).filter(Boolean))];
  const totalTests = seriesList.reduce((sum, series) => sum + series.testCount, 0);

  const faqs: FaqItem[] = [
    {
      question: 'Are the mock tests on UTpaper free?',
      answer: `Yes. Every test series on UTpaper is free. Sign up with your email or Google account and attempt ${totalTests > 0 ? `${totalTests} ` : ''}online tests with instant score, all-India rank and detailed solutions.`
    },
    {
      question: 'Which exams are covered?',
      answer:
        exams.length > 0
          ? `UTpaper currently has test series for ${exams.join(', ')}, with new exams added regularly. Each series includes full-length mock tests, subject tests or previous year papers.`
          : 'UTpaper covers teaching, railway, SSC, state and other government exams, with new series added regularly.'
    },
    {
      question: 'Do the tests follow the real exam pattern?',
      answer: 'Yes. Each test uses the real exam’s number of questions, time limit, marks and negative marking. Exam-style tests also have sections, qualifying papers and a “question not attempted” option where the real exam has one.'
    },
    {
      question: 'Can I attempt previous year question papers online?',
      answer: 'Yes. Previous year papers are available as timed online tests with the official answer key, so you can see your score and rank exactly as in the real exam.'
    },
    {
      question: 'Where can I download university question papers?',
      answer: 'UTpaper also has free PTU (BTECH, BCA, BBA, MBA, MCA) and Bihar Board Class 10 previous year question papers to download from the Question Papers section.'
    }
  ];

  return (
    <>
      <JsonLdScript payload={faqJsonLd(faqs)} />
      <section className="seo-copy">
        <h2>Free online test series for government exams</h2>
        <p>
          UTpaper is a free platform to practise government exam mock tests online. Attempt full-length mock tests, subject-wise
          tests and previous year question papers in the real exam pattern, with a timer, question palette and mark-for-review,
          just like the actual exam. After every attempt you get your score, all-India rank, accuracy, section-wise marks and the
          solution to every question.
          {exams.length > 0 ? ` Current test series cover ${exams.join(', ')}.` : ''}
        </p>
        <p>
          Looking for university papers instead? Download free{' '}
          <Link href="/question-papers/ptu">PTU previous year question papers</Link> and{' '}
          <Link href="/question-papers/bihar-board-bseb/10th">Bihar Board Class 10 papers</Link>.
        </p>

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
