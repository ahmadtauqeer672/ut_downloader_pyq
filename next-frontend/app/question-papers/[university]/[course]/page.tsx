import { notFound } from 'next/navigation';
import { PapersView } from '@/components/papers-view';
import { getCompetitiveSummary, listCompetitivePapers, listPapers } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import { findCourseBySlug, findUniversityBySlug } from '@/lib/slug';

interface CoursePageProps {
  params: Promise<{ university: string; course: string }>;
  searchParams?: Promise<{ department?: string | string[]; semester?: string | string[] }>;
}

function readSearchValue(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: CoursePageProps) {
  const { university: universitySlug, course: courseSlug } = await params;
  const university = findUniversityBySlug(universitySlug);
  const course = university ? findCourseBySlug(university, courseSlug) : null;

  if (!university || !course) {
    return buildMetadata({
      title: 'Question Papers | UTpaper',
      description: 'Browse course-wise question papers on UTpaper.'
    });
  }

  return buildMetadata({
    title: `${university.name} ${course} Question Papers | UTpaper`,
    description: `Browse ${university.name} ${course} previous year question papers on UTpaper. Open semester-wise papers and download PYQs with SEO-friendly route URLs.`,
    path: `/question-papers/${universitySlug}/${courseSlug}`,
    keywords: [
      `${university.name} ${course} papers`,
      `${university.name} ${course} previous year papers`,
      'UTpaper'
    ]
  });
}

export default async function CoursePage({ params, searchParams }: CoursePageProps) {
  const { university: universitySlug, course: courseSlug } = await params;
  const filters = searchParams ? await searchParams : {};
  const university = findUniversityBySlug(universitySlug);
  const department = readSearchValue(filters.department);
  const semester = readSearchValue(filters.semester);

  if (!university) {
    notFound();
  }

  const course = findCourseBySlug(university, courseSlug);
  if (!course) {
    notFound();
  }

  const [papers, competitiveSummary, competitivePapers] = await Promise.all([
    listPapers({ university: university.name, course, department, semester, limit: 80 }),
    getCompetitiveSummary(),
    listCompetitivePapers('UPSC').catch(() => [])
  ]);

  return (
    <PapersView
      heading={`${university.name} ${course} Question Papers`}
      description={`Browse ${university.name} ${course} previous year papers and open semester-wise downloads faster on UTpaper.`}
      university={university}
      course={course}
      department={department}
      semester={semester}
      papers={papers}
      competitiveSummary={competitiveSummary}
      competitivePapers={competitivePapers}
    />
  );
}
