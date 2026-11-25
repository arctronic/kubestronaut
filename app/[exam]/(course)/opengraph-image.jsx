import { availableExamIds, getExam } from '@/lib/content';
import { OG_SIZE, ogImage } from '@/lib/og';

export const dynamic = 'force-static';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Course overview';
export function generateStaticParams() { return availableExamIds().map((exam) => ({ exam })); }
export default async function Image({ params }) {
  const { exam } = await params;
  const e = getExam(exam);
  const q = e.chapterList.reduce((a, c) => a + (c.quiz || []).length, 0) + e.mockBank.length;
  return ogImage({ eyebrow: `${e.short} course`, title: e.title, subtitle: `${e.chapterList.length} lessons · ${q} practice questions · ${e.mock.sets} timed mock exams` });
}
