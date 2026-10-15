'use client';

import { useEffect, useState } from 'react';
import { renderResultCard, ResultCardData } from '@/lib/result-card';

interface ShareResultProps {
  card: ResultCardData;
}

function shareText(card: ResultCardData) {
  return `I scored ${card.score}/${card.maxScore} (${card.percent}%) in ${card.testTitle} on UTpaper, rank #${card.rank} of ${card.rankOutOf}. Attempt it free: ${card.url}`;
}

// "Share result" block on the result page: a generated score card image plus share and download buttons.
// On phones the image goes straight into WhatsApp/Telegram through the Web Share API; elsewhere the user
// downloads the image and the WhatsApp button shares the text with the link.
export function ShareResult({ card }: ShareResultProps) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let cancelled = false;
    let url = '';
    renderResultCard(card)
      .then((image) => {
        if (cancelled) return;
        url = URL.createObjectURL(image);
        setBlob(image);
        setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setStatus('Could not create the score card on this device.');
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // The card only changes with the attempt, so draw it once per attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.url, card.score]);

  const fileName = `utpaper-result-${card.score}-of-${card.maxScore}.png`;
  const text = shareText(card);
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(text)}`;

  async function share() {
    if (!blob) return;
    const file = new File([blob], fileName, { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
    if (typeof nav.share === 'function' && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], text });
        return;
      } catch (err) {
        // The user closed the share sheet; nothing to report.
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }
    // No file sharing here (desktop browsers): save the image and open WhatsApp with the text.
    download();
    window.open(whatsappHref, '_blank', 'noopener');
  }

  function download() {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Copied! Paste it anywhere.');
    } catch {
      setStatus('Could not copy. Long-press the text to copy it.');
    }
    setTimeout(() => setStatus(''), 2500);
  }

  return (
    <section className="share-result">
      <div className="share-result__preview">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={`Score card: ${card.score} of ${card.maxScore}`} width={1080} height={1080} />
        ) : (
          <div className="share-result__placeholder">Preparing your score card…</div>
        )}
      </div>
      <div className="share-result__body">
        <p className="eyebrow">Share your result</p>
        <h2>Show friends your score</h2>
        <p className="muted">
          Share the card on WhatsApp, Telegram or Instagram. Friends can attempt the same test free and compare ranks.
        </p>
        <div className="share-result__actions">
          <button className="button button--primary" type="button" onClick={share} disabled={!blob}>
            Share result
          </button>
          <a className="button button--whatsapp" href={whatsappHref} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
          <button className="button button--outline" type="button" onClick={download} disabled={!blob}>
            Download image
          </button>
          <button className="button button--ghost" type="button" onClick={copyText}>
            Copy text
          </button>
        </div>
        {status ? <p className="share-result__status">{status}</p> : null}
      </div>
    </section>
  );
}
