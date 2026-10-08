import { ClockIcon, LanguageIcon, MarksIcon, QuestionIcon, SparkIcon } from '@/components/icons';
import { MockTest } from '@/lib/types';

interface TestCardProps {
  test: MockTest;
  onAttempt: (test: MockTest) => void;
  variant?: 'featured' | 'compact';
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

export function TestCard({ test, onAttempt, variant = 'compact' }: TestCardProps) {
  const totalMarks = formatMarks(test.questionCount * test.marksPerQuestion);

  if (variant === 'featured') {
    return (
      <article className="test-card test-card--featured">
        <div className="test-card__body">
          <div className="test-card__tags">
            <span className="tag tag--free">
              <SparkIcon className="icon icon--sm" /> Free
            </span>
            <span className="tag tag--info">Must attempt</span>
          </div>
          <h3 className="test-card__title">{test.title}</h3>
          <ul className="test-card__meta">
            <li>
              <QuestionIcon /> {test.questionCount} Questions
            </li>
            <li>
              <MarksIcon /> {totalMarks} Marks
            </li>
            <li>
              <ClockIcon /> {test.durationMinutes} Mins
            </li>
          </ul>
        </div>
        <button className="button button--outline test-card__action" type="button" onClick={() => onAttempt(test)}>
          Attempt now
        </button>
        <div className="test-card__foot">
          <LanguageIcon /> {test.language}
        </div>
      </article>
    );
  }

  return (
    <article className="test-card">
      <div className="test-card__body">
        <div className="test-card__tags">
          <span className={`tag tag--${test.difficulty.toLowerCase()}`}>{test.difficulty}</span>
          <span className="tag tag--plain">{test.language}</span>
          {test.negativeMarks > 0 ? <span className="tag tag--plain">-{formatMarks(test.negativeMarks)} negative</span> : null}
        </div>
        <h3 className="test-card__title test-card__title--sm">{test.title}</h3>
        <p className="test-card__dots">
          <span>{test.questionCount} Ques</span>
          <span>{totalMarks} Marks</span>
          <span>{test.durationMinutes} Mins</span>
          {test.attemptCount > 0 ? <span>{test.attemptCount} attempted</span> : null}
        </p>
      </div>
      <button className="button button--outline button--sm test-card__action" type="button" onClick={() => onAttempt(test)}>
        Attempt now
      </button>
    </article>
  );
}
