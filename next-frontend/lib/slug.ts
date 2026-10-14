import { BSEB_10TH_SUBJECTS, UNIVERSITY_OPTIONS } from '@/lib/data';
import { UniversityOption } from '@/lib/types';

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function findUniversityBySlug(slug: string): UniversityOption | null {
  return UNIVERSITY_OPTIONS.find((option) => slugify(option.name) === slug) ?? null;
}

export function findCourseBySlug(university: UniversityOption, courseSlug: string): string | null {
  return university.courses.find((course) => slugify(course) === courseSlug) ?? null;
}

export function universityHref(universityName: string): string {
  return `/question-papers/${slugify(universityName)}`;
}

export function courseHref(universityName: string, courseName: string): string {
  return `${universityHref(universityName)}/${slugify(courseName)}`;
}

export function courseSubjectHref(universityName: string, courseName: string, subjectName: string): string {
  return `${courseHref(universityName, courseName)}/${slugify(subjectName)}`;
}

export function findBsebSubjectBySlug(subjectSlug: string): string | null {
  return BSEB_10TH_SUBJECTS.find((subject) => slugify(subject) === subjectSlug) ?? null;
}

// Landing page of a test: /test-series/<series>/<title-slug>-<id>. The id at the end is what identifies
// the test, so a renamed test keeps working and the old URL redirects to the new slug.
export function testSlug(test: { id: number; title: string }): string {
  return `${slugify(test.title).slice(0, 80).replace(/-+$/, '')}-${test.id}`;
}

export function testHref(test: { id: number; title: string }, seriesSlug: string): string {
  return `/test-series/${seriesSlug}/${testSlug(test)}`;
}

export function parseTestIdFromSlug(param: string): number | null {
  const match = /(\d+)$/.exec(param);
  const id = match ? Number(match[1]) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function competitiveExamHref(examName: string): string {
  return `/competitive-exams/${slugify(examName)}`;
}
