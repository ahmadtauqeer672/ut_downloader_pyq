import { notFound } from 'next/navigation';
import { JsonLdScript } from '@/components/json-ld-script';
import { PapersView } from '@/components/papers-view';
import { getCompetitiveSummary, listCompetitivePapers, listPapers } from '@/lib/api';
import { faqJsonLd, buildMetadata } from '@/lib/seo';
import { findUniversityBySlug } from '@/lib/slug';

interface UniversityPageProps {
  params: Promise<{ university: string }>;
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

export default async function UniversityPage({ params }: UniversityPageProps) {
  const { university: universitySlug } = await params;
  const university = findUniversityBySlug(universitySlug);

  if (!university) {
    notFound();
  }

  const [papers, competitiveSummary, competitivePapers] = await Promise.all([
    listPapers({ university: university.name, limit: 80 }),
    getCompetitiveSummary(),
    listCompetitivePapers('UPSC').catch(() => [])
  ]);

  return (
    <>
      <JsonLdScript payload={faqJsonLd()} />
      <PapersView
        heading={`${university.name} Question Papers All Courses`}
        description={`Browse ${university.name} previous year papers across all available courses. Use the clean route to open semester-wise and course-wise paper collections faster.`}
        university={university}
        papers={papers}
        competitiveSummary={competitiveSummary}
        competitivePapers={competitivePapers}
      />
    </>
  );
}
