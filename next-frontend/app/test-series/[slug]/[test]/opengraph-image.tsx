import { ImageResponse } from 'next/og';
import { getTest } from '@/lib/api';
import { parseTestIdFromSlug } from '@/lib/slug';

export const alt = 'Free online test on UTpaper';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const KIND_LABEL = { pyq: 'Previous Year Paper', exam: 'Full Mock Test', subject: 'Subject Test' } as const;

// Link preview for a test's landing page, so a shared test link shows its name and pattern instead of a generic image.
export default async function TestImage({ params }: { params: Promise<{ slug: string; test: string }> }) {
  const { test: param } = await params;
  const id = parseTestIdFromSlug(param);
  const test = id ? await getTest(id) : null;

  const facts = test
    ? [
        [`${test.questionCount}`, 'Questions'],
        [`${test.durationMinutes}`, 'Minutes'],
        [test.negativeMarks > 0 ? 'Yes' : 'No', 'Negative marking'],
        ['Free', 'Price']
      ]
    : [];

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
          {test ? (
            <div
              style={{
                display: 'flex',
                marginLeft: 'auto',
                padding: '8px 20px',
                borderRadius: 999,
                background: '#f59e0b',
                color: '#1c1300',
                fontSize: 22,
                fontWeight: 800
              }}
            >
              {KIND_LABEL[test.kind]} · Free
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {test?.seriesTitle ? <div style={{ display: 'flex', fontSize: 26, opacity: 0.8 }}>{test.seriesTitle}</div> : null}
          <div style={{ display: 'flex', fontSize: 50, fontWeight: 800, lineHeight: 1.2, maxWidth: 1060 }}>
            {test ? (test.title.length > 95 ? `${test.title.slice(0, 92)}…` : test.title) : 'Free online test on UTpaper'}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {facts.map(([value, label]) => (
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
                <div style={{ display: 'flex', fontSize: 32, fontWeight: 800 }}>{value}</div>
                <div style={{ display: 'flex', fontSize: 18, opacity: 0.75, textTransform: 'uppercase' }}>{label}</div>
              </div>
            ))}
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
            Attempt free · instant rank →
          </div>
        </div>
      </div>
    ),
    size
  );
}
