import { ChapterQuiz } from '@/components/Quiz';
import JsonLd from '@/components/JsonLd';
import { availableExamIds, examSummary, getChapter, getExam, stripHtml } from '@/lib/content';
import { SITE_URL, breadcrumbLd, orgLd } from '@/lib/site';

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
  const answers = (q) => (Array.isArray(q.answer) ? q.answer : [q.answer]);
  const quiz = {
    '@context': 'https://schema.org', '@type': 'Quiz', name: `${c.title}: ${e.short} practice questions`, url: `${SITE_URL}/${exam}/quiz/${lesson}/`,
    about: { '@type': 'Thing', name: c.title }, educationalLevel: 'Beginner', isAccessibleForFree: true, inLanguage: 'en', provider: orgLd(),
    hasPart: (c.quiz || []).map((q) => ({
      '@type': 'Question', eduQuestionType: Array.isArray(q.answer) ? 'Checkbox' : 'Multiple choice', text: stripHtml(q.q),
      suggestedAnswer: q.options.map((o, i) => ({ o, i })).filter((x) => !answers(q).includes(x.i)).map((x) => ({ '@type': 'Answer', text: stripHtml(x.o) })),
      acceptedAnswer: answers(q).map((i) => ({ '@type': 'Answer', text: stripHtml(q.options[i]), answerExplanation: { '@type': 'Comment', text: stripHtml(q.explain) } })),
    })),
  };
  const crumbs = breadcrumbLd([['Home', '/'], [`${e.short} course`, `/${exam}/`], [`${c.title} quiz`, `/${exam}/quiz/${lesson}/`]]);
  return (<><JsonLd data={[quiz, crumbs]} /><ChapterQuiz e={e} ch={e.chapters.find((x) => x.id === lesson)} questions={c.quiz || []} /></>);
}
