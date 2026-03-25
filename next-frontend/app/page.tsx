import { JsonLdScript } from '@/components/json-ld-script';
import { PapersView } from '@/components/papers-view';
import { getCompetitiveSummary, listCompetitivePapers, listPapers } from '@/lib/api';
import { buildMetadata, organizationJsonLd } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'PTU Question Papers, Previous Year Papers and Competitive Exam PYQs | UTpaper',
  description:
    'Browse PTU and other university previous year question papers semester-wise. Download BTECH, BCA, BBA, MBA, MCA and competitive exam PYQs on UTpaper.',
  keywords: [
    'PTU question papers',
    'previous year papers',
    'BTECH papers',
    'university PYQ',
    'competitive exam papers'
  ]
});

export default async function HomePage() {
  const [papers, competitiveSummary, competitivePapers] = await Promise.all([
    listPapers({ university: 'PTU', limit: 60 }),
    getCompetitiveSummary(),
    listCompetitivePapers('UPSC').catch(() => [])
  ]);

  return (
    <>
      <JsonLdScript payload={organizationJsonLd()} />
      <PapersView
        heading="Previous Year Papers and Competitive Exam PYQs"
        description="Download PTU, PU Chandigarh, GNDU, MDU and GTU question papers in one place. Browse BTECH, BCA, BBA, MBA, MCA and competitive exam papers semester-wise or year-wise on UTpaper."
        papers={papers}
        competitiveSummary={competitiveSummary}
        competitivePapers={competitivePapers}
      />
    </>
  );
}
