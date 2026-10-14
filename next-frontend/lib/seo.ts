import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/data';

export const SITE_NAME = 'UTpaper';
export const DEFAULT_OG_IMAGE = '/og-image.png';

export function absoluteUrl(path = '/'): string {
  return new URL(path, SITE_URL).toString();
}

export function buildMetadata(input: {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const path = input.path ?? '/';
  const url = absoluteUrl(path);
  const image = absoluteUrl(input.image ?? DEFAULT_OG_IMAGE);

  return {
    metadataBase: new URL(SITE_URL),
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical: url
    },
    robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_IN',
      images: [{ url: image, width: 1200, height: 630, alt: SITE_NAME }]
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [image]
    }
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/utpaper-logo.png'),
    email: 'utpaper.help@gmail.com'
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'en-IN',
    description: 'Free online mock tests, test series and previous year question papers for government exams and universities.'
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}

export function itemListJsonLd(name: string, items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path)
    }))
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer }
    }))
  };
}
