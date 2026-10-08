import type { QuestionInput } from '@/lib/student-api';

// Parses pasted questions in this format (blank line between questions):
//
//   1. Which is the capital of Bihar?
//   A) Gaya
//   B) Patna
//   C) Bhagalpur
//   D) Muzaffarpur
//   Answer: B
//   Explanation: Patna is the capital.   (optional)
const OPTION_LINE = /^\(?([A-F])\s*[).:]\s*(.*)$/i;
const ANSWER_LINE = /^(?:ans|answer|correct(?:\s+answer)?)\s*[:\-.]\s*\(?([A-F])\)?/i;
const EXPLANATION_LINE = /^(?:explanation|exp|solution)\s*[:\-.]\s*(.*)$/i;
const NUMBER_PREFIX = /^(?:q(?:uestion)?\s*)?\d+\s*[.):-]\s*/i;

export interface ParsedQuestions {
  questions: QuestionInput[];
  errors: string[];
}

export function parseQuestionBlock(text: string): ParsedQuestions {
  const blocks = text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const questions: QuestionInput[] = [];
  const errors: string[] = [];

  blocks.forEach((block, blockIndex) => {
    const label = `Question ${blockIndex + 1}`;
    const questionLines: string[] = [];
    const options: string[] = [];
    const explanationLines: string[] = [];
    let answerLetter = '';
    let section: 'question' | 'options' | 'explanation' = 'question';

    for (const rawLine of block.split('\n')) {
      const line = rawLine.trim();
      if (!line) continue;

      const answer = line.match(ANSWER_LINE);
      const explanation = line.match(EXPLANATION_LINE);
      const option = line.match(OPTION_LINE);

      if (answer) {
        answerLetter = answer[1].toUpperCase();
      } else if (explanation) {
        section = 'explanation';
        if (explanation[1]) explanationLines.push(explanation[1]);
      } else if (section !== 'explanation' && option && option[1].toUpperCase() === String.fromCharCode(65 + options.length)) {
        section = 'options';
        options.push(option[2].trim());
      } else if (section === 'question') {
        questionLines.push(questionLines.length === 0 ? line.replace(NUMBER_PREFIX, '') : line);
      } else if (section === 'options' && options.length > 0) {
        options[options.length - 1] = `${options[options.length - 1]} ${line}`.trim();
      } else {
        explanationLines.push(line);
      }
    }

    const question = questionLines.join('\n').trim();
    const correctIndex = answerLetter ? answerLetter.charCodeAt(0) - 65 : -1;

    if (!question) errors.push(`${label}: question text is missing`);
    else if (options.length < 2) errors.push(`${label}: needs at least 2 options (A), B), …)`);
    else if (options.some((item) => !item)) errors.push(`${label}: one of the options is empty`);
    else if (correctIndex < 0 || correctIndex >= options.length) errors.push(`${label}: add a valid "Answer: X" line`);
    else questions.push({ question, options, correctIndex, explanation: explanationLines.join('\n').trim() });
  });

  return { questions, errors };
}
