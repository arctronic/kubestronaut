import { ChapterQuiz } from '@/components/Quiz';
import { availableExamIds, examSummary, getChapter, getExam } from '@/lib/content';

export const dynamicParams = false;
export function generateStaticParams() {
  return availableExamIds().flatMap((exam) => getExam(exam).chapterList.map((c) => ({ exam, lesson: c.id })));
}
export async function generateMetadata({ params }) {
  const { exam, lesson } = await params;
  const e = getExam(exam), c = getChapter(exam, lesson);
  const title = `${c.title} practice questions (${e.short})`;
  const description = `${(c.quiz || []).length} free ${e.short} practice questions on ${c.title}, each with a full explanation and a link to the official documentation.`;
  return { title, description, alternates: { canonical: `/${exam}/quiz/${lesson}/` }, openGraph: { title, description, url: `/${exam}/quiz/${lesson}/` } };
}
export default async function Page({ params }) {
  const { exam, lesson } = await params;
  const c = getChapter(exam, lesson);
  const e = examSummary(exam);
  return <ChapterQuiz e={e} ch={e.chapters.find((x) => x.id === lesson)} questions={c.quiz || []} />;
}
