export const COLORS = ['blue', 'teal', 'green', 'amber', 'red', 'purple', 'pink', 'gray'];
export const color = (name) => (name && /^[a-z]+$/.test(name) ? `var(--c-${name})` : name || 'var(--c-blue)');
export const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
export function rng(seed) {
  let a = seed >>> 0;
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function shuffle(arr, rand) { rand = rand || Math.random; const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function hashStr(s) { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
export function fmtTime(sec) { sec = Math.max(0, Math.round(sec)); return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); }
export function ago(t) {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago';
  if (s < 86400) return Math.round(s / 3600) + ' h ago'; return Math.round(s / 86400) + ' d ago';
}
export const asArr = (a) => (Array.isArray(a) ? a.slice().sort() : [a]);
export function isCorrect(q, picked) { const A = asArr(q.answer), P = (picked || []).slice().sort(); return A.length === P.length && A.every((x, i) => x === P[i]); }
export function refLabel(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const parts = u.pathname.split('/').filter(Boolean).filter((x) => !/^(docs|en|latest|stable|blob|main|master|tree)$/.test(x));
    const last = (parts.pop() || '').replace(/\.md$/, '').replace(/[-_]/g, ' ');
    return last ? host + ' › ' + last : host;
  } catch (_) { return url; }
}
export const refs = (q) => (Array.isArray(q.ref) ? q.ref : q.ref ? [q.ref] : []);
export function allocate(total, domains) {
  const raw = domains.map((d) => (total * d.weight) / 100);
  const base = raw.map(Math.floor);
  let left = total - base.reduce((a, b) => a + b, 0);
  raw.map((r, i) => [r - base[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { base[i]++; left--; } });
  return base;
}
