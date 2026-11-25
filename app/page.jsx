import Shell from '@/components/Shell';
import Dashboard from '@/components/Dashboard';
import { availableExamIds, examMetas, examSummary } from '@/lib/content';
import { SITE_DESC, SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata = { alternates: { canonical: '/' } };

export default function Home() {
  const metas = examMetas();
  const exams = availableExamIds().map(examSummary);
  const ld = {
    '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: SITE_URL, description: SITE_DESC,
  };
  return (
    <Shell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Dashboard metas={metas} exams={exams} />
    </Shell>
  );
}
