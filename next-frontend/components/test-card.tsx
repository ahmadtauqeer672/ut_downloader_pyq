import { ClockIcon, LanguageIcon, MarksIcon, QuestionIcon, UsersIcon } from '@/components/icons';
import { MockTest } from '@/lib/types';

interface TestCardProps {
  test: MockTest;
  index: number;
  onAttempt: (test: MockTest) => void;
}

// Marks like 0.25 or 1/3 read better as fractions ("1/3") than as long decimals ("0.3333").
export function formatMarks(value: number) {
  if (Number.isInteger(value)) return String(value);
  for (const d of [2, 3, 4, 5, 8]) {
    const n = value * d;
    if (Math.abs(n - Math.round(n)) < 0.01) return `${Math.round(n)}/${d}`;
  }
  return value.toFixed(2).replace(/0+$/, '');
}

export function TestCard({ test, index, onAttempt }: TestCardProps) {
  const totalMarks = formatMarks(test.questionCount * test.marksPerQuestion);

  return (
    <article className={`sd-test${test.isFeatured ? ' sd-test--featured' : ''}`}>
      <div className="sd-test__top">
        <span className="sd-test__index">{String(index).padStart(2, '0')}</span>
        <span className="sd-test__tags">
          {test.isFeatured ? <span className="sd-tag sd-tag--pick">Must attempt</span> : null}
          <span className="sd-tag sd-tag--free">Free</span>
          <span className={`sd-tag sd-tag--${test.difficulty.toLowerCase()}`}>{test.difficulty.toLowerCase()}</span>
        </span>
      </div>

      <h3 className="sd-test__title">{test.title}</h3>

      <ul className="sd-test__stats">
        <li>
          <QuestionIcon className="icon icon--sm" />
          <b>{test.questionCount}</b> Qs
        </li>
        <li>
          <MarksIcon className="icon icon--sm" />
          <b>{totalMarks}</b> Marks
        </li>
        <li>
          <ClockIcon className="icon icon--sm" />
          <b>{test.durationMinutes}</b> Min
        </li>
      </ul>

      <div className="sd-test__foot">
        <span>
          <LanguageIcon className="icon icon--sm" /> {test.language}
        </span>
        {test.negativeMarks > 0 ? <span>-{formatMarks(test.negativeMarks)} negative</span> : null}
        {test.attemptCount > 0 ? (
          <span>
            <UsersIcon className="icon icon--sm" /> {formatCount(test.attemptCount)}
          </span>
        ) : null}
      </div>

      <button className="sd-test__start" type="button" onClick={() => onAttempt(test)}>
        Start test
        <svg className="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </article>
  );
}

function formatCount(value: number) {
  return value.toLocaleString('en-IN');
}
