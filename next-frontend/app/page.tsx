import { HomeSeoContent } from '@/components/home-seo-content';
import { TestSeriesBrowser } from '@/components/test-series-browser';
import { listTestSeries } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Free Online Test Series and Mock Tests for Govt. Exams | UTpaper',
  description:
    'Attempt free online mock test series for BPSC TRE, DSSSB, RRB, STET and other Govt. exams. Real exam pattern, instant score, all-India rank and detailed solutions on UTpaper.',
  keywords: [
    'free mock test',
    'online test series',
    'govt exam mock test',
    'BPSC TRE mock test',
    'DSSSB mock test',
    'RRB JE mock test',
    'previous year paper online test',
    'UTpaper'
  ]
});

export default async function HomePage() {
  const seriesList = await listTestSeries();

  return (
    <>
      <TestSeriesBrowser seriesList={seriesList} heading="Online Test Series" />
      <HomeSeoContent seriesList={seriesList} />
    </>
  );
}
