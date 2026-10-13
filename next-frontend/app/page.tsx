import { JsonLdScript } from '@/components/json-ld-script';
import { TestSeriesBrowser } from '@/components/test-series-browser';
import { listTestSeries } from '@/lib/api';
import { buildMetadata, organizationJsonLd } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Free Online Test Series and Mock Tests for Govt. Exams | UTpaper',
  description:
    'Attempt free online mock test series for SSC, Railway, BPSC, State and other Govt. exams. Instant score, all-India rank and detailed solutions on UTpaper.',
  keywords: ['free mock test', 'online test series', 'govt exam mock test', 'SSC mock test', 'BPSC TRE mock test', 'UTpaper']
});

export default async function HomePage() {
  const seriesList = await listTestSeries();

  return (
    <>
      <JsonLdScript payload={organizationJsonLd()} />
      <TestSeriesBrowser seriesList={seriesList} heading="Online Test Series" />
    </>
  );
}
