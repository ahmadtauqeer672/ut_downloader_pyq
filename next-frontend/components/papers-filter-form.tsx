'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { BTECH_DEPARTMENTS, SEMESTERS } from '@/lib/data';
import { courseHref, universityHref } from '@/lib/slug';
import { UniversityOption } from '@/lib/types';

interface PapersFilterFormProps {
  universities: UniversityOption[];
  initialUniversity: string;
  initialCourse: string;
  initialDepartment: string;
  initialSemester: string;
}

function isBtech(course: string): boolean {
  return course.trim().toUpperCase() === 'BTECH';
}

export function PapersFilterForm({
  universities,
  initialUniversity,
  initialCourse,
  initialDepartment,
  initialSemester
}: PapersFilterFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedUniversity, setSelectedUniversity] = useState(initialUniversity);
  const [selectedCourse, setSelectedCourse] = useState(initialCourse);
  const [selectedDepartment, setSelectedDepartment] = useState(initialDepartment);
  const [selectedSemester, setSelectedSemester] = useState(initialSemester);

  const courseOptions = useMemo(
    () => universities.find((option) => option.name === selectedUniversity)?.courses ?? [],
    [selectedUniversity, universities]
  );
  const showBtechFilters = isBtech(selectedCourse);

  return (
    <form
      className="filter-card"
      onSubmit={(event) => {
        event.preventDefault();

        const params = new URLSearchParams();
        if (showBtechFilters && selectedDepartment) params.set('department', selectedDepartment);
        if (showBtechFilters && selectedSemester) params.set('semester', selectedSemester);

        const route = selectedCourse ? courseHref(selectedUniversity, selectedCourse) : universityHref(selectedUniversity);
        const href = params.toString() ? `${route}?${params.toString()}` : route;

        startTransition(() => {
          router.push(href);
        });
      }}
    >
      <div className="filter-card__grid">
        <label className="filter-field">
          <span>University route</span>
          <select
            value={selectedUniversity}
            onChange={(event) => {
              const university = event.target.value;
              const nextCourses = universities.find((option) => option.name === university)?.courses ?? [];
              const nextCourse = nextCourses.includes(selectedCourse) ? selectedCourse : '';

              setSelectedUniversity(university);
              setSelectedCourse(nextCourse);

              if (!isBtech(nextCourse)) {
                setSelectedDepartment('');
                setSelectedSemester('');
              }
            }}
          >
            {universities.map((option) => (
              <option key={option.name} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>Course route</span>
          <select
            value={selectedCourse}
            onChange={(event) => {
              const course = event.target.value;
              setSelectedCourse(course);

              if (!isBtech(course)) {
                setSelectedDepartment('');
                setSelectedSemester('');
              }
            }}
          >
            <option value="">All courses</option>
            {courseOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>BTECH departments</span>
          <select
            value={selectedDepartment}
            onChange={(event) => setSelectedDepartment(event.target.value)}
            disabled={!showBtechFilters}
          >
            <option value="">All departments</option>
            {BTECH_DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>Semesters</span>
          <select
            value={selectedSemester}
            onChange={(event) => setSelectedSemester(event.target.value)}
            disabled={!showBtechFilters}
          >
            <option value="">All semesters</option>
            {SEMESTERS.map((semester) => (
              <option key={semester} value={String(semester)}>
                Semester {semester}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="filter-card__actions">
        <button className="button button--primary" type="submit" disabled={isPending}>
          {isPending ? 'Applying...' : 'Apply Filters'}
        </button>
      </div>

      <p className="muted-copy">
        Choose a university or course route, then apply department or semester filters when browsing BTECH papers.
      </p>
    </form>
  );
}
