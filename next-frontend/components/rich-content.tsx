'use client';

/* eslint-disable @next/next/no-img-element */
// Question/option content that may be text, an image (formulas copied from PDFs), or both.
// When an image exists it already contains the full content, so the text is only used as alt text.

import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { CloseIcon } from '@/components/icons';

interface RichContentProps {
  text: string;
  image?: string;
  className?: string;
  imageClassName?: string;
  // Question images can be tapped to open at full size; option images sit inside buttons, so they cannot.
  zoomable?: boolean;
}

// Below this share of its natural size the cropped PDF text gets hard to read, so offer a zoomed view.
const READABLE_RATIO = 0.7;

export function RichContent({ text, image, className, imageClassName, zoomable = false }: RichContentProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [shrunk, setShrunk] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const measure = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    setNaturalWidth(img.naturalWidth);
    setShrunk(img.clientWidth > 0 && img.clientWidth / img.naturalWidth < READABLE_RATIO);
  }, []);

  useEffect(() => {
    // Cached images can finish loading before React attaches onLoad.
    if (imgRef.current?.complete) measure();
    if (!zoomable) return;
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [image, zoomable, measure]);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setZoomed(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed]);

  if (!image) return <span className={className}>{text}</span>;

  // Every crop comes from the same PDF render, so sizing each image from its natural width keeps
  // question and option text the same size; CSS caps the width to the container.
  const style = naturalWidth ? ({ '--rich-w': naturalWidth } as CSSProperties) : undefined;
  const img = (
    <img
      ref={imgRef}
      className={`${imageClassName ?? 'rich-img'}${naturalWidth ? ' is-sized' : ''}`}
      style={style}
      src={image}
      alt={text || 'Question content'}
      loading="lazy"
      onLoad={measure}
    />
  );

  if (!zoomable) return img;

  return (
    <>
      <span className="rich-zoom">
        {img}
        {shrunk ? (
          <button className="rich-zoom__hint" type="button" onClick={() => setZoomed(true)}>
            <svg className="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M20 20l-4-4M11 8.5v5M8.5 11h5" />
            </svg>
            Tap to zoom
          </button>
        ) : null}
        {shrunk ? (
          <button className="rich-zoom__cover" type="button" aria-label="Zoom question" onClick={() => setZoomed(true)} />
        ) : null}
      </span>

      {zoomed ? (
        <div className="rich-viewer" role="dialog" aria-modal="true" aria-label="Zoomed question">
          <button className="rich-viewer__close" type="button" aria-label="Close" onClick={() => setZoomed(false)}>
            <CloseIcon />
          </button>
          <div className="rich-viewer__scroll">
            <img src={image} alt={text || 'Question content'} />
          </div>
          <p className="rich-viewer__tip">Scroll sideways or pinch to read · Rotate your phone for a wider view</p>
        </div>
      ) : null}
    </>
  );
}
