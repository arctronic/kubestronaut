import { Results } from '@/components/Mock';
import { examSummary, questionBank } from '@/lib/content';

export const metadata = { title: 'Mock exam results', robots: { index: false } };
export default async function Page({ params }) {
  const { exam } = await params;
  return <Results e={examSummary(exam)} bank={questionBank(exam)} />;
}
