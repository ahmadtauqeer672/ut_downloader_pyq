import { notFound } from 'next/navigation';
import { PapersView } from '@/components/papers-view';
import { getCompetitiveSummary, listCompetitivePapers, listPapers } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import { findUniversityBySlug } from '@/lib/slug';

interface UniversityPageProps {
  params: Promise<{ university: string }>;
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

export async function generateMetadata({ params }: UniversityPageProps) {
  const { university: universitySlug } = await params;
  const university = findUniversityBySlug(universitySlug);

  if (!university) {
    return buildMetadata({
      title: 'Question Papers | UTpaper',
      description: 'Browse university question papers on UTpaper.'
    });
  }

  const courses = university.courses.join(', ');
  return buildMetadata({
    title: `${university.name} Previous Year Question Papers – ${courses} | UTpaper`,
    description: `Download free ${university.name} previous year question papers for ${courses}, semester-wise and subject-wise as PDF. Old question papers of all courses in one place on UTpaper.`,
    path: `/question-papers/${universitySlug}`,
    keywords: [
      `${university.name} question papers`,
      `${university.name} previous year question paper`,
      `${university.name} old question papers`,
      ...university.courses.map((course) => `${university.name} ${course} question paper`),
      'UTpaper'
    ]
  });
}

export default async function UniversityPage({ params, searchParams }: UniversityPageProps) {
  const { university: universitySlug } = await params;
  const filters = searchParams ? await searchParams : {};
  const university = findUniversityBySlug(universitySlug);
  const department = readSearchValue(filters.department);
  const semester = readSearchValue(filters.semester);
  const subject = readSearchValue(filters.subject);
  // Always render the paper list on the server so searchers (and Google) see the papers at once.
  const showAcademicPapers = true;

  if (!university) {
    notFound();
  }

  const [papers, competitiveSummary, competitivePapers] = await Promise.all([
    listPapers({ university: university.name, department, semester, subject, limit: 200 }),
    getCompetitiveSummary(),
    listCompetitivePapers('UPSC').catch(() => [])
  ]);

  return (
    <PapersView
      heading={`${university.name} Previous Year Question Papers`}
      description={`Free ${university.name} old question papers for ${university.courses.join(', ')}. Pick a course to open its papers semester-wise, or browse everything below.`}
      university={university}
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
