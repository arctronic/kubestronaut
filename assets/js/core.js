/* Kubestronaut Study Platform: core (namespace, storage, loader, router, helpers) */
(function () {
  'use strict';

  const KS = (window.KS = window.KS || {});
  KS.exams = KS.exams || {};      // id -> exam meta (from registry, enriched by exam.js)
  KS.order = KS.order || [];      // exam ids in Kubestronaut path order
  KS.loaded = {};                 // id -> Promise

  /* ---------------- registration API (called by content files) ---------------- */
  KS.registerExamMeta = function (meta) {
    if (!KS.exams[meta.id]) KS.order.push(meta.id);
    KS.exams[meta.id] = Object.assign(KS.exams[meta.id] || {}, meta);
  };
  KS.registerExam = function (exam) {
    const e = (KS.exams[exam.id] = Object.assign(KS.exams[exam.id] || {}, exam));
    e.chapters = e.chapters || [];
    e._chapters = e._chapters || {};
    e.mockBank = e.mockBank || [];
  };
  KS.registerChapter = function (examId, ch) {
    const e = KS.exams[examId];
    if (!e) throw new Error('registerChapter before registerExam: ' + examId);
    e._chapters[ch.id] = ch;
  };
  KS.registerMockBank = function (examId, questions) {
    const e = KS.exams[examId];
    e.mockBank = (e.mockBank || []).concat(questions);
  };

  /* ---------------- script loader ---------------- */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }
  KS.loadExam = function (id) {
    if (KS.loaded[id]) return KS.loaded[id];
    const meta = KS.exams[id];
    if (!meta || !meta.available) return Promise.reject(new Error('Exam not available yet: ' + id));
    const base = 'exams/' + id + '/';
    KS.loaded[id] = loadScript(base + 'exam.js').then(() => {
      const e = KS.exams[id];
      const files = e.chapters.map((c) => base + 'chapters/' + c.file);
      (e.extraFiles || []).forEach((f) => files.push(base + f));
      // load sequentially-in-parallel (order not important; registration is keyed)
      // a missing/broken file should not take the whole exam down
      return Promise.all(files.map((f) => loadScript(f).catch((err) => console.warn(err.message)))).then(() => finalizeExam(e));
    });
    return KS.loaded[id];
  };

  function finalizeExam(e) {
    // resolve chapter objects in declared order; attach domain + stable question ids
    e.chapterList = e.chapters
      .map((c, i) => {
        const ch = e._chapters[c.id];
        if (!ch) { console.warn('Missing chapter content', c.id); return null; }
        ch.id = c.id; ch.num = i + 1; ch.domain = ch.domain || c.domain;
        (ch.quiz || []).forEach((q, qi) => { q.id = q.id || ch.id + '-q' + (qi + 1); q.domain = q.domain || ch.domain; q.chapter = ch.id; });
        return ch;
      })
      .filter(Boolean);
    e.mockBank.forEach((q, i) => { q.id = q.id || e.id + '-m' + (i + 1); q.source = 'mock'; });
    e.questionIndex = {};
    e.chapterList.forEach((ch) => (ch.quiz || []).forEach((q) => (e.questionIndex[q.id] = q)));
    e.mockBank.forEach((q) => (e.questionIndex[q.id] = q));
    e.domainById = {};
    (e.domains || []).forEach((d) => (e.domainById[d.id] = d));
    return e;
  }

  /* ---------------- storage ---------------- */
  const KEY = 'kubestronaut.v1';
  let state;
  function load() {
    try { state = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) { state = {}; }
    state.progress = state.progress || {};
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { /* storage unavailable */ }
  }
  load();
  KS.store = {
    get state() { return state; },
    save,
    exam(id) {
      const p = (state.progress[id] = state.progress[id] || {});
      p.chapters = p.chapters || {};
      p.attempts = p.attempts || [];
      p.qstats = p.qstats || {};   // qid -> {seen, correct}
      p.flash = p.flash || {};     // term -> 'known' | 'again'
      return p;
    },
    chapter(examId, chId) {
      const p = this.exam(examId);
      const c = (p.chapters[chId] = p.chapters[chId] || {});
      c.viewed = c.viewed || [];
      return c;
    },
    recordAnswer(examId, qid, correct) {
      const s = (this.exam(examId).qstats[qid] = this.exam(examId).qstats[qid] || { seen: 0, correct: 0 });
      s.seen++; if (correct) s.correct++; s.last = correct ? 1 : 0;
    },
    exportJSON() { return JSON.stringify(state, null, 2); },
    importJSON(txt) { const s = JSON.parse(txt); if (!s || typeof s !== 'object') throw new Error('bad file'); state = s; state.progress = state.progress || {}; save(); },
    reset() { state = { progress: {}, theme: state.theme }; save(); },
  };

  /* ---------------- theme ---------------- */
  KS.applyTheme = function () {
    const t = state.theme;
    if (t) document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  };
  KS.toggleTheme = function () {
    const cur = document.documentElement.getAttribute('data-theme') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    state.theme = cur === 'light' ? 'dark' : 'light';
    save(); KS.applyTheme();
  };
  KS.applyTheme();

  /* ---------------- helpers ---------------- */
  KS.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat(Infinity).forEach((c) => { if (c == null || c === false) return; el.appendChild(c.nodeType ? c : document.createTextNode(String(c))); });
    return el;
  };
  KS.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  KS.color = (name) => (name && /^[a-z]+$/.test(name) ? 'var(--c-' + name + ')' : name || 'var(--c-blue)');
  KS.rng = function (seed) { // mulberry32
    let a = seed >>> 0;
    return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  KS.shuffle = function (arr, rand) { rand = rand || Math.random; const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  KS.fmtTime = function (sec) { sec = Math.max(0, Math.round(sec)); const m = Math.floor(sec / 60), s = sec % 60; return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); };
  KS.toast = function (msg) { const t = KS.h('div', { class: 'toast', text: msg }); document.body.appendChild(t); setTimeout(() => t.remove(), 2200); };
  KS.ring = function (pct, color, size) {
    size = size || 150; const r = size / 2 - 10, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(1, pct / 100)));
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="10"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color || 'var(--accent)'}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" style="transition:stroke-dashoffset .8s"/></svg>`;
  };

  /* ---------------- router ---------------- */
  const routes = [];
  KS.route = function (pattern, handler) {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
    routes.push({ re, keys, handler });
  };
  KS.go = function (path) { location.hash = '#' + path; };
  KS.cleanup = [];
  KS.onLeave = function (fn) { KS.cleanup.push(fn); };
  KS.dispatch = function () {
    KS.cleanup.splice(0).forEach((fn) => { try { fn(); } catch (_) {} });
    const path = (location.hash || '#/').slice(1) || '/';
    for (const r of routes) {
      const m = path.match(r.re);
      if (m) {
        const params = {}; r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
        window.scrollTo(0, 0);
        return Promise.resolve(r.handler(params)).catch((err) => KS.renderError(err));
      }
    }
    KS.go('/');
  };
  window.addEventListener('hashchange', KS.dispatch);
})();
