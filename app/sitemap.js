import { availableExamIds, getExam } from '@/lib/content';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';
export default function sitemap() {
  const now = new Date();
  const urls = [{ url: `${SITE_URL}/`, priority: 1 }];
  for (const id of availableExamIds()) {
    const e = getExam(id);
    urls.push({ url: `${SITE_URL}/${id}/`, priority: 0.9 }, { url: `${SITE_URL}/${id}/guide/`, priority: 0.8 }, { url: `${SITE_URL}/${id}/cheatsheet/`, priority: 0.7 }, { url: `${SITE_URL}/${id}/resources/`, priority: 0.5 }, { url: `${SITE_URL}/${id}/flashcards/`, priority: 0.6 });
    e.chapterList.forEach((c) => urls.push({ url: `${SITE_URL}/${id}/learn/${c.id}/`, priority: 0.8 }, { url: `${SITE_URL}/${id}/quiz/${c.id}/`, priority: 0.7 }, { url: `${SITE_URL}/${id}/flashcards/${c.id}/`, priority: 0.5 }));
    for (let i = 1; i <= e.mock.sets; i++) urls.push({ url: `${SITE_URL}/${id}/mock/${i}/`, priority: 0.7 });
    e.domains.forEach((d) => urls.push({ url: `${SITE_URL}/${id}/practice/${d.id}/`, priority: 0.6 }));
  }
  return urls.map((u) => ({ ...u, lastModified: now, changeFrequency: 'weekly' }));
}
