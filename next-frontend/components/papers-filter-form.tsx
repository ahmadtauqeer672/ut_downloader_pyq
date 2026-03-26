'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { BSEB_10TH_SUBJECTS, BTECH_DEPARTMENTS, SEMESTERS } from '@/lib/data';
import { courseHref, universityHref } from '@/lib/slug';
import { UniversityOption } from '@/lib/types';

interface PapersFilterFormProps {
  universities: UniversityOption[];
  initialUniversity: string;
  initialCourse: string;
  initialDepartment: string;
  initialSemester: string;
  initialSubject: string;
}

function isBtech(course: string): boolean {
  return course.trim().toUpperCase() === 'BTECH';
}

function isBsebClass(university: string, course: string): boolean {
  return university.trim().toUpperCase() === 'BIHAR BOARD (BSEB)' && course.trim().toUpperCase() === '10TH';
}

export function PapersFilterForm({
  universities,
  initialUniversity,
  initialCourse,
  initialDepartment,
  initialSemester,
  initialSubject
}: PapersFilterFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedUniversity, setSelectedUniversity] = useState(initialUniversity);
  const [selectedCourse, setSelectedCourse] = useState(initialCourse);
  const [selectedDepartment, setSelectedDepartment] = useState(initialDepartment);
  const [selectedSemester, setSelectedSemester] = useState(initialSemester);
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);

  const courseOptions = useMemo(
    () => universities.find((option) => option.name === selectedUniversity)?.courses ?? [],
    [selectedUniversity, universities]
  );
  const showBtechFilters = isBtech(selectedCourse);
  const showBsebSubjectFilter = isBsebClass(selectedUniversity, selectedCourse);
  const courseLabel = selectedUniversity.trim().toUpperCase() === 'BIHAR BOARD (BSEB)' ? 'Class' : 'Course route';

  return (
    <form
      className="filter-card"
      onSubmit={(event) => {
        event.preventDefault();

        const params = new URLSearchParams();
        params.set('applied', '1');
        if (showBtechFilters && selectedDepartment) params.set('department', selectedDepartment);
        if (showBtechFilters && selectedSemester) params.set('semester', selectedSemester);
        if (showBsebSubjectFilter && selectedSubject) params.set('subject', selectedSubject);

        const route = selectedCourse ? courseHref(selectedUniversity, selectedCourse) : universityHref(selectedUniversity);
        const href = params.toString() ? `${route}?${params.toString()}` : route;

        startTransition(() => {
          router.push(href, { scroll: false });
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

              if (!isBsebClass(university, nextCourse)) {
                setSelectedSubject('');
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
          <span>{courseLabel}</span>
          <select
            value={selectedCourse}
            onChange={(event) => {
              const course = event.target.value;
              setSelectedCourse(course);

              if (!isBtech(course)) {
                setSelectedDepartment('');
                setSelectedSemester('');
              }

              if (!isBsebClass(selectedUniversity, course)) {
                setSelectedSubject('');
              }
            }}
          >
            <option value="">{selectedUniversity.trim().toUpperCase() === 'BIHAR BOARD (BSEB)' ? 'All classes' : 'All courses'}</option>
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

        <label className="filter-field">
          <span>Subject</span>
          <select
            value={selectedSubject}
            onChange={(event) => setSelectedSubject(event.target.value)}
            disabled={!showBsebSubjectFilter}
          >
            <option value="">All subjects</option>
            {BSEB_10TH_SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
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
        Choose a university route, then apply department and semester filters for BTECH or a subject filter for BSEB 10th papers.
      </p>
    </form>
  );
}
