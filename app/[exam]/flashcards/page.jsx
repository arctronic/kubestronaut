import { AllFlashcards } from '@/components/Flashcards';
import { examSummary, getExam } from '@/lib/content';

export async function generateMetadata({ params }) {
  const { exam } = await params;
  const e = getExam(exam);
  return { title: `${e.short} flashcards: every key term`, description: `All ${e.chapterList.reduce((a, c) => a + (c.glossary || []).length, 0)} ${e.short} key terms as interactive flashcards.`, alternates: { canonical: `/${exam}/flashcards/` } };
}
export default async function Page({ params }) {
  const { exam } = await params;
  const cards = getExam(exam).chapterList.flatMap((c) => (c.glossary || []).map((g) => ({ ...g, ch: `${c.num}. ${c.title}` })));
  return <AllFlashcards e={examSummary(exam)} cards={cards} />;
}
