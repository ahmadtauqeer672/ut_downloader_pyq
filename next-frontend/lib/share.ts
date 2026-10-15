// Helpers for shared result links: /r/<attemptId>-<signature>.

export function parseShareParam(param: string): { id: number; sig: string } | null {
  const match = /^(\d+)-([a-f0-9]{8,64})$/.exec(param);
  if (!match) return null;
  return { id: Number(match[1]), sig: match[2] };
}

export function percentOf(score: number, maxScore: number) {
  return maxScore > 0 ? Math.max(0, Math.round((score / maxScore) * 100)) : 0;
}

export function accuracyOf(correct: number, wrong: number) {
  const attempted = correct + wrong;
  return attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
}

export function formatScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(2).replace(/\.?0+$/, '');
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || '';
}
