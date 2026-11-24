#!/usr/bin/env node
/* Content validator: node tools/validate.js [examId]
   Loads exam content files in a sandbox and checks schema, answers, diagrams and duplicates. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const examId = process.argv[2] || 'kcna';
const root = path.join(__dirname, '..', 'exams', examId);
const BLOCKS = new Set(['text', 'html', 'bullets', 'cards', 'flip', 'compare', 'table', 'code', 'callout', 'diagram', 'flow', 'layers', 'tabs', 'cols', 'check', 'stats', 'timeline', 'reveal', 'svg', 'match']);
const errors = [];
const warns = [];
const err = (where, msg) => errors.push(`✗ ${where}: ${msg}`);
const warn = (where, msg) => warns.push(`! ${where}: ${msg}`);

const store = { exam: null, chapters: {}, bank: [] };
const KS = {
  registerExam: (e) => (store.exam = e),
  registerChapter: (id, ch) => { if (store.chapters[ch.id]) err(ch.id, 'duplicate chapter id'); store.chapters[ch.id] = ch; },
  registerMockBank: (id, qs) => { store.bank = store.bank.concat(qs.map((q) => Object.assign({ _file: KS._file }, q))); },
};
function run(file) {
  KS._file = path.basename(file);
  const code = fs.readFileSync(file, 'utf8');
  try { vm.runInNewContext(code, { KS, console }, { filename: file }); } catch (e) { err(path.basename(file), 'failed to execute: ' + e.message); }
}

run(path.join(root, 'exam.js'));
const exam = store.exam;
if (!exam) { console.error('exam.js did not register an exam'); process.exit(1); }
const domainIds = new Set(exam.domains.map((d) => d.id));
const wsum = exam.domains.reduce((a, d) => a + d.weight, 0);
if (wsum !== 100) err('exam.js', 'domain weights sum to ' + wsum);
exam.chapters.forEach((c) => { const f = path.join(root, 'chapters', c.file); if (!fs.existsSync(f)) err('exam.js', 'missing chapter file ' + c.file); else run(f); });
(exam.extraFiles || []).forEach((f) => { const p = path.join(root, f); if (!fs.existsSync(p)) err('exam.js', 'missing extra file ' + f); else run(p); });

function checkQuestion(where, q) {
  if (!q || typeof q.q !== 'string' || !q.q.trim()) return err(where, 'missing question text');
  if (!Array.isArray(q.options) || q.options.length < 3 || q.options.length > 6) err(where, 'needs 3–6 options');
  const opts = q.options || [];
  if (new Set(opts.map((o) => String(o).trim().toLowerCase())).size !== opts.length) err(where, 'duplicate options');
  const ans = Array.isArray(q.answer) ? q.answer : [q.answer];
  if (!ans.length || ans.some((a) => !Number.isInteger(a) || a < 0 || a >= opts.length)) err(where, 'answer index out of range: ' + JSON.stringify(q.answer));
  if (Array.isArray(q.answer)) {
    if (q.answer.length < 2) err(where, 'multi-select answer must have ≥2 indices (use a number for single answer)');
    if (new Set(q.answer).size !== q.answer.length) err(where, 'duplicate indices in answer');
    if (!/select\s*\d|choose\s*\d|\(select|\(choose/i.test(q.q)) warn(where, 'multi-select question should say "(Select N)"');
  }
  if (!q.explain || q.explain.length < 25) err(where, 'explanation missing or too short');
  if (/all of the above|none of the above/i.test(opts.join(' '))) warn(where, 'avoid “all/none of the above”');
}

function checkBlocks(where, blocks) {
  (blocks || []).forEach((b, i) => {
    const w = `${where} block#${i + 1}(${b && b.type})`;
    if (!b || !BLOCKS.has(b.type)) return err(w, 'unknown block type');
    if (b.type === 'cols') (b.cols || []).forEach((c) => checkBlocks(w, c));
    if (b.type === 'tabs') (b.tabs || []).forEach((t) => checkBlocks(w, t.blocks));
    if (b.type === 'check') checkQuestion(w, b);
    if (b.type === 'match' && (!b.pairs || b.pairs.length < 3)) err(w, 'match needs ≥3 pairs');
    if (b.type === 'code') {
      const n = String(b.code || '').replace(/^\n/, '').replace(/\s+$/, '').split('\n').length;
      Object.keys(b.notes || {}).forEach((k) => { if (+k < 1 || +k > n) err(w, `note line ${k} outside 1..${n}`); });
    }
    if (b.type === 'diagram') {
      const ids = new Set();
      (b.nodes || []).forEach((n) => {
        if (ids.has(n.id)) err(w, 'duplicate node id ' + n.id); ids.add(n.id);
        const W = b.width || 900, H = b.height || 420, nw = n.w || 150, nh = n.h || 56;
        if (n.x < 0 || n.y < 0 || n.x + nw > W || n.y + nh > H) warn(w, `node ${n.id} outside canvas`);
      });
      const eids = new Set();
      (b.edges || []).forEach((e) => { if (!ids.has(e.from) || !ids.has(e.to)) err(w, `edge ${e.from}>${e.to} references unknown node`); eids.add(e.from + '>' + e.to); });
      (b.steps || []).forEach((s, si) => (s.on || []).forEach((x) => { if (!ids.has(x) && !eids.has(x)) err(w, `step ${si + 1} references unknown id ${x}`); }));
    }
  });
}

const seenQ = new Map();
let totalQ = 0, totalSlides = 0, totalTerms = 0;
const perDomain = {};
exam.chapters.forEach((c) => {
  const ch = store.chapters[c.id];
  if (!ch) return err(c.id, 'chapter not registered (id mismatch?)');
  ['title', 'subtitle', 'icon', 'slides', 'summary', 'glossary', 'quiz', 'objectives'].forEach((k) => { if (!ch[k] || (Array.isArray(ch[k]) && !ch[k].length)) err(c.id, 'missing ' + k); });
  (ch.slides || []).forEach((s, i) => { if (!s.title) warn(`${c.id} slide ${i + 1}`, 'no title'); checkBlocks(`${c.id} slide ${i + 1}`, s.blocks); });
  (ch.quiz || []).forEach((q, i) => {
    checkQuestion(`${c.id} quiz ${i + 1}`, q);
    const key = (q.q || '').toLowerCase().replace(/\W+/g, ' ').trim();
    if (seenQ.has(key)) warn(`${c.id} quiz ${i + 1}`, 'duplicate of ' + seenQ.get(key)); else seenQ.set(key, `${c.id} quiz ${i + 1}`);
    perDomain[c.domain] = (perDomain[c.domain] || 0) + 1;
  });
  totalQ += (ch.quiz || []).length; totalSlides += (ch.slides || []).length; totalTerms += (ch.glossary || []).length;
  console.log(`  ${c.id.padEnd(18)} slides ${String((ch.slides || []).length).padStart(2)}  quiz ${String((ch.quiz || []).length).padStart(2)}  terms ${String((ch.glossary || []).length).padStart(2)}`);
});
const bankDomain = {};
store.bank.forEach((q, i) => {
  const w = `${q._file} #${i + 1}`;
  if (!domainIds.has(q.domain)) err(w, 'unknown domain ' + q.domain);
  checkQuestion(w, q);
  const key = (q.q || '').toLowerCase().replace(/\W+/g, ' ').trim();
  if (seenQ.has(key)) warn(w, 'duplicate of ' + seenQ.get(key)); else seenQ.set(key, w);
  bankDomain[q.domain] = (bankDomain[q.domain] || 0) + 1;
});
// answer-position balance (single answer)
const pos = [0, 0, 0, 0, 0, 0];
Object.values(store.chapters).forEach((ch) => (ch.quiz || []).forEach((q) => { if (!Array.isArray(q.answer)) pos[q.answer]++; }));
store.bank.forEach((q) => { if (!Array.isArray(q.answer)) pos[q.answer]++; });

console.log(`\nChapters: ${Object.keys(store.chapters).length}  slides: ${totalSlides}  chapter-quiz Qs: ${totalQ}  terms: ${totalTerms}`);
console.log('Mock bank by domain:', JSON.stringify(bankDomain), ' total', store.bank.length);
console.log('Chapter quiz by domain:', JSON.stringify(perDomain));
console.log('Single-answer position spread A..F:', pos.join(' / '));
warns.forEach((w) => console.log(w));
errors.forEach((e) => console.log(e));
console.log(errors.length ? `\n${errors.length} error(s)` : '\nOK: no errors');
process.exit(errors.length ? 1 : 0);
