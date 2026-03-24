import type { Metadata } from 'next';
import { FAQ_ITEMS, SITE_URL } from '@/lib/data';

export function absoluteUrl(path = '/'): string {
  return new URL(path, SITE_URL).toString();
}

export function buildMetadata(input: {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
}): Metadata {
  const path = input.path ?? '/';
  const url = absoluteUrl(path);

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical: url
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      type: 'website',
      siteName: 'UTpaper'
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description
    }
  };
}

export function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'UTpaper',
    url: SITE_URL
  };
}
