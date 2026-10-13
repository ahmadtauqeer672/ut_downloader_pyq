'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { ChevronIcon, LanguageIcon, TestsIcon, UsersIcon } from '@/components/icons';
import { cloudinaryThumb } from '@/lib/image';
import { TestSeries } from '@/lib/types';

const OTHER = 'Other exams';
const POPULAR_LIMIT = 10;
const BADGE_COLORS = ['#1a56db', '#0e9f6e', '#e02424', '#7e3af2', '#d97706', '#0891b2', '#db2777', '#4f46e5'];

function categoryOf(series: TestSeries) {
  return series.category?.trim() || OTHER;
}

function badgeText(series: TestSeries) {
  const source = (series.examName || series.title).replace(/[^A-Za-z0-9 ]/g, ' ').trim();
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'UT';
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  // Prefer the most specific acronym: "SSC CGL" -> CGL, "RRB NTPC" -> NTPC, "IBPS Clerk" -> IBPS.
  const acronyms = words.filter((word) => word.length >= 2 && word.length <= 5 && word === word.toUpperCase() && /[A-Z]/.test(word));
  if (acronyms.length > 0) return acronyms[acronyms.length - 1];
  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function badgeColor(series: TestSeries) {
  const key = series.examName || series.title;
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return BADGE_COLORS[hash % BADGE_COLORS.length];
}

// Tests store free-text languages ("English", "Hindi + English", "Bilingual"), so split and dedupe them.
function languagesOf(series: TestSeries) {
  const seen = new Map<string, string>();
  for (const value of series.languages ?? []) {
    for (const part of value.split(/[,/+&]| and /i)) {
      const name = part.trim();
      if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
    }
  }
  return [...seen.values()];
}

function formatCount(value: number) {
  return value.toLocaleString('en-IN');
}

function SeriesCard({ series }: { series: TestSeries }) {
  const languages = languagesOf(series);
  const attempts = series.attemptCount ?? 0;

  return (
    <Link className="ts-card" href={`/test-series/${series.slug}`}>
      <span className="ts-card__top">
        {series.logoUrl ? (
          <span className="ts-card__logo" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cloudinaryThumb(series.logoUrl, 96)} alt="" width={42} height={42} loading="lazy" />
          </span>
        ) : (
          <span className="ts-card__logo ts-card__logo--text" style={{ background: badgeColor(series) }} aria-hidden="true">
            {badgeText(series)}
          </span>
        )}
        <span className="ts-card__tag">{categoryOf(series)}</span>
      </span>

      <strong className="ts-card__title">{series.title}</strong>

      <span className="ts-card__meta">
        <span>
          <TestsIcon className="icon icon--sm" />
          {formatCount(series.testCount)} {series.testCount === 1 ? 'Test' : 'Tests'}
          {series.testCount > 0 ? <span className="ts-card__free">All Free</span> : null}
        </span>
        {attempts > 0 ? (
          <span>
            <UsersIcon className="icon icon--sm" />
            {formatCount(attempts)} {attempts === 1 ? 'Attempt' : 'Attempts'}
          </span>
        ) : null}
      </span>

      {languages.length > 0 ? (
        <span className="ts-card__meta">
          <span>
            <LanguageIcon className="icon icon--sm" />
            {languages.slice(0, 2).join(', ')}
            {languages.length > 2 ? <em>+{languages.length - 2} More</em> : null}
          </span>
        </span>
      ) : null}

      <span className="ts-card__foot">
        <span className="ts-card__cta">View Test Series</span>
      </span>
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

interface TestSeriesBrowserProps {
  seriesList: TestSeries[];
  heading?: string;
  headingLevel?: 'h1' | 'h2';
  intro?: React.ReactNode;
}

export function TestSeriesBrowser({ seriesList, heading = 'Test Series', headingLevel = 'h1', intro }: TestSeriesBrowserProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [categoryQuery, setCategoryQuery] = useState('');
  const popularRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const series of seriesList) counts.set(categoryOf(series), (counts.get(categoryOf(series)) ?? 0) + 1);
    // Biggest categories first, "Other exams" always last.
    return [...counts.entries()].sort(([a, countA], [b, countB]) => {
      if (a === OTHER || b === OTHER) return a === OTHER ? 1 : -1;
      return countB - countA || a.localeCompare(b);
    });
  }, [seriesList]);

  const popular = useMemo(
    () =>
      [...seriesList]
        .filter((series) => series.testCount > 0)
        .sort(
          (a, b) =>
            (b.attemptCount ?? 0) - (a.attemptCount ?? 0) || b.studentCount - a.studentCount || b.testCount - a.testCount
        )
        .slice(0, POPULAR_LIMIT),
    [seriesList]
  );

  const q = query.trim().toLowerCase();
  const filtered = seriesList.filter((series) => {
    if (selected.length > 0 && !selected.includes(categoryOf(series))) return false;
    if (!q) return true;
    return [series.title, series.examName, series.category].some((field) => field?.toLowerCase().includes(q));
  });

  const visibleCategories = categoryQuery.trim()
    ? categories.filter(([name]) => name.toLowerCase().includes(categoryQuery.trim().toLowerCase()))
    : categories;
  const totalTests = seriesList.reduce((sum, series) => sum + series.testCount, 0);
  const isFiltering = q.length > 0 || selected.length > 0;
  const Heading = headingLevel;

  function toggleCategory(name: string) {
    setSelected((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));
  }

  function clearFilters() {
    setQuery('');
    setSelected([]);
    setCategoryQuery('');
  }

  function scrollPopular(direction: 1 | -1) {
    const track = popularRef.current;
    if (track) track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' });
  }

  return (
    <>
      <section className="ts-hero">
        <Heading>{heading}</Heading>
        {intro ?? (
          <p>
            Looking for one place to practise online mock tests for Govt. exams? Attempt free test series with instant
            score, all-India rank and detailed solutions.
          </p>
        )}
        {seriesList.length > 0 ? (
          <p className="ts-hero__stats">
            <strong>{formatCount(seriesList.length)}</strong> test series · <strong>{formatCount(totalTests)}</strong> mock
            tests · <strong>100% free</strong>
          </p>
        ) : null}
        <form
          className="ts-hero__search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Test Series, e.g. BPSC TRE"
            aria-label="Search test series"
          />
        </form>
      </section>

      {seriesList.length === 0 ? (
        <section className="panel">
          <p className="empty-note">New test series are being added. Please check back soon.</p>
        </section>
      ) : (
        <>
          {!isFiltering && popular.length > 0 ? (
            <section className="ts-section">
              <div className="ts-section__head">
                <h2>Popular Test Series</h2>
                {popular.length > 3 ? (
                  <span className="ts-carousel__nav">
                    <button type="button" aria-label="Previous" onClick={() => scrollPopular(-1)}>
                      <ChevronIcon className="icon ts-flip" />
                    </button>
                    <button type="button" aria-label="Next" onClick={() => scrollPopular(1)}>
                      <ChevronIcon className="icon" />
                    </button>
                  </span>
                ) : null}
              </div>
              <div className="ts-carousel" ref={popularRef}>
                {popular.map((series) => (
                  <SeriesCard series={series} key={series.id} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="ts-section" ref={resultsRef}>
            <div className="ts-section__head">
              <h2 className="ts-found">
                {formatCount(filtered.length)} Test Series Found
              </h2>
              {isFiltering ? (
                <button className="text-link" type="button" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : null}
            </div>

            <div className="ts-layout">
              {categories.length > 1 ? (
                <aside className="ts-filter" aria-label="Filter by exam category">
                  <h3>Exam Category</h3>
                  {categories.length > 6 ? (
                    <label className="ts-filter__search">
                      <SearchIcon />
                      <input
                        type="search"
                        value={categoryQuery}
                        onChange={(e) => setCategoryQuery(e.target.value)}
                        placeholder="Search Exam Category"
                        aria-label="Search exam category"
                      />
                    </label>
                  ) : null}
                  <ul className="ts-filter__list">
                    {visibleCategories.map(([name, count]) => (
                      <li key={name}>
                        <label className={selected.includes(name) ? 'is-checked' : undefined}>
                          <input type="checkbox" checked={selected.includes(name)} onChange={() => toggleCategory(name)} />
                          <span>{name}</span>
                          <span className="ts-filter__count">{count}</span>
                        </label>
                      </li>
                    ))}
                    {visibleCategories.length === 0 ? <li className="ts-filter__none">No category found</li> : null}
                  </ul>
                </aside>
              ) : null}

              {filtered.length === 0 ? (
                <div className="panel ts-empty">
                  <p className="empty-note">
                    No test series found{q ? ` for “${query.trim()}”` : ''}.{' '}
                    <button className="text-link" type="button" onClick={clearFilters}>
                      Show all test series
                    </button>
                  </p>
                </div>
              ) : (
                <div className="ts-grid">
                  {filtered.map((series) => (
                    <SeriesCard series={series} key={series.id} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
