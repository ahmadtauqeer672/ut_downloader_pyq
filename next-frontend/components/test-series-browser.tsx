'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronIcon } from '@/components/icons';
import { TestSeries } from '@/lib/types';

const OTHER = 'Other exams';
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

function SeriesTile({ series }: { series: TestSeries }) {
  return (
    <Link className="series-tile" href={`/test-series/${series.slug}`}>
      {series.logoUrl ? (
        <span className="series-tile__badge series-tile__badge--logo" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={series.logoUrl} alt="" loading="lazy" />
        </span>
      ) : (
        <span className="series-tile__badge" style={{ background: badgeColor(series) }} aria-hidden="true">
          {badgeText(series)}
        </span>
      )}
      <span className="series-tile__body">
        <strong>{series.title}</strong>
        <span className="series-tile__meta">
          {series.testCount} {series.testCount === 1 ? 'test' : 'tests'}
          {series.studentCount > 0 ? ` · ${series.studentCount} ${series.studentCount === 1 ? 'student' : 'students'}` : ''}
        </span>
      </span>
      <ChevronIcon className="icon series-tile__arrow" />
    </Link>
  );
}

export function TestSeriesBrowser({ seriesList }: { seriesList: TestSeries[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const series of seriesList) counts.set(categoryOf(series), (counts.get(categoryOf(series)) ?? 0) + 1);
    // Biggest categories first, "Other exams" always last.
    return [...counts.entries()].sort(([a, countA], [b, countB]) => {
      if (a === OTHER || b === OTHER) return a === OTHER ? 1 : -1;
      return countB - countA || a.localeCompare(b);
    });
  }, [seriesList]);

  const q = query.trim().toLowerCase();
  const filtered = seriesList.filter((series) => {
    if (category !== 'All' && categoryOf(series) !== category) return false;
    if (!q) return true;
    return [series.title, series.examName, series.category].some((field) => field?.toLowerCase().includes(q));
  });

  // Group into category sections only when browsing everything; a search or chosen category shows one flat grid.
  const grouped = category === 'All' && !q && categories.length > 1;

  return (
    <>
      <div className="series-toolbar">
        <label className="series-search">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exam, e.g. BPSC TRE, SSC CGL, Railway"
            aria-label="Search test series"
          />
        </label>

        {categories.length > 1 ? (
          <div className="pill-scroller series-toolbar__pills" role="tablist" aria-label="Exam categories">
            <button type="button" className={`pill${category === 'All' ? ' is-active' : ''}`} onClick={() => setCategory('All')}>
              All exams <span className="pill__count">{seriesList.length}</span>
            </button>
            {categories.map(([name, count]) => (
              <button
                key={name}
                type="button"
                className={`pill${category === name ? ' is-active' : ''}`}
                onClick={() => setCategory(name)}
              >
                {name} <span className="pill__count">{count}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <section className="panel">
          <p className="empty-note">
            No test series found for “{query}”.{' '}
            <button
              className="text-link"
              type="button"
              onClick={() => {
                setQuery('');
                setCategory('All');
              }}
            >
              Show all exams
            </button>
          </p>
        </section>
      ) : grouped ? (
        categories.map(([name, count]) => (
          <section className="series-group" key={name}>
            <div className="series-group__head">
              <h2>{name}</h2>
              <span>{count} test series</span>
              {count > 8 ? (
                <button className="text-link" type="button" onClick={() => setCategory(name)}>
                  View all
                </button>
              ) : null}
            </div>
            <div className="series-tiles">
              {seriesList
                .filter((series) => categoryOf(series) === name)
                .slice(0, 8)
                .map((series) => (
                  <SeriesTile series={series} key={series.id} />
                ))}
            </div>
          </section>
        ))
      ) : (
        <section className="series-group">
          {q || category !== 'All' ? (
            <div className="series-group__head">
              <h2>{category === 'All' ? 'Search results' : category}</h2>
              <span>{filtered.length} test series</span>
            </div>
          ) : null}
          <div className="series-tiles">
            {filtered.map((series) => (
              <SeriesTile series={series} key={series.id} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
