/* eslint-disable @next/next/no-img-element */
// Question/option content that may be text, an image (formulas copied from PDFs), or both.
// When an image exists it already contains the full content, so the text is only used as alt text.

interface RichContentProps {
  text: string;
  image?: string;
  className?: string;
  imageClassName?: string;
}

export function RichContent({ text, image, className, imageClassName }: RichContentProps) {
  if (image) {
    return <img className={imageClassName ?? 'rich-img'} src={image} alt={text || 'Question content'} loading="lazy" />;
  }
  return <span className={className}>{text}</span>;
}
