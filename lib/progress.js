'use client';
import { store } from './store';
import { pct } from './util';

export const lessonHref = (examId, chId, slide) => `/${examId}/learn/${chId}/` + (slide ? `#s${slide}` : '');
export const quizHref = (examId, chId) => `/${examId}/quiz/${chId}/`;
export const flashHref = (examId, chId) => `/${examId}/flashcards/${chId}/`;
export const mockHref = (examId, key) => `/${examId}/mock/${key}/`;

/** Coursera-style items per lesson: slides -> practice quiz -> flashcards (optional). `e` is an exam summary. */
export function chapterItems(e, c, blank) {
  const st = blank ? { viewed: [] } : store.chapter(e.id, c.id);
  const seen = Math.min(st.viewed.length, c.slideCount);
  return [
    { kind: 'learn', ch: c, title: c.title, type: 'Lesson', meta: `${c.slideCount} slides · ${c.minutes || Math.round(c.slideCount * 2.3)} min`, href: lessonHref(e.id, c.id, st.last ? st.last + 1 : 0), done: !!st.completed, started: seen > 0, progress: pct(seen, c.slideCount), required: true },
    { kind: 'quiz', ch: c, title: 'Practice quiz: ' + c.title, type: 'Practice quiz', meta: `${c.quizCount} questions`, href: quizHref(e.id, c.id), done: (st.quizBest || 0) >= e.mock.pass, started: st.quizBest != null, grade: st.quizBest, required: true },
    { kind: 'flash', ch: c, title: 'Flashcards: ' + c.title, type: 'Flashcards', meta: `${c.glossaryCount} terms · optional`, href: flashHref(e.id, c.id), done: !!st.flashDone, started: !!st.flashDone, required: false },
  ];
}
export function mockItems(e, blank) {
  const p = blank ? { attempts: [] } : store.exam(e.id);
  return Array.from({ length: e.mock.sets }, (_, i) => {
    const key = String(i + 1), tries = p.attempts.filter((t) => t.key === key);
    const best = tries.length ? Math.max(...tries.map((t) => t.score)) : null;
    return { kind: 'mock', mkey: key, title: 'Mock exam ' + key, type: 'Graded exam', meta: `${e.mock.questions} questions · ${e.mock.minutes} min`, href: mockHref(e.id, key), done: best != null && best >= e.mock.pass, started: tries.length > 0 || !!(p.activeMock && p.activeMock.key === key), grade: best, required: true };
  });
}
export const orderedItems = (e) => e.chapters.flatMap((c) => chapterItems(e, c));
export function courseProgress(e) {
  const items = orderedItems(e).concat(mockItems(e)).filter((x) => x.required);
  const done = items.filter((x) => x.done).length;
  return { done, total: items.length, pct: pct(done, items.length) };
}
export function nextItem(e) {
  const items = orderedItems(e);
  return items.find((x) => x.required && !x.done) || mockItems(e).find((x) => !x.done) || items[0];
}
export function resumeTarget(e) {
  const lv = store.state.lastVisit;
  if (lv && lv.exam === e.id && lv.href) return { href: lv.href, label: lv.label };
  const n = nextItem(e);
  return { href: n.href, label: n.title };
}
export function domainAccuracy(e, questionDomain) {
  const qs = store.exam(e.id).qstats, out = {};
  e.domains.forEach((d) => (out[d.id] = { seen: 0, correct: 0 }));
  Object.entries(qs).forEach(([id, s]) => { const dom = questionDomain(id); if (dom && out[dom]) { out[dom].seen += s.seen; out[dom].correct += s.correct; } });
  return out;
}
/** Question id -> domain without shipping the whole bank: chapter quiz ids embed the chapter. */
export function domainOfQuestion(e) {
  const byCh = {}; e.chapters.forEach((c) => (byCh[c.id] = c.domain));
  return (id) => { const m = /^(.*)-q\d+$/.exec(id); if (m && byCh[m[1]]) return byCh[m[1]]; return (e.mockDomains || {})[id]; };
}
