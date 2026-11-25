import { availableExamIds, getChapter, getExam } from '@/lib/content';
import { OG_SIZE, ogImage } from '@/lib/og';

export const dynamic = 'force-static';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Practice questions';
export function generateStaticParams() {
  return availableExamIds().flatMap((exam) => getExam(exam).chapterList.map((c) => ({ exam, lesson: c.id })));
}
export default async function Image({ params }) {
  const { exam, lesson } = await params;
  const e = getExam(exam), c = getChapter(exam, lesson);
  return ogImage({ eyebrow: `${e.short} practice questions`, title: c.title, subtitle: `${(c.quiz || []).length} questions, each explained and linked to the official docs` });
}
