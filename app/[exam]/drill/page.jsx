import { Drill } from '@/components/Quiz';
import { examSummary, questionBank } from '@/lib/content';

export const metadata = { title: 'Weak-area drill', robots: { index: false } };
export default async function Page({ params }) {
  const { exam } = await params;
  return <Drill e={examSummary(exam)} title="Weak-area drill" pool={questionBank(exam)} mode="weak" />;
}
