import { JsonLdScript } from '@/components/json-ld-script';
import { PapersView } from '@/components/papers-view';
import { getCompetitiveSummary } from '@/lib/api';
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
  const competitiveSummary = await getCompetitiveSummary();

  return (
    <>
      <JsonLdScript payload={organizationJsonLd()} />
      <PapersView
        heading="Previous Year Papers and Competitive PYQs"
        description="Download PTU BTECH, BCA, BBA, MBA and MCA question papers semester-wise, Bihar Board Class 10 papers subject-wise, and competitive exam papers year-wise. All free on UTpaper."
        papers={[]}
        showPaperList={false}
        competitiveSummary={competitiveSummary}
      />
    </>
  );
}
