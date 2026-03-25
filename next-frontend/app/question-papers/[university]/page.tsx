import { notFound } from 'next/navigation';
import { PapersView } from '@/components/papers-view';
import { getCompetitiveSummary, listCompetitivePapers, listPapers } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import { findUniversityBySlug } from '@/lib/slug';

interface UniversityPageProps {
  params: Promise<{ university: string }>;
  searchParams?: Promise<{ department?: string | string[]; semester?: string | string[] }>;
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

  return buildMetadata({
    title: `${university.name} Question Papers All Courses | UTpaper`,
    description: `Browse ${university.name} question papers for all available courses on UTpaper. Download previous year papers with crawlable course URLs.`,
    path: `/question-papers/${universitySlug}`,
    keywords: [`${university.name} question papers`, `${university.name} previous year papers`, 'UTpaper']
  });
}

export default async function UniversityPage({ params, searchParams }: UniversityPageProps) {
  const { university: universitySlug } = await params;
  const filters = searchParams ? await searchParams : {};
  const university = findUniversityBySlug(universitySlug);
  const department = readSearchValue(filters.department);
  const semester = readSearchValue(filters.semester);

  if (!university) {
    notFound();
  }

  const [papers, competitiveSummary, competitivePapers] = await Promise.all([
    listPapers({ university: university.name, department, semester, limit: 80 }),
    getCompetitiveSummary(),
    listCompetitivePapers('UPSC').catch(() => [])
  ]);

  return (
    <PapersView
      heading={`${university.name} Question Papers All Courses`}
      description={`Browse ${university.name} previous year papers across all available courses. Use the clean route to open semester-wise and course-wise paper collections faster.`}
      university={university}
      department={department}
      semester={semester}
      papers={papers}
      competitiveSummary={competitiveSummary}
      competitivePapers={competitivePapers}
    />
  );
}
