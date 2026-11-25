import { ChapterFlashcards } from '@/components/Flashcards';
import { availableExamIds, examSummary, getChapter, getExam } from '@/lib/content';

export const dynamicParams = false;
export function generateStaticParams() {
  return availableExamIds().flatMap((exam) => getExam(exam).chapterList.map((c) => ({ exam, lesson: c.id })));
}
export async function generateMetadata({ params }) {
  const { exam, lesson } = await params;
  const e = getExam(exam), c = getChapter(exam, lesson);
  return { title: `${c.title} flashcards (${e.short})`, description: `${(c.glossary || []).length} ${e.short} key terms for ${c.title}, as interactive flashcards.`, alternates: { canonical: `/${exam}/flashcards/${lesson}/` } };
}
export default async function Page({ params }) {
  const { exam, lesson } = await params;
  const c = getChapter(exam, lesson), e = examSummary(exam);
  const cards = (c.glossary || []).map((g) => ({ ...g, ch: `${c.num}. ${c.title}` }));
  return <ChapterFlashcards e={e} ch={e.chapters.find((x) => x.id === lesson)} cards={cards} />;
}
