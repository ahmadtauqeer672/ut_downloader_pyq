import { notFound } from 'next/navigation';
import { PapersView } from '@/components/papers-view';
import { getCompetitiveSummary, listCompetitivePapers, listPapers } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import { findBsebSubjectBySlug, findCourseBySlug, findUniversityBySlug } from '@/lib/slug';

interface SubjectPageProps {
  params: Promise<{ university: string; course: string; subject: string }>;
}

async function resolveSubjectRoute(params: SubjectPageProps['params']) {
  const { university: universitySlug, course: courseSlug, subject: subjectSlug } = await params;
  const university = findUniversityBySlug(universitySlug);
  const course = university ? findCourseBySlug(university, courseSlug) : null;
  const subject = findBsebSubjectBySlug(subjectSlug);

  if (!university || !course || !subject) {
    return null;
  }

  if (university.name !== 'BIHAR BOARD (BSEB)' || course !== '10TH') {
    return null;
  }

  return { university, course, subject, universitySlug, courseSlug, subjectSlug };
}

export async function generateMetadata({ params }: SubjectPageProps) {
  const route = await resolveSubjectRoute(params);

  if (!route) {
    return buildMetadata({
      title: 'Subject Question Papers | UTpaper',
      description: 'Browse subject-wise previous year papers on UTpaper.'
    });
  }

  const { subject, universitySlug, courseSlug, subjectSlug } = route;

  return buildMetadata({
    title: `${subject} Previous Year Question Papers | Bihar Board 10th | UTpaper`,
    description: `Browse Bihar Board 10th ${subject} previous year question papers year-wise on UTpaper and download BSEB Class 10 subject papers faster.`,
    path: `/question-papers/${universitySlug}/${courseSlug}/${subjectSlug}`,
    keywords: [
      `${subject} previous year papers`,
      `Bihar Board 10th ${subject} papers`,
      'BSEB Class 10 subject wise papers',
      'UTpaper'
    ]
  });
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const route = await resolveSubjectRoute(params);

  if (!route) {
    notFound();
  }

  const { university, course, subject } = route;

  const [papers, competitiveSummary, competitivePapers] = await Promise.all([
    listPapers({ university: university.name, course, subject, limit: 80 }),
    getCompetitiveSummary(),
    listCompetitivePapers('UPSC').catch(() => [])
  ]);

  return (
    <PapersView
      heading={`${subject} Previous Year Question Papers`}
      description={`Browse Bihar Board 10th ${subject} previous year question papers year-wise and open the exact BSEB subject paper route faster on UTpaper.`}
      university={university}
      course={course}
      subject={subject}
      papers={papers}
      showAcademicPapers
      competitiveSummary={competitiveSummary}
      competitivePapers={competitivePapers}
    />
  );
}
