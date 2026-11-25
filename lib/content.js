/* Build-time content loader (server only).
   Content lives in /exams as plain scripts that call KS.register*(); we evaluate them in a sandbox. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.join(process.cwd(), 'exams');
let cache = null;

function run(file, KS) {
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), { KS, console }, { filename: file });
}

function load() {
  const order = [];
  const metas = {};
  const exams = {};
  const KS = {
    registerExamMeta(m) { order.push(m.id); metas[m.id] = m; },
    registerExam(e) { exams[e.id] = Object.assign({}, metas[e.id], e, { _chapters: {}, mockBank: [] }); },
    registerChapter(id, ch) { exams[id]._chapters[ch.id] = ch; },
    registerMockBank(id, qs) { exams[id].mockBank = exams[id].mockBank.concat(qs); },
  };
  run(path.join(ROOT, 'registry.js'), KS);
  for (const id of order) {
    if (!metas[id].available) continue;
    const base = path.join(ROOT, id);
    run(path.join(base, 'exam.js'), KS);
    const e = exams[id];
    e.chapters.forEach((c) => run(path.join(base, 'chapters', c.file), KS));
    (e.extraFiles || []).forEach((f) => run(path.join(base, f), KS));
    e.chapterList = e.chapters.map((c, i) => {
      const ch = e._chapters[c.id];
      if (!ch) throw new Error(`Missing chapter ${id}/${c.id}`);
      ch.id = c.id; ch.num = i + 1; ch.domain = ch.domain || c.domain;
      (ch.quiz || []).forEach((q, qi) => { q.id = q.id || `${ch.id}-q${qi + 1}`; q.domain = q.domain || ch.domain; q.chapter = ch.id; });
      return ch;
    });
    e.mockBank.forEach((q, i) => { q.id = q.id || `${id}-m${i + 1}`; q.source = 'mock'; });
    delete e._chapters;
  }
  return { order, metas, exams };
}

export function content() { return (cache = cache || load()); }
export function examMetas() { const c = content(); return c.order.map((id) => c.metas[id]); }
export function availableExamIds() { return examMetas().filter((m) => m.available).map((m) => m.id); }
export function getExam(id) { const e = content().exams[id]; if (!e) throw new Error('Unknown exam ' + id); return e; }
export function getChapter(examId, chId) { return getExam(examId).chapterList.find((c) => c.id === chId); }

/** Lightweight, serialisable view of an exam for client components (no slides/questions). */
export function examSummary(id) {
  const e = getExam(id);
  return {
    id: e.id, short: e.short, title: e.title, tagline: e.tagline, color: e.color || 'blue', icon: e.icon,
    format: e.format, duration: e.duration, mock: e.mock, domains: e.domains,
    questionCount: e.chapterList.reduce((a, c) => a + (c.quiz || []).length, 0) + e.mockBank.length,
    mockDomains: Object.fromEntries(e.mockBank.map((q) => [q.id, q.domain])),
    chapters: e.chapterList.map((c) => ({
      id: c.id, num: c.num, title: c.title, subtitle: c.subtitle, icon: c.icon, domain: c.domain, minutes: c.minutes,
      slideCount: c.slides.length + 2, quizCount: (c.quiz || []).length, glossaryCount: (c.glossary || []).length,
    })),
  };
}
/** All questions keyed by id (used by mocks, drills and results). */
export function questionBank(id) {
  const e = getExam(id);
  const qs = [];
  e.chapterList.forEach((c) => (c.quiz || []).forEach((q) => qs.push(q)));
  e.mockBank.forEach((q) => qs.push(q));
  return qs;
}
export function stripHtml(s) { return String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }
