import { CourseMaterial } from '@/components/Course';
import JsonLd from '@/components/JsonLd';
import { examSummary, getExam } from '@/lib/content';
import { ORG, SITE_URL, breadcrumbLd, orgLd } from '@/lib/site';

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
  const course = {
    '@context': 'https://schema.org', '@type': 'Course', name: `${e.title} (${e.short}) exam preparation`,
    description: full.tagline ? full.tagline.replace(/<[^>]+>/g, '') : e.title, url: `${SITE_URL}/${exam}/`,
    provider: orgLd(), publisher: { '@id': `${ORG.url}/#org` }, isAccessibleForFree: true, inLanguage: 'en',
    educationalLevel: 'Beginner', teaches: e.domains.map((d) => d.name),
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD', category: 'Free' },
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', courseWorkload: 'PT10H' },
    syllabusSections: e.chapters.map((c) => ({ '@type': 'Syllabus', name: c.title, url: `${SITE_URL}/${exam}/learn/${c.id}/` })),
  };
  return (<><JsonLd data={[course, breadcrumbLd([['Home', '/'], [`${e.short} course`, `/${exam}/`]])]} /><CourseMaterial e={e} /></>);
}
