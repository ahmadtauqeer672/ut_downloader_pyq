import { ImageResponse } from 'next/og';
import { getSharedResult } from '@/lib/api';
import { accuracyOf, formatScore, parseShareParam, percentOf } from '@/lib/share';

export const alt = 'UTpaper test result';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Link preview for a shared result: the score card WhatsApp, Telegram and Twitter show under the link.
export default async function SharedResultImage({ params }: { params: Promise<{ share: string }> }) {
  const { share } = await params;
  const parsed = parseShareParam(share);
  const result = parsed ? await getSharedResult(parsed.id, parsed.sig) : null;

  const percent = result ? percentOf(result.score, result.maxScore) : 0;
  const accuracy = result ? accuracyOf(result.correct, result.wrong) : 0;
  const who = result?.studentName || 'A UTpaper user';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 64px',
          background: 'linear-gradient(135deg, #1a3fb8 0%, #0f2a7a 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#ffffff',
              color: '#1a3fb8',
              fontSize: 26,
              fontWeight: 800
            }}
          >
            UT
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 800 }}>UTpaper</div>
          <div style={{ display: 'flex', fontSize: 22, opacity: 0.75, marginLeft: 8 }}>Free mock tests &amp; PYQs</div>
        </div>

        {result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', fontSize: 30, opacity: 0.85 }}>{who} scored</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18 }}>
              <div style={{ display: 'flex', fontSize: 132, fontWeight: 900, lineHeight: 1 }}>{formatScore(result.score)}</div>
              <div style={{ display: 'flex', fontSize: 44, opacity: 0.75, paddingBottom: 14 }}>/ {result.maxScore}</div>
              <div
                style={{
                  display: 'flex',
                  alignSelf: 'center',
                  marginLeft: 18,
                  padding: '8px 22px',
                  borderRadius: 999,
                  background: '#f59e0b',
                  color: '#1c1300',
                  fontSize: 32,
                  fontWeight: 800
                }}
              >
                {percent}%
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 34,
                fontWeight: 700,
                lineHeight: 1.25,
                maxWidth: 1060,
                overflow: 'hidden'
              }}
            >
              {result.test.title.length > 90 ? `${result.test.title.slice(0, 87)}…` : result.test.title}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', fontSize: 48, fontWeight: 800 }}>Test result on UTpaper</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {result
              ? [
                  ['Rank', `#${result.rank} of ${result.rankOutOf}`],
                  ['Accuracy', `${accuracy}%`],
                  ['Correct', `${result.correct} / ${result.total}`]
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '14px 22px',
                      borderRadius: 18,
                      background: 'rgba(255,255,255,0.14)'
                    }}
                  >
                    <div style={{ display: 'flex', fontSize: 18, opacity: 0.75, textTransform: 'uppercase' }}>{label}</div>
                    <div style={{ display: 'flex', fontSize: 32, fontWeight: 800 }}>{value}</div>
                  </div>
                ))
              : null}
          </div>
          <div
            style={{
              display: 'flex',
              padding: '16px 28px',
              borderRadius: 16,
              background: '#ffffff',
              color: '#1a3fb8',
              fontSize: 26,
              fontWeight: 800
            }}
          >
            Attempt free on utpaper.in →
          </div>
        </div>
      </div>
    ),
    size
  );
}
