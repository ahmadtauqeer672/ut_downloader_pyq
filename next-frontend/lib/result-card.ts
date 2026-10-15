// Draws a square "I scored X/Y" card for sharing a test result on WhatsApp, Instagram or Telegram.
// Pure canvas, no dependencies, runs in the browser only.

export interface ResultCardData {
  name: string;
  testTitle: string;
  seriesTitle: string;
  score: number;
  maxScore: number;
  percent: number;
  rank: number;
  rankOutOf: number;
  accuracy: number;
  correct: number;
  wrong: number;
  url: string;
}

const SIZE = 1080;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Breaks text into at most maxLines lines that fit maxWidth; the last line is ellipsised if needed.
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(' ') !== lines.join(' ')) {
    let last = lines[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1).trimEnd();
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderResultCard(data: ResultCardData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser');
  const font = (weight: number, size: number) => `${weight} ${size}px "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

  // Background: deep blue gradient with two soft glows, matching the site's series hero.
  const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  bg.addColorStop(0, '#1a3fb8');
  bg.addColorStop(1, '#0f2a7a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);
  for (const [x, y, r, a] of [
    [900, 140, 420, 0.18],
    [120, 980, 380, 0.14]
  ]) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    glow.addColorStop(0, `rgba(255,255,255,${a})`);
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, SIZE, SIZE);
  }

  // Brand row.
  const logo = await loadImage('/utpaper-logo.png');
  let brandX = 72;
  if (logo) {
    ctx.save();
    roundRect(ctx, 72, 64, 72, 72, 18);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.clip();
    ctx.drawImage(logo, 80, 72, 56, 56);
    ctx.restore();
    brandX = 164;
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = font(800, 40);
  ctx.textBaseline = 'middle';
  ctx.fillText('UTpaper', brandX, 100);
  ctx.font = font(500, 24);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('Free mock tests & PYQs', brandX + ctx.measureText('UTpaper').width + 70, 102);

  // Headline.
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = font(600, 30);
  ctx.fillText(`${data.name || 'I'} scored`, 72, 230);

  ctx.fillStyle = '#ffffff';
  ctx.font = font(900, 150);
  const scoreText = `${Number.isInteger(data.score) ? data.score : data.score.toFixed(2)}`;
  ctx.fillText(scoreText, 72, 370);
  const scoreWidth = ctx.measureText(scoreText).width;
  ctx.font = font(700, 48);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText(`/ ${data.maxScore}`, 72 + scoreWidth + 24, 370);

  // Percent pill.
  ctx.font = font(800, 34);
  const pct = `${data.percent}%`;
  const pillW = ctx.measureText(pct).width + 56;
  roundRect(ctx, 72, 400, pillW, 60, 30);
  ctx.fillStyle = '#f59e0b';
  ctx.fill();
  ctx.fillStyle = '#1c1300';
  ctx.textBaseline = 'middle';
  ctx.fillText(pct, 100, 431);
  ctx.textBaseline = 'alphabetic';

  // Test title (wrapped).
  ctx.fillStyle = '#ffffff';
  ctx.font = font(700, 40);
  const titleLines = wrapText(ctx, data.testTitle, SIZE - 144, 3);
  let y = 540;
  for (const line of titleLines) {
    ctx.fillText(line, 72, y);
    y += 52;
  }
  if (data.seriesTitle && data.seriesTitle !== data.testTitle) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = font(500, 28);
    ctx.fillText(wrapText(ctx, data.seriesTitle, SIZE - 144, 1)[0] ?? '', 72, y + 6);
    y += 44;
  }

  // Stats tiles.
  const tiles = [
    { label: 'Rank', value: `#${data.rank}`, hint: `of ${data.rankOutOf}` },
    { label: 'Accuracy', value: `${data.accuracy}%`, hint: `${data.correct} right` },
    { label: 'Wrong', value: `${data.wrong}`, hint: 'questions' }
  ];
  const tileY = Math.max(y + 30, 740);
  const gap = 24;
  const tileW = (SIZE - 144 - gap * (tiles.length - 1)) / tiles.length;
  tiles.forEach((tile, index) => {
    const x = 72 + index * (tileW + gap);
    roundRect(ctx, x, tileY, tileW, 150, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = font(600, 24);
    ctx.fillText(tile.label.toUpperCase(), x + 28, tileY + 46);
    ctx.fillStyle = '#ffffff';
    ctx.font = font(900, 54);
    ctx.fillText(tile.value, x + 28, tileY + 108);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = font(500, 22);
    ctx.fillText(tile.hint, x + 28, tileY + 136);
  });

  // Footer CTA.
  roundRect(ctx, 72, 940, SIZE - 144, 76, 20);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.fillStyle = '#1a3fb8';
  ctx.font = font(800, 28);
  ctx.textBaseline = 'middle';
  ctx.fillText('Attempt this test free →', 100, 979);
  ctx.fillStyle = '#5d6779';
  ctx.font = font(600, 26);
  const shortUrl = data.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '');
  ctx.textAlign = 'right';
  ctx.fillText(shortUrl, SIZE - 100, 979);
  ctx.textAlign = 'left';

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image'))), 'image/png');
  });
}
