import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoConfig {
  title: string;
  description: string;
  path?: string;
  keywords?: string;
  robots?: string;
  type?: string;
  image?: string;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  private readonly siteName = 'UTpaper';
  private readonly siteUrl = 'https://utpaper.in';
  private readonly defaultImage = `${this.siteUrl}/assets/ut-logo.png`;
  private readonly structuredDataScriptId = 'app-seo-structured-data';

  update(config: SeoConfig): void {
    const pageUrl = this.absoluteUrl(config.path);
    const robots = config.robots || 'index,follow';
    const image = config.image || this.defaultImage;
    const type = config.type || 'website';

    this.title.setTitle(config.title);
    this.setCanonical(pageUrl);

    this.updateNamedTag('description', config.description);
    this.updateNamedTag('keywords', config.keywords);
    this.updateNamedTag('robots', robots);
    this.updateNamedTag('googlebot', robots);
    this.updateNamedTag('twitter:card', 'summary_large_image');
    this.updateNamedTag('twitter:title', config.title);
    this.updateNamedTag('twitter:description', config.description);
    this.updateNamedTag('twitter:image', image);

    this.updatePropertyTag('og:title', config.title);
    this.updatePropertyTag('og:description', config.description);
    this.updatePropertyTag('og:type', type);
    this.updatePropertyTag('og:url', pageUrl);
    this.updatePropertyTag('og:image', image);
    this.updatePropertyTag('og:site_name', this.siteName);

    this.setStructuredData(config.structuredData);
  }

  private updateNamedTag(name: string, content?: string): void {
    if (!content) {
      this.meta.removeTag(`name="${name}"`);
      return;
    }
    this.meta.updateTag({ name, content });
  }

  private updatePropertyTag(property: string, content?: string): void {
    if (!content) {
      this.meta.removeTag(`property="${property}"`);
      return;
    }
    this.meta.updateTag({ property, content });
  }

  private setCanonical(url: string): void {
    let link = this.document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', url);
  }

  private setStructuredData(data?: Record<string, unknown> | Array<Record<string, unknown>>): void {
    const existing = this.document.getElementById(this.structuredDataScriptId);
    if (!data) {
      existing?.remove();
      return;
    }

    const script = existing || this.document.createElement('script');
    script.id = this.structuredDataScriptId;
    script.setAttribute('type', 'application/ld+json');
    script.textContent = JSON.stringify(data);

    if (!existing) {
      this.document.head.appendChild(script);
    }
  }

  private absoluteUrl(path = '/'): string {
    return new URL(path, `${this.siteUrl}/`).toString();
  }
}
