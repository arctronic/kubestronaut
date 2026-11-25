import MockExam from '@/components/Mock';
import { availableExamIds, examSummary, getExam, questionBank } from '@/lib/content';

export const dynamicParams = false;
export function generateStaticParams() {
  return availableExamIds().flatMap((exam) => Array.from({ length: getExam(exam).mock.sets }, (_, i) => String(i + 1)).concat('random').map((key) => ({ exam, key })));
}
export async function generateMetadata({ params }) {
  const { exam, key } = await params;
  const e = getExam(exam);
  const name = key === 'random' ? 'random mock exam' : `mock exam ${key}`;
  const title = `${e.short} ${name}: ${e.mock.questions} questions, ${e.mock.minutes} minutes`;
  const description = `Free timed ${e.short} practice exam: ${e.mock.questions} questions in ${e.mock.minutes} minutes, weighted like the official blueprint, with a score per domain and explanations for every answer.`;
  return { title, description, alternates: { canonical: `/${exam}/mock/${key}/` }, openGraph: { title, description, url: `/${exam}/mock/${key}/` } };
}
export default async function Page({ params }) {
  const { exam, key } = await params;
  return <MockExam e={examSummary(exam)} bank={questionBank(exam)} mkey={key} />;
}
