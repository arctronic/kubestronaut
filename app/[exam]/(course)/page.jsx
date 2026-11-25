import { CourseMaterial } from '@/components/Course';
import { examSummary, getExam } from '@/lib/content';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export async function generateMetadata({ params }) {
  const { exam } = await params;
  const e = getExam(exam);
  const title = `${e.short} course: ${e.title} exam prep`;
  const description = `Free ${e.short} course: ${e.chapterList.length} visual lessons mapped to the official CNCF curriculum, ${e.chapterList.reduce((a, c) => a + (c.quiz || []).length, 0) + e.mockBank.length} practice questions with sources, and timed ${e.mock.questions}-question mock exams.`;
  return { title, description, alternates: { canonical: `/${exam}/` }, openGraph: { title, description, url: `/${exam}/` } };
}

export default async function Page({ params }) {
  const { exam } = await params;
  const e = examSummary(exam);
  const full = getExam(exam);
  const ld = {
    '@context': 'https://schema.org', '@type': 'Course', name: `${e.title} (${e.short}) exam preparation`,
    description: full.tagline ? full.tagline.replace(/<[^>]+>/g, '') : e.title, url: `${SITE_URL}/${exam}/`,
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL }, isAccessibleForFree: true, inLanguage: 'en',
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', courseWorkload: 'PT10H' },
    syllabusSections: e.chapters.map((c) => ({ '@type': 'Syllabus', name: c.title, url: `${SITE_URL}/${exam}/learn/${c.id}/` })),
  };
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} /><CourseMaterial e={e} /></>);
}
