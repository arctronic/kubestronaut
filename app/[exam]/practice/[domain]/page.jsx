import { Drill } from '@/components/Quiz';
import { availableExamIds, examSummary, getExam, questionBank } from '@/lib/content';

export const dynamicParams = false;
export function generateStaticParams() { return availableExamIds().flatMap((exam) => getExam(exam).domains.map((d) => ({ exam, domain: d.id }))); }
export async function generateMetadata({ params }) {
  const { exam, domain } = await params;
  const e = getExam(exam), d = e.domains.find((x) => x.id === domain);
  return { title: `${d.name} practice questions (${e.short})`, description: `Practise the ${d.name} domain (${d.weight}% of the ${e.short} exam) with explained questions linked to official sources.`, alternates: { canonical: `/${exam}/practice/${domain}/` } };
}
export default async function Page({ params }) {
  const { exam, domain } = await params;
  const e = examSummary(exam), d = e.domains.find((x) => x.id === domain);
  return <Drill e={e} title={'Domain drill: ' + d.name} pool={questionBank(exam).filter((q) => q.domain === domain)} mode="domain" />;
}
