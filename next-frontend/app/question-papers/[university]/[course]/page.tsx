import { notFound } from 'next/navigation';
import { PapersView } from '@/components/papers-view';
import { getCompetitiveSummary, listCompetitivePapers, listPapers } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import { findCourseBySlug, findUniversityBySlug } from '@/lib/slug';

interface CoursePageProps {
  params: Promise<{ university: string; course: string }>;
  searchParams?: Promise<{
    department?: string | string[];
    semester?: string | string[];
    subject?: string | string[];
    applied?: string | string[];
  }>;
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

  if (university.name === 'BIHAR BOARD (BSEB)' && course === '10TH') {
    return buildMetadata({
      title: 'Bihar Board 10th Question Papers | BSEB Class 10 Previous Year Papers | UTpaper',
      description:
        'Download Bihar Board 10th previous year question papers by subject. Browse BSEB Class 10 papers for Hindi MT, Hindi SIL, Urdu, Mathematics, Science, Social Science and Sanskrit on UTpaper.',
      path: `/question-papers/${universitySlug}/${courseSlug}`,
      keywords: [
        'Bihar Board 10th question papers',
        'BSEB Class 10 previous year papers',
        'Bihar Board 10th papers',
        'BSEB 10th subject wise papers',
        'UTpaper'
      ]
    });
  }

  // A course with no papers yet is thin content: keep it out of the index until papers are added.
  const papers = await listPapers({ university: university.name, course, limit: 1 }).catch(() => []);
  return buildMetadata({
    noIndex: papers.length === 0,
    title: `${university.name} ${course} Previous Year Question Papers (All Semesters) | UTpaper`,
    description: `Download free ${university.name} ${course} previous year question papers semester-wise and subject-wise. Old question papers of all semesters as PDF, no sign-up needed, on UTpaper.`,
    path: `/question-papers/${universitySlug}/${courseSlug}`,
    keywords: [
      `${university.name} ${course} question paper`,
      `${university.name} ${course} previous year question paper`,
      `${university.name} old question papers ${course}`,
      `${university.name} ${course} question papers all semesters`,
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
  const subject = readSearchValue(filters.subject);
  // The paper list is always rendered on the server so searchers (and Google) see the papers at once;
  // the filters only narrow it down.
  const showAcademicPapers = true;

  if (!university) {
    notFound();
  }

  const course = findCourseBySlug(university, courseSlug);
  if (!course) {
    notFound();
  }

  const [papers, competitiveSummary, competitivePapers] = await Promise.all([
    listPapers({ university: university.name, course, department, semester, subject, limit: 200 }),
    getCompetitiveSummary(),
    listCompetitivePapers('UPSC').catch(() => [])
  ]);

  return (
    <PapersView
      heading={
        university.name === 'BIHAR BOARD (BSEB)' && course === '10TH'
          ? 'Bihar Board 10th Question Papers'
          : `${university.name} ${course} Previous Year Question Papers`
      }
      description={
        university.name === 'BIHAR BOARD (BSEB)' && course === '10TH'
          ? 'Browse BSEB Class 10 previous year question papers subject-wise and download Bihar Board 10th papers faster on UTpaper.'
          : `Free ${university.name} ${course} old question papers of all semesters, subject-wise. Open any paper as a PDF or narrow the list by semester.`
      }
      university={university}
      course={course}
      department={department}
      semester={semester}
      subject={subject}
      papers={papers}
      showAcademicPapers={showAcademicPapers}
      competitiveSummary={competitiveSummary}
      competitivePapers={competitivePapers}
    />
  );
}
