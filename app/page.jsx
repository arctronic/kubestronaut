import Shell from '@/components/Shell';
import Dashboard from '@/components/Dashboard';
import { availableExamIds, examMetas, examSummary } from '@/lib/content';

export const metadata = { alternates: { canonical: '/' } };

export default function Home() {
  return (
    <Shell>
      <h1 className="sr-only">Kubestronaut Academy: free KCNA and Kubestronaut certification prep</h1>
      <Dashboard metas={examMetas()} exams={availableExamIds().map(examSummary)} />
    </Shell>
  );
}
