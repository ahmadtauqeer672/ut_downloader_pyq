import { UNIVERSITY_OPTIONS } from '@/lib/data';
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
