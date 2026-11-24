#!/usr/bin/env node
/* End-to-end check: renders every slide, runs all mocks, visits every page.
   Needs Playwright with Chromium: node tests/e2e.js [examId] */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const examId = process.argv[2] || 'kcna';
const root = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

function fail(msg) { console.error('✗ ' + msg); process.exitCode = 1; }

server.listen(0, async () => {
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(base + '#/exam/' + examId);
    await page.waitForFunction((id) => KS.exams[id] && KS.exams[id].chapterList, examId);
    const e = await page.evaluate((id) => {
      const x = KS.exams[id];
      return { chapters: x.chapterList.map((c) => [c.id, c.slides.length + 2]), mock: x.mock, domains: x.domains };
    }, examId);

    let slides = 0;
    for (const [id, n] of e.chapters) {
      for (let i = 1; i <= n; i++) {
        await page.goto(`${base}#/exam/${examId}/learn/${id}/${i}`);
        const r = await page.evaluate(() => ({
          ok: !!document.querySelector('.slide'),
          bad: [...document.querySelectorAll('.b-callout.warn .ct')].some((x) => /Unknown block|Block error/.test(x.textContent)),
          overflow: document.documentElement.scrollWidth > innerWidth + 2,
        }));
        if (!r.ok || r.bad) fail(`slide ${id}/${i} did not render`);
        if (r.overflow) fail(`slide ${id}/${i} overflows horizontally`);
        slides++;
      }
    }
    console.log(`✓ ${slides} slides rendered`);

    const keys = Array.from({ length: e.mock.sets }, (_, i) => String(i + 1)).concat('random');
    const fixed = [];
    for (const key of keys) {
      await page.goto(`${base}#/exam/${examId}/mock/${key}`);
      await page.click('text=Start the clock');
      const m = await page.evaluate((id) => {
        const x = KS.exams[id], a = KS.store.exam(id).activeMock, d = {};
        a.qids.forEach((q) => { const dom = x.questionIndex[q].domain; d[dom] = (d[dom] || 0) + 1; });
        return { ids: a.qids, d };
      }, examId);
      if (m.ids.length !== e.mock.questions || new Set(m.ids).size !== m.ids.length) fail(`mock ${key}: bad question set`);
      if (key !== 'random') fixed.push(m.ids);
      await page.click('.mock-head >> text=Submit');
      await page.click('text=Submit now');
      await page.waitForSelector('.result-hero');
      console.log(`✓ mock ${key}: ${m.ids.length} questions ${JSON.stringify(m.d)}`);
    }
    for (let i = 0; i < fixed.length; i++) for (let j = i + 1; j < fixed.length; j++) {
      const overlap = fixed[i].filter((q) => fixed[j].includes(q)).length;
      if (overlap) fail(`mock ${i + 1} and ${j + 1} share ${overlap} questions`);
    }

    for (const r of ['', `exam/${examId}`, `exam/${examId}/intel`, `exam/${examId}/library`, `exam/${examId}/cheatsheet`, `exam/${examId}/flash/all`, `exam/${examId}/drill`, 'data']) {
      await page.goto(`${base}#/${r}`);
      await page.waitForSelector('.topbar');
    }
    console.log('✓ all pages load');
    if (errors.length) fail('browser errors:\n  ' + [...new Set(errors)].slice(0, 10).join('\n  '));
  } catch (err) {
    fail(err.message);
  } finally {
    await browser.close();
    server.close();
    console.log(process.exitCode ? 'E2E FAILED' : 'E2E OK');
  }
});
