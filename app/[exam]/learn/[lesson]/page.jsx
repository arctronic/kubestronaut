import LessonDeck from '@/components/LessonDeck';
import { availableExamIds, examSummary, getChapter, getExam, stripHtml } from '@/lib/content';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export const dynamicParams = false;
export function generateStaticParams() {
  return availableExamIds().flatMap((exam) => getExam(exam).chapterList.map((c) => ({ exam, lesson: c.id })));
}
export async function generateMetadata({ params }) {
  const { exam, lesson } = await params;
  const e = getExam(exam), c = getChapter(exam, lesson);
  const title = `${c.title}: ${e.short} lesson ${c.num}`;
  const description = `${stripHtml(c.subtitle)}. Interactive ${e.short} lesson with diagrams, examples and exam tips: ${(c.objectives || []).map(stripHtml).join('; ')}.`.slice(0, 300);
  return { title, description, alternates: { canonical: `/${exam}/learn/${lesson}/` }, openGraph: { type: 'article', title, description, url: `/${exam}/learn/${lesson}/` } };
}
export default async function Page({ params }) {
  const { exam, lesson } = await params;
  const e = examSummary(exam), c = getChapter(exam, lesson);
  const ch = { id: c.id, num: c.num, title: c.title, subtitle: c.subtitle, icon: c.icon, domain: c.domain, minutes: c.minutes, objectives: c.objectives, slides: c.slides, summary: c.summary, quiz: c.quiz };
  const ld = {
    '@context': 'https://schema.org', '@type': 'LearningResource', name: c.title, description: stripHtml(c.subtitle),
    url: `${SITE_URL}/${exam}/learn/${lesson}/`, learningResourceType: 'Lesson', educationalLevel: 'Beginner', isAccessibleForFree: true, inLanguage: 'en',
    teaches: (c.objectives || []).map(stripHtml), isPartOf: { '@type': 'Course', name: `${e.title} (${e.short})`, url: `${SITE_URL}/${exam}/` },
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  };
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} /><LessonDeck e={e} ch={ch} /></>);
}
