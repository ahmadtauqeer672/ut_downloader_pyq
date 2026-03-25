import { notFound } from 'next/navigation';
import { PapersView } from '@/components/papers-view';
import { getCompetitiveSummary, listCompetitivePapers, listPapers } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import { findCourseBySlug, findUniversityBySlug } from '@/lib/slug';

interface CoursePageProps {
  params: Promise<{ university: string; course: string }>;
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

export default async function CoursePage({ params }: CoursePageProps) {
  const { university: universitySlug, course: courseSlug } = await params;
  const university = findUniversityBySlug(universitySlug);

  if (!university) {
    notFound();
  }

  const course = findCourseBySlug(university, courseSlug);
  if (!course) {
    notFound();
  }

  const [papers, competitiveSummary, competitivePapers] = await Promise.all([
    listPapers({ university: university.name, course, limit: 80 }),
    getCompetitiveSummary(),
    listCompetitivePapers('UPSC').catch(() => [])
  ]);

  return (
    <PapersView
      heading={`${university.name} ${course} Question Papers`}
      description={`Browse ${university.name} ${course} previous year papers and open semester-wise downloads faster on UTpaper.`}
      university={university}
      course={course}
      papers={papers}
      competitiveSummary={competitiveSummary}
      competitivePapers={competitivePapers}
    />
  );
}
