#!/usr/bin/env node
/* Visual audit: node tools/visual-audit.js [examId] [--chapter=<id>] [--json]
   Scores every authored slide by how visual it is and lists concrete enrichment targets:
   text-only slides, diagrams without a walkthrough, nodes without click-to-learn info, flows without info. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const args = process.argv.slice(2);
const examId = args.find((a) => !a.startsWith('--')) || 'kcna';
const onlyCh = (args.find((a) => a.startsWith('--chapter=')) || '').slice(10);
const asJson = args.includes('--json');
const root = path.join(__dirname, '..', 'exams', examId);

const store = { exam: null, chapters: {} };
const KS = { registerExam: (e) => (store.exam = e), registerChapter: (id, ch) => (store.chapters[ch.id] = ch), registerMockBank: () => {} };
const run = (f) => vm.runInNewContext(fs.readFileSync(f, 'utf8'), { KS, console }, { filename: f });
run(path.join(root, 'exam.js'));
store.exam.chapters.forEach((c) => run(path.join(root, 'chapters', c.file)));

// weight of each block type as a "visual"
const VISUAL = { diagram: 3, flow: 2, layers: 2, timeline: 2, svg: 2, match: 2, flip: 1.5, compare: 1.5, cards: 1, stats: 1, code: 1, tabs: 0, cols: 0, check: 0.5 };
const TEXT = new Set(['text', 'bullets', 'callout', 'reveal', 'html']);
const GRAPHIC = new Set(['diagram', 'flow', 'layers', 'timeline', 'svg']); // real pictures, not tables/cards
const TARGET = { diagramsPerChapter: 3, graphicSlideRatio: 0.6 };

function walk(blocks, out) {
  (blocks || []).forEach((b) => {
    out.push(b);
    if (b.type === 'cols') (b.cols || []).forEach((c) => walk(c, out));
    if (b.type === 'tabs') (b.tabs || []).forEach((t) => walk(t.blocks, out));
  });
  return out;
}

const report = [];
store.exam.chapters.forEach((c, ci) => {
  if (onlyCh && c.id !== onlyCh) return;
  const ch = store.chapters[c.id];
  const slides = (ch.slides || []).map((s, i) => {
    const all = walk(s.blocks, []);
    const score = all.reduce((a, b) => a + (VISUAL[b.type] || 0), 0);
    const issues = [];
    if (!all.some((b) => VISUAL[b.type] >= 1)) issues.push('TEXT_ONLY: no visual block at all');
    else if (!all.some((b) => GRAPHIC.has(b.type))) issues.push('NO_GRAPHIC: only tables/cards/text (' + [...new Set(all.map((b) => b.type))].join(', ') + '); add a diagram, flow, layers or timeline that shows the mechanism');
    const words = all.filter((b) => TEXT.has(b.type)).map((b) => (b.html || b.text || (b.items || []).join(' ') || '').replace(/<[^>]+>/g, ' ')).join(' ').split(/\s+/).filter(Boolean).length;
    if (words > 140) issues.push(`WORDY: ${words} words of prose/bullets (split, or turn into a visual)`);
    all.filter((b) => b.type === 'diagram').forEach((d) => {
      if (!(d.steps || []).length) issues.push('DIAGRAM_NO_STEPS: diagram has no step-by-step walkthrough');
      const noInfo = (d.nodes || []).filter((n) => !n.info).map((n) => n.id);
      if (noInfo.length) issues.push(`NODES_NO_INFO: ${noInfo.join(', ')}`);
    });
    all.filter((b) => b.type === 'flow').forEach((f) => { if ((f.items || []).some((x) => !x.info)) issues.push('FLOW_NO_INFO: some flow steps lack an info text'); });
    return { slide: i + 2, title: String(s.title || '').replace(/<[^>]+>/g, ''), types: all.map((b) => b.type), score: Math.round(score * 10) / 10, issues };
  });
  const diagrams = slides.reduce((a, s) => a + s.types.filter((t) => t === 'diagram').length, 0);
  const graphicSlides = slides.filter((s) => s.types.some((t) => GRAPHIC.has(t))).length;
  const ratio = slides.length ? graphicSlides / slides.length : 0;
  const goals = [];
  if (diagrams < TARGET.diagramsPerChapter) goals.push(`needs ${TARGET.diagramsPerChapter - diagrams} more interactive diagram(s) (target ${TARGET.diagramsPerChapter})`);
  if (ratio < TARGET.graphicSlideRatio) goals.push(`graphic coverage ${Math.round(ratio * 100)}% (target ${TARGET.graphicSlideRatio * 100}%: ${Math.ceil(TARGET.graphicSlideRatio * slides.length) - graphicSlides} more slide(s) with a graphic)`);
  report.push({ num: ci + 1, id: c.id, file: `exams/${examId}/chapters/${c.file}`, slides, diagrams, graphicSlides, ratio, goals, textOnly: slides.filter((s) => s.issues.some((x) => x.startsWith('TEXT_ONLY'))).length });
});

if (asJson) { console.log(JSON.stringify(report, null, 2)); process.exit(0); }
let totalIssues = 0;
report.forEach((r) => {
  console.log(`\n${String(r.num).padStart(2, '0')} ${r.id}  (${r.file})  diagrams: ${r.diagrams}  graphic slides: ${r.graphicSlides}/${r.slides.length}`);
  r.goals.forEach((g) => console.log('   GOAL: ' + g));
  r.slides.forEach((s) => {
    const flag = s.issues.length ? '!' : ' ';
    console.log(`  ${flag} slide ${String(s.slide).padStart(2)}  score ${String(s.score).padStart(4)}  ${s.title.slice(0, 60)}  [${s.types.join(', ')}]`);
    s.issues.forEach((x) => { console.log('        - ' + x); totalIssues++; });
  });
});
const pass = report.every((r) => !r.goals.length);
console.log(`\n${totalIssues} slide-level targets; chapters meeting goals: ${report.filter((r) => !r.goals.length).length}/${report.length}. Slide numbers match the player (slide 1 is the cover).`);
if (args.includes('--strict') && !pass) process.exitCode = 1;
