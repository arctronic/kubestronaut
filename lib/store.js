'use client';
/* Learner progress in localStorage (key kept from v1 so existing progress carries over). */
import { useEffect, useState } from 'react';

const KEY = 'kubestronaut.v1';
let state = null;
const subs = new Set();

function load() {
  if (state) return state;
  try { state = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) { state = {}; }
  state.progress = state.progress || {};
  return state;
}
function emit() { subs.forEach((fn) => fn()); }
const dayKey = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

export const store = {
  get state() { return load(); },
  save() { try { localStorage.setItem(KEY, JSON.stringify(load())); } catch (_) { /* storage unavailable */ } emit(); },
  exam(id) {
    const s = load();
    const p = (s.progress[id] = s.progress[id] || {});
    p.chapters = p.chapters || {}; p.attempts = p.attempts || []; p.qstats = p.qstats || {}; p.flash = p.flash || {}; p.notes = p.notes || {};
    return p;
  },
  chapter(examId, chId) { const p = this.exam(examId); const c = (p.chapters[chId] = p.chapters[chId] || {}); c.viewed = c.viewed || []; return c; },
  recordAnswer(examId, qid, correct) {
    const qs = this.exam(examId).qstats;
    const s = (qs[qid] = qs[qid] || { seen: 0, correct: 0 });
    s.seen++; if (correct) s.correct++; s.last = correct ? 1 : 0;
    this.touch({ answered: 1, correct: correct ? 1 : 0 });
  },
  today() { return dayKey(new Date()); },
  touch(delta) {
    const s = load(); s.activity = s.activity || {};
    const a = (s.activity[this.today()] = s.activity[this.today()] || { min: 0, answered: 0, correct: 0, slides: 0 });
    Object.keys(delta || {}).forEach((k) => (a[k] = (a[k] || 0) + delta[k]));
  },
  event(examId, text, icon) {
    const s = load(); s.events = s.events || [];
    s.events.unshift({ t: Date.now(), exam: examId, text, icon: icon || 'circle-dot' });
    s.events = s.events.slice(0, 40);
    this.save();
  },
  streak() {
    const act = load().activity || {};
    let n = 0; const d = new Date();
    if (!act[dayKey(d)]) d.setDate(d.getDate() - 1);
    while (act[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  },
  week() {
    const act = load().activity || {}; const now = new Date(); const day = (now.getDay() + 6) % 7;
    const start = new Date(now); start.setDate(now.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); const k = dayKey(d); return { key: k, label: 'MTWTFSS'[i], active: !!act[k], today: i === day, future: i > day, data: act[k] }; });
  },
  get goal() { return load().goal || 4; },
  set goal(v) { load().goal = v; this.save(); },
  setLast(info) { load().lastVisit = Object.assign({ t: Date.now() }, info); this.save(); },
  ui() { const s = load(); s.ui = s.ui || {}; return s.ui; },
  exportJSON() { return JSON.stringify(load(), null, 2); },
  importJSON(txt) { const s = JSON.parse(txt); if (!s || typeof s !== 'object') throw new Error('bad file'); state = s; state.progress = state.progress || {}; this.save(); },
  reset() { const theme = load().theme; state = { progress: {}, theme }; this.save(); },
};

/** Re-render on store changes. Returns false during SSR/first paint so markup matches the server HTML. */
export function useStore() {
  const [, setN] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    load(); setReady(true);
    const fn = () => setN((n) => n + 1);
    subs.add(fn);
    const onStorage = (e) => { if (e.key === KEY) { state = null; load(); fn(); } };
    window.addEventListener('storage', onStorage);
    return () => { subs.delete(fn); window.removeEventListener('storage', onStorage); };
  }, []);
  return ready;
}

/** Counts active study minutes while a learning page is open and visible. */
export function useStudyTimer() {
  useEffect(() => {
    let last = Date.now();
    const mark = () => (last = Date.now());
    const evs = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    evs.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    const iv = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - last < 120000) { store.touch({ min: 1 }); store.save(); }
    }, 60000);
    return () => { clearInterval(iv); evs.forEach((e) => window.removeEventListener(e, mark)); };
  }, []);
}

export function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  const next = cur === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  load().theme = next; store.save();
}
