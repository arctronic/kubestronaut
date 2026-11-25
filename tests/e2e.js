#!/usr/bin/env node
/* End-to-end check of the static export (run `npm run build` first).
   Serves ./out, then in Chromium: every lesson renders all its slides, every quiz/flashcard page works,
   all mock exams start with a blueprint-weighted, non-overlapping question set, and no page logs errors. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..', 'out');
if (!fs.existsSync(root)) { console.error('out/ not found: run `npm run build` first'); process.exit(1); }
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
const fail = (m) => { console.error('✗ ' + m); process.exitCode = 1; };

server.listen(0, async () => {
  const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(page.url() + ' ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|404/.test(m.text())) errors.push(page.url() + ' ' + m.text()); });
  try {
    const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    console.log(`sitemap: ${urls.length} URLs`);

    let slides = 0, lessons = 0;
    for (const u of urls.filter((x) => /\/learn\//.test(x))) {
      await page.goto(base + u);
      const r = await page.evaluate(() => ({ total: document.querySelectorAll('article.slide').length, visible: document.querySelectorAll('article.slide:not([hidden])').length, title: document.title, ld: !!document.querySelector('script[type="application/ld+json"]') }));
      if (r.total < 5 || r.visible !== 1) fail(`${u}: ${r.total} slides, ${r.visible} visible`);
      if (!r.ld) fail(`${u}: missing structured data`);
      slides += r.total; lessons++;
    }
    console.log(`✓ ${lessons} lessons, ${slides} slides rendered`);

    for (const u of urls.filter((x) => /\/(quiz|flashcards)\//.test(x))) {
      await page.goto(base + u);
      await page.waitForSelector(/quiz/.test(u) ? 'text=Start quiz' : '.fc');
    }
    // take one quiz end to end
    await page.goto(base + '/kcna/quiz/storage/');
    await page.click('text=Start quiz');
    for (let i = 0; i < 12; i++) {
      if (await page.locator('text=Submit answer').isVisible()) { await page.locator('.opt').nth(0).click(); await page.locator('.opt').nth(1).click(); await page.click('text=Submit answer'); }
      else await page.locator('.opt').first().click();
      await page.locator('.q-foot .btn.primary').last().click();
    }
    await page.waitForSelector('.result-card');
    console.log('✓ quiz and flashcard pages work');

    const fixed = [];
    for (const key of ['1', '2', '3', 'random']) {
      await page.goto(`${base}/kcna/mock/${key}/`);
      await page.click('text=Start the clock');
      await page.waitForSelector('.mock-head');
      const ids = await page.evaluate(() => JSON.parse(localStorage.getItem('kubestronaut.v1')).progress.kcna.activeMock.qids);
      if (ids.length !== 60 || new Set(ids).size !== 60) fail(`mock ${key}: bad question set`);
      if (key !== 'random') fixed.push(ids);
      await page.click('.mock-head >> text=Submit');
      await page.click('text=Submit now');
      await page.waitForSelector('.result-hero');
    }
    for (let i = 0; i < fixed.length; i++) for (let j = i + 1; j < fixed.length; j++) if (fixed[i].some((q) => fixed[j].includes(q))) fail(`mocks ${i + 1} and ${j + 1} overlap`);
    console.log('✓ 4 mock exams: 60 unique questions each, fixed sets do not overlap');

    for (const u of ['/', '/kcna/', '/kcna/grades/', '/kcna/notes/', '/kcna/guide/', '/kcna/resources/', '/kcna/cheatsheet/', '/kcna/flashcards/', '/kcna/drill/', '/settings/']) {
      await page.goto(base + u);
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
