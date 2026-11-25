/* Kubestronaut Study Platform: views.
   Dashboard · course page (material, grades, notes, exam guide, resources) · lesson player (slides, quiz, flashcards)
   · mock exams · results · cheat sheet · library · backup. All progress lives in localStorage via KS.store. */
(function () {
  'use strict';
  const KS = window.KS;
  const h = KS.h;
  const app = () => document.getElementById('app');
  const S = () => KS.store;

  /* ================================================================ helpers */
  function getExam(id) { return KS.loadExam(id); }
  function allQuestions(e) { return Object.values(e.questionIndex); }
  function asArr(a) { return Array.isArray(a) ? a.slice().sort() : [a]; }
  function isCorrect(q, picked) { const A = asArr(q.answer), P = (picked || []).slice().sort(); return A.length === P.length && A.every((x, i) => x === P[i]); }
  function dcolor(e, did) { const d = e.domainById[did]; return KS.color(d ? d.color : 'gray'); }
  function pct(a, b) { return b ? Math.round((100 * a) / b) : 0; }
  function ago(t) {
    const s = Math.round((Date.now() - t) / 1000);
    if (s < 60) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' h ago'; return Math.round(s / 86400) + ' d ago';
  }
  function icon(name) {
    const P = {
      check: '<path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
      play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
      slides: '<rect x="3" y="4" width="18" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      quiz: '<rect x="4" y="3" width="16" height="18" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      cards: '<rect x="3" y="6" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 3h12a2 2 0 0 1 2 2v12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      timer: '<circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 9v4l2.5 2M9 2h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      flame: '<path d="M12 22c4 0 7-2.8 7-6.8 0-3.6-2.4-5.6-3.8-8.2-.4 1.8-1.4 3-2.6 3.6.2-3.2-1.2-6.2-4.1-8.6.3 3.5-1.6 5.7-3.2 7.6C4 11.2 5 13.4 5 15.2 5 19.2 8 22 12 22z" fill="currentColor"/>',
      notes: '<path d="M5 3h10l4 4v14H5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 11h8M8 15h8M8 7h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      menu: '<path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      left: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
      right: '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
      close: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
      chevron: '<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
      moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
      gear: '<circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
      book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z M4 19V5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
      lock: '<rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    };
    return `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ''}</svg>`;
  }
  const I = (name, cls) => h('span', { class: 'icw' + (cls ? ' ' + cls : ''), html: icon(name) });

  /* Generated course artwork: gradient + hex lattice + orbit, unique per course color. */
  function courseArt(m, opts) {
    opts = opts || {};
    const W = opts.w || 400, H = opts.h || 225;
    const pal = { blue: ['#0b3d91', '#2f7bff', '#8ab4ff'], teal: ['#05525c', '#14a3b3', '#7fe3ec'], green: ['#0b4d2c', '#1f9d5b', '#86e0ad'], amber: ['#6b3a00', '#e08a00', '#ffd27a'], red: ['#6e1414', '#d64343', '#ffadad'] }[m.color] || ['#222a44', '#4f5f99', '#a9b4e8'];
    const id = 'g' + m.id + (opts.k || '');
    let hex = '';
    for (let r = 0; r <= Math.ceil(H / 45) + 1; r++) for (let c = 0; c <= Math.ceil(W / 52) + 1; c++) {
      const x = c * 52 + (r % 2 ? 26 : 0), y = r * 45;
      hex += `<path d="M${x} ${y - 26}l22.5 13v26L${x} ${y + 26}l-22.5-13v-26z" />`;
    }
    const sc = Math.min(1, W / 400, H / 200), cx = W - 100 * sc, cy = Math.min(80, H * 0.38);
    return `<svg class="art" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMinYMid slice" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pal[0]}"/><stop offset="1" stop-color="${pal[1]}"/></linearGradient>
      <radialGradient id="${id}r" cx="${(cx / W).toFixed(2)}" cy=".3" r=".6"><stop offset="0" stop-color="${pal[2]}" stop-opacity=".55"/><stop offset="1" stop-color="${pal[2]}" stop-opacity="0"/></radialGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#${id})"/><rect width="${W}" height="${H}" fill="url(#${id}r)"/>
      <g fill="none" stroke="#fff" stroke-opacity=".09" stroke-width="1.2">${hex}</g>
      <g transform="translate(${cx - 300 * sc} ${cy - 80 * sc}) scale(${sc})">
        <ellipse cx="300" cy="80" rx="120" ry="34" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.4" transform="rotate(-18 300 80)"/>
        <circle cx="300" cy="80" r="30" fill="#fff" fill-opacity=".14"/><circle cx="300" cy="80" r="18" fill="none" stroke="#fff" stroke-width="2.4" stroke-opacity=".9"/>
        <g stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-opacity=".9"><path d="M300 56v10M300 94v10M276 80h10M314 80h10M283 63l7 7M310 90l7 7M283 97l7-7M310 70l7-7"/></g>
        <circle cx="407" cy="44" r="5" fill="#fff" transform="rotate(-18 300 80)" opacity=".9"/>
      </g>
      <text x="26" y="${H - 39}" fill="#fff" font-family="Source Sans 3, system-ui, sans-serif" font-weight="800" font-size="${opts.fs || 54}" letter-spacing="1">${KS.esc(opts.title != null ? opts.title : m.short)}</text>
      <text x="28" y="${H - 17}" fill="#fff" fill-opacity=".8" font-family="Source Sans 3, system-ui, sans-serif" font-weight="600" font-size="13" letter-spacing="2.5">${KS.esc((opts.tag || 'KUBESTRONAUT PATH').toUpperCase())}</text>
    </svg>`;
  }

  /* ================================================================ progress model */
  // Items per chapter (Coursera-style): lesson slides → practice quiz → flashcards (optional).
  function chapterItems(e, c) {
    const st = S().chapter(e.id, c.id);
    const total = c.slides.length + 2;
    const seen = Math.min(st.viewed.length, total);
    return [
      { kind: 'learn', key: 'learn:' + c.id, ch: c, title: c.title, type: 'Lesson', meta: `${total} slides · ${c.minutes || Math.round(total * 2.3)} min`, href: `#/exam/${e.id}/learn/${c.id}/${(st.last || 0) + 1}`, done: !!st.completed, started: seen > 0, progress: pct(seen, total), required: true },
      { kind: 'quiz', key: 'quiz:' + c.id, ch: c, title: 'Practice quiz: ' + c.title, type: 'Practice quiz', meta: `${(c.quiz || []).length} questions`, href: `#/exam/${e.id}/quiz/${c.id}`, done: (st.quizBest || 0) >= e.mock.pass, started: st.quizBest != null, grade: st.quizBest, required: true },
      { kind: 'flash', key: 'flash:' + c.id, ch: c, title: 'Flashcards: ' + c.title, type: 'Flashcards', meta: `${(c.glossary || []).length} terms · optional`, href: `#/exam/${e.id}/flash/${c.id}`, done: !!st.flashDone, started: !!st.flashDone, required: false },
    ];
  }
  function mockItems(e) {
    const p = S().exam(e.id);
    return Array.from({ length: e.mock.sets }, (_, i) => {
      const key = String(i + 1), tries = p.attempts.filter((t) => t.key === key);
      const best = tries.length ? Math.max(...tries.map((t) => t.score)) : null;
      return { kind: 'mock', key: 'mock:' + key, mkey: key, title: 'Mock exam ' + key, type: 'Graded exam', meta: `${e.mock.questions} questions · ${e.mock.minutes} min`, href: `#/exam/${e.id}/mock/${key}`, done: best != null && best >= e.mock.pass, started: tries.length > 0 || (p.activeMock && p.activeMock.key === key), grade: best, required: true };
    });
  }
  function courseProgress(e) {
    const items = e.chapterList.flatMap((c) => chapterItems(e, c)).concat(mockItems(e)).filter((x) => x.required);
    const done = items.filter((x) => x.done).length;
    return { done, total: items.length, pct: pct(done, items.length) };
  }
  function orderedItems(e) { return e.chapterList.flatMap((c) => chapterItems(e, c)); }
  function nextItem(e) {
    const items = orderedItems(e);
    return items.find((x) => x.required && !x.done) || mockItems(e).find((x) => !x.done) || items[0];
  }
  function resumeTarget(e) {
    const lv = S().state.lastVisit;
    if (lv && lv.exam === e.id && lv.route) return { href: lv.route, label: lv.label };
    const n = nextItem(e);
    return { href: n.href, label: n.title };
  }
  function domainAccuracy(e) {
    const qs = S().exam(e.id).qstats, out = {};
    e.domains.forEach((d) => (out[d.id] = { seen: 0, correct: 0 }));
    Object.entries(qs).forEach(([id, s]) => { const q = e.questionIndex[id]; if (q && out[q.domain]) { out[q.domain].seen += s.seen; out[q.domain].correct += s.correct; } });
    return out;
  }

  /* ================================================================ shell */
  const LOGO = `<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0056d2"/><stop offset="1" stop-color="#6c5ce7"/></linearGradient></defs><path d="M32 3l25 12v34L32 61 7 49V15z" fill="url(#lg)"/><circle cx="32" cy="32" r="11" fill="none" stroke="#fff" stroke-width="3.4"/><g stroke="#fff" stroke-width="3.4" stroke-linecap="round"><path d="M32 13v8M32 43v8M13 32h8M43 32h8M18.6 18.6l5.7 5.7M39.7 39.7l5.7 5.7M18.6 45.4l5.7-5.7M39.7 24.3l5.7-5.7"/></g><circle cx="32" cy="32" r="3.6" fill="#fff"/></svg>`;

  function topbar(opts) {
    opts = opts || {};
    const streak = S().streak();
    return h('header', { class: 'topbar' + (opts.compact ? ' compact' : '') },
      opts.left || null,
      h('a', { class: 'brand', href: '#/', html: LOGO + '<span class="wordmark">kubestronaut<b>academy</b></span>' }),
      h('nav', { class: 'topnav' },
        h('a', { href: '#/', class: opts.nav === 'home' ? 'on' : '' }, 'Home'),
        h('a', { href: '#/exam/kcna', class: opts.nav === 'kcna' ? 'on' : '' }, 'KCNA course'),
        h('a', { href: '#/exam/kcna/intel', class: opts.nav === 'guide' ? 'on' : '' }, 'Exam guide')),
      h('div', { class: 'spacer' }),
      opts.right || null,
      h('span', { class: 'streak-pill' + (streak ? ' on' : ''), title: streak ? `${streak}-day streak` : 'Study today to start a streak' }, I('flame'), h('b', { text: streak })),
      h('button', { class: 'icon-btn', title: 'Light / dark', onclick: KS.toggleTheme, html: icon('moon') }),
      h('a', { class: 'icon-btn', title: 'Progress & backup', href: '#/data', html: icon('gear') }));
  }
  function shell(content, opts) {
    opts = opts || {};
    const root = app();
    root.innerHTML = '';
    root.appendChild(topbar(opts));
    root.appendChild(content);
    if (!opts.noFooter) root.appendChild(h('footer', { class: 'footer' },
      h('div', { html: LOGO + ' <b>kubestronaut academy</b>: personal prep for KCNA · KCSA · CKAD · CKA · CKS' }),
      h('div', { class: 'muted', html: 'Progress, notes and streaks are saved in this browser (local storage). <a href="#/data">Backup / restore</a>' })));
    return root;
  }
  KS.renderError = function (err) {
    console.error(err);
    shell(h('main', { class: 'page narrow' }, h('div', { class: 'empty' }, h('h2', { text: 'Something went wrong' }), h('p', { text: err && err.message ? err.message : String(err) }), h('a', { class: 'btn primary', href: '#/' }, 'Back home'))));
  };
  function bar(p, cls) { return h('div', { class: 'pbar ' + (cls || '') }, h('span', { style: { width: Math.max(0, Math.min(100, p)) + '%' } })); }
  function statusDot(item) {
    if (item.done) return h('span', { class: 'sdot done', html: icon('check'), title: 'Completed' });
    if (item.started) return h('span', { class: 'sdot half', title: 'In progress' });
    return h('span', { class: 'sdot', title: 'Not started' });
  }

  /* ================================================================ DASHBOARD */
  KS.route('/', function () {
    const avail = KS.order.map((id) => KS.exams[id]).filter((m) => m.available);
    // dashboard needs chapter data for available exams
    return Promise.all(avail.map((m) => getExam(m.id))).then((exams) => {
      const st = S().state;
      const streak = S().streak();
      const week = S().week();
      const activeDays = week.filter((d) => d.active).length;
      const weekMin = week.reduce((a, d) => a + ((d.data && d.data.min) || 0), 0);
      const totals = Object.values(st.activity || {}).reduce((a, d) => ({ answered: a.answered + (d.answered || 0), correct: a.correct + (d.correct || 0), min: a.min + (d.min || 0) }), { answered: 0, correct: 0, min: 0 });
      const hour = new Date().getHours();
      const greet = hour < 5 ? 'Burning the midnight oil' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

      const learning = exams.map((e) => {
        const cp = courseProgress(e), rt = resumeTarget(e), nx = nextItem(e);
        return h('article', { class: 'continue-card' },
          h('a', { class: 'cc-art', href: '#/exam/' + e.id, html: courseArt(e, { w: 280, h: 220, fs: 48 }) }),
          h('div', { class: 'cc-body' },
            h('div', { class: 'eyebrow', text: 'Course 1 of 5 · Kubestronaut path' }),
            h('h3', null, h('a', { href: '#/exam/' + e.id, text: e.title })),
            h('div', { class: 'cc-next', html: `<span class="muted">${cp.done ? 'Up next' : 'Start with'}:</span> <b>${KS.esc(nx.title)}</b> <span class="muted">· ${KS.esc(nx.type)}</span>` }),
            h('div', { class: 'cc-prog' }, bar(cp.pct), h('span', { text: cp.pct + '% complete' })),
            h('div', { class: 'row' },
              h('a', { class: 'btn primary', href: rt.href }, cp.done || S().state.lastVisit ? 'Resume' : 'Start learning'),
              h('a', { class: 'btn ghost', href: '#/exam/' + e.id }, 'Course home'),
              S().exam(e.id).activeMock ? h('a', { class: 'btn warn', href: `#/exam/${e.id}/mock/${S().exam(e.id).activeMock.key}` }, I('timer'), 'Mock exam in progress') : null)));
      });

      const path = h('ol', { class: 'path' }, KS.order.map((id, i) => {
        const m = KS.exams[id];
        const e = exams.find((x) => x.id === id);
        const cp = e ? courseProgress(e) : null;
        return h('li', { class: 'path-step' + (m.available ? ' avail' : '') + (cp && cp.pct === 100 ? ' done' : '') },
          h('div', { class: 'ps-node', html: cp && cp.pct === 100 ? icon('check') : String(i + 1) }),
          h(m.available ? 'a' : 'div', { class: 'ps-card', href: m.available ? '#/exam/' + id : null },
            h('div', { class: 'ps-thumb', html: courseArt(m, { k: 'p', w: 184, h: 104, fs: 30, tag: ' ' }) }),
            h('div', { class: 'ps-info' },
              h('b', { text: m.short }), h('span', { class: 'muted small', text: m.title }),
              m.available ? h('div', { class: 'ps-prog' }, bar(cp.pct), h('span', { class: 'small', text: cp.pct + '%' })) : h('span', { class: 'tag', html: icon('lock') + ' Coming soon' }))));
      }));

      const events = (st.events || []).slice(0, 8);
      const feed = events.length ? h('ul', { class: 'feed' }, events.map((ev) => h('li', null, h('span', { class: 'feed-ic', text: ev.icon }), h('span', { class: 'feed-tx', html: ev.text }), h('span', { class: 'muted small', text: ago(ev.t) })))) : h('p', { class: 'muted', text: 'Your completed lessons, quiz scores and mock results will show up here.' });

      const goalSel = h('select', { class: 'select', onchange: (ev) => { S().goal = +ev.target.value; KS.dispatch(); } },
        [1, 2, 3, 4, 5, 6, 7].map((n) => h('option', { value: n, selected: n === S().goal ? true : null }, n + (n === 1 ? ' day' : ' days'))));
      const goal = h('section', { class: 'card side-card' },
        h('div', { class: 'card-head' }, h('h3', { text: 'Weekly goal' }), goalSel),
        h('div', { class: 'week' }, week.map((d) => h('div', { class: 'wday' + (d.active ? ' on' : '') + (d.today ? ' today' : '') + (d.future ? ' future' : ''), title: d.key },
          h('span', { class: 'wcircle', html: d.active ? icon('check') : '' }), h('span', { class: 'wlbl', text: d.label })))),
        h('p', { class: 'goal-txt', html: activeDays >= S().goal ? `🎉 Goal reached: <b>${activeDays}</b> study days this week.` : `<b>${activeDays}</b> of <b>${S().goal}</b> study days this week. ${streak ? `🔥 ${streak}-day streak.` : 'Study today to start a streak.'}` }));

      const stats = h('section', { class: 'card side-card' },
        h('h3', { text: 'Your learning' }),
        h('div', { class: 'stat-grid' },
          h('div', null, h('b', { text: weekMin + 'm' }), h('span', { text: 'studied this week' })),
          h('div', null, h('b', { text: Math.round(totals.min / 6) / 10 + 'h' }), h('span', { text: 'studied in total' })),
          h('div', null, h('b', { text: totals.answered }), h('span', { text: 'questions answered' })),
          h('div', null, h('b', { text: totals.answered ? pct(totals.correct, totals.answered) + '%' : '–' }), h('span', { text: 'answer accuracy' }))));

      const ready = exams.map((e) => {
        const acc = domainAccuracy(e);
        return h('section', { class: 'card side-card' },
          h('div', { class: 'card-head' }, h('h3', { text: e.short + ' readiness' }), h('a', { class: 'small', href: `#/exam/${e.id}/grades` }, 'Grades →')),
          e.domains.map((d) => { const a = acc[d.id], p = pct(a.correct, a.seen); return h('div', { class: 'ready-row' }, h('div', { class: 'row-between small' }, h('span', { text: d.name }), h('b', { text: a.seen ? p + '%' : '–' })), bar(a.seen ? p : 0, a.seen ? (p >= e.mock.pass ? 'ok' : 'warn') : '')); }),
          h('p', { class: 'muted small', text: 'Accuracy per exam domain across every question you have answered. Aim for 85%+ in each.' }));
      });

      shell(h('main', { class: 'page' },
        h('section', { class: 'dash-hero' },
          h('div', null, h('div', { class: 'eyebrow', text: new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) }),
            h('h1', { text: greet + ', future Kubestronaut' }),
            h('p', { class: 'lead', html: streak ? `You’re on a <b>${streak}-day streak</b>. Keep it alive with one lesson or a quick quiz today.` : 'Pick up where you left off. One lesson or a short quiz a day adds up fast.' })),
          h('div', { class: 'hero-orbit', html: '<span></span><span></span><span></span>' })),
        h('div', { class: 'dash-grid' },
          h('div', { class: 'dash-main' },
            h('h2', { class: 'sec-title', text: 'Continue learning' }), learning,
            h('h2', { class: 'sec-title', text: 'Your Kubestronaut path' }), h('p', { class: 'muted sec-sub', text: 'Hold all five certifications at the same time to earn the Kubestronaut title.' }), path,
            h('h2', { class: 'sec-title', text: 'Recent activity' }), h('section', { class: 'card' }, feed)),
          h('aside', { class: 'dash-side' }, goal, stats, ready))), { nav: 'home' });
    });
  });

  /* ================================================================ COURSE PAGE */
  const TABS = [['', 'Course material'], ['grades', 'Grades'], ['notes', 'Notes'], ['intel', 'Exam guide'], ['library', 'Resources']];
  function coursePage(e, tab, body) {
    const cp = courseProgress(e), rt = resumeTarget(e);
    const lessons = e.chapterList.length, qcount = allQuestions(e).length;
    const hours = Math.round(e.chapterList.reduce((a, c) => a + (c.minutes || 25) + 10, 0) / 60);
    const hero = h('section', { class: 'course-hero' },
      h('div', { class: 'ch-inner' },
        h('div', { class: 'ch-text' },
          h('div', { class: 'crumbs', html: '<a href="#/">Home</a> <span>›</span> <span>Kubestronaut path</span> <span>›</span> <span>' + KS.esc(e.short) + '</span>' }),
          h('h1', { text: e.title }),
          h('p', { class: 'lead', html: e.tagline || '' }),
          h('div', { class: 'meta-row' },
            h('span', { html: icon('book') + ` ${lessons} lessons` }),
            h('span', { html: icon('quiz') + ` ${qcount} practice questions` }),
            h('span', { html: icon('timer') + ` ~${hours} hours` }),
            h('span', { html: icon('trophy') + ` Pass mark ${e.mock.pass}%` }))),
        h('div', { class: 'ch-card' },
          h('div', { class: 'ch-art', html: courseArt(e, { k: 'h', w: 340, h: 150, tag: 'Course 1 of 5', fs: 46 }) }),
          h('div', { class: 'ch-prog' },
            h('div', { class: 'ring sm', html: KS.ring(cp.pct, 'var(--accent)', 76) + `<div class="rv"><b>${cp.pct}%</b></div>` }),
            h('div', null, h('b', { text: cp.pct === 100 ? 'Course complete 🎉' : cp.pct ? 'Keep going!' : 'Ready when you are' }), h('div', { class: 'muted small', text: `${cp.done} of ${cp.total} required items done` }))),
          h('a', { class: 'btn primary block', href: rt.href }, cp.done || S().state.lastVisit ? 'Resume learning' : 'Start learning'),
          h('div', { class: 'muted small center', text: 'Next: ' + rt.label }))));
    const tabs = h('nav', { class: 'tabs' }, h('div', { class: 'tabs-inner' }, TABS.map(([k, l]) => h('a', { class: k === tab ? 'on' : '', href: '#/exam/' + e.id + (k ? '/' + k : '') }, l))));
    shell(h('main', null, hero, tabs, h('div', { class: 'page course-body' }, body)), { nav: 'kcna' });
  }

  /* ---- Course material (syllabus) ---- */
  KS.route('/exam/:id', ({ id }) => getExam(id).then((e) => {
    const ui = (S().state.ui = S().state.ui || {});
    ui.collapsed = ui.collapsed || {};
    const modules = e.domains.map((d, i) => ({ d, num: i + 1, chapters: e.chapterList.filter((c) => c.domain === d.id) }));
    const final = { num: modules.length + 1 };

    const side = h('aside', { class: 'syl-side' },
      h('div', { class: 'syl-side-inner' },
        h('h4', { text: 'Modules' }),
        modules.map((m) => {
          const its = m.chapters.flatMap((c) => chapterItems(e, c)).filter((x) => x.required);
          const dn = its.filter((x) => x.done).length;
          return h('a', { class: 'syl-nav', href: '#mod-' + m.num, onclick: (ev) => { ev.preventDefault(); document.getElementById('mod-' + m.num).scrollIntoView({ behavior: 'smooth', block: 'start' }); } },
            h('span', { class: 'mn', style: { background: KS.color(m.d.color) }, text: m.num }),
            h('span', { class: 'mt' }, h('b', { text: m.d.name }), h('span', { class: 'muted small', text: `${dn}/${its.length} done · ${m.d.weight}% of exam` })));
        }),
        h('a', { class: 'syl-nav', href: '#mod-final', onclick: (ev) => { ev.preventDefault(); document.getElementById('mod-final').scrollIntoView({ behavior: 'smooth', block: 'start' }); } },
          h('span', { class: 'mn', style: { background: 'var(--text)' }, html: icon('trophy') }),
          h('span', { class: 'mt' }, h('b', { text: 'Final assessment' }), h('span', { class: 'muted small', text: `${mockItems(e).filter((x) => x.done).length}/${e.mock.sets} mocks passed` }))),
        h('div', { class: 'blueprint' }, h('h4', { text: 'Exam blueprint' }), h('div', { class: 'bp-bar' }, e.domains.map((d) => h('span', { style: { width: d.weight + '%', background: KS.color(d.color) }, title: `${d.name}: ${d.weight}%` }))),
          e.domains.map((d) => h('div', { class: 'bp-row small' }, h('i', { style: { background: KS.color(d.color) } }), h('span', { text: d.name }), h('b', { text: d.weight + '%' }))))));

    function itemRow(it) {
      const ic = { learn: 'slides', quiz: 'quiz', flash: 'cards', mock: 'timer' }[it.kind];
      const action = it.done ? 'Review' : it.started ? 'Resume' : 'Start';
      return h('a', { class: 'item-row' + (it.done ? ' done' : ''), href: it.href },
        statusDot(it),
        h('span', { class: 'it-ic ' + it.kind, html: icon(ic) }),
        h('span', { class: 'it-main' }, h('span', { class: 'it-title', text: it.title }), h('span', { class: 'it-meta', text: `${it.type} · ${it.meta}` })),
        it.grade != null ? h('span', { class: 'grade ' + (it.grade >= e.mock.pass ? 'ok' : 'bad'), text: it.grade + '%' }) : it.kind === 'learn' && it.progress && !it.done ? h('span', { class: 'grade', text: it.progress + '%' }) : null,
        h('span', { class: 'it-act', text: action }));
    }
    function moduleCard(m) {
      const its = m.chapters.flatMap((c) => chapterItems(e, c));
      const req = its.filter((x) => x.required), dn = req.filter((x) => x.done).length;
      const key = 'm' + m.num, collapsed = !!ui.collapsed[key];
      const mins = m.chapters.reduce((a, c) => a + (c.minutes || 25) + 10, 0);
      const body = h('div', { class: 'mod-body' }, m.chapters.map((c) => h('div', { class: 'lesson' },
        h('div', { class: 'lesson-head' }, h('span', { class: 'lesson-ic', text: c.icon || '📘' }), h('div', null, h('div', { class: 'eyebrow', text: 'Lesson ' + c.num }), h('h4', { text: c.title }), h('p', { class: 'muted small', html: c.subtitle || '' }))),
        h('div', { class: 'items' }, chapterItems(e, c).map(itemRow)))));
      const card = h('section', { class: 'module' + (collapsed ? ' collapsed' : ''), id: 'mod-' + m.num },
        h('button', { class: 'mod-head', onclick: () => { ui.collapsed[key] = !ui.collapsed[key]; S().save(); card.classList.toggle('collapsed'); } },
          h('div', { class: 'mod-num', style: { '--mc': KS.color(m.d.color) } }, h('span', { text: 'MODULE' }), h('b', { text: m.num })),
          h('div', { class: 'mod-title' }, h('h3', { text: m.d.name }),
            h('div', { class: 'muted small', text: `${m.chapters.length} lessons · ${m.chapters.reduce((a, c) => a + (c.quiz || []).length, 0)} quiz questions · ~${Math.round(mins / 6) / 10} h · ${m.d.weight}% of the exam` }),
            h('div', { class: 'mod-prog' }, bar(pct(dn, req.length), dn === req.length ? 'ok' : ''), h('span', { class: 'small', text: `${dn}/${req.length}` }))),
          h('span', { class: 'chev', html: icon('chevron') })),
        h('div', { class: 'mod-topics' }, (m.d.topics || []).map((t) => h('span', { class: 'topic', text: t }))),
        body);
      return card;
    }
    const finalCard = h('section', { class: 'module final', id: 'mod-final' },
      h('div', { class: 'mod-head static' },
        h('div', { class: 'mod-num', style: { '--mc': 'var(--text)' } }, h('span', { text: 'MODULE' }), h('b', { text: final.num })),
        h('div', { class: 'mod-title' }, h('h3', { text: 'Final assessment' }), h('div', { class: 'muted small', text: `Timed mock exams under real conditions: ${e.mock.questions} questions in ${e.mock.minutes} minutes, weighted like the official blueprint.` }))),
      h('div', { class: 'mod-body' },
        h('div', { class: 'items' }, mockItems(e).map(itemRow),
          itemRow({ kind: 'mock', title: 'Random mock exam', type: 'Ungraded exam', meta: 'fresh questions every time', href: `#/exam/${e.id}/mock/random`, done: false, started: false }),
          itemRow({ kind: 'quiz', title: 'Weak-area drill', type: 'Practice', meta: '20 questions you missed or have not seen', href: `#/exam/${e.id}/drill`, done: false, started: false })),
        h('div', { class: 'drills' }, h('span', { class: 'muted small', text: 'Domain drills:' }), e.domains.map((d) => h('a', { class: 'chip-link', href: `#/exam/${e.id}/practice/${d.id}`, style: { '--cc': KS.color(d.color) }, text: d.name })))));

    coursePage(e, '', h('div', { class: 'syllabus' }, side, h('div', { class: 'syl-main' },
      h('div', { class: 'syl-intro card' }, h('div', null, h('h2', { text: 'Course material' }), h('p', { class: 'muted', html: `Work through each lesson’s slides, then pass its practice quiz (${e.mock.pass}%+) to complete it. Flashcards are optional. Finish with the graded mock exams in Module ${final.num}.` })),
        h('div', { class: 'legend-items small' }, h('span', null, statusDot({ done: true }), 'Completed'), h('span', null, statusDot({ started: true }), 'In progress'), h('span', null, statusDot({}), 'Not started'))),
      modules.map(moduleCard), finalCard)));
  }));

  /* ---- Grades ---- */
  KS.route('/exam/:id/grades', ({ id }) => getExam(id).then((e) => {
    const quizzes = e.chapterList.map((c) => { const st = S().chapter(id, c.id); return { c, best: st.quizBest, tries: (st.quizHistory || []).length || st.quizAttempts || 0, hist: st.quizHistory || [] }; });
    const mocks = mockItems(e), p = S().exam(id);
    const passedQ = quizzes.filter((x) => (x.best || 0) >= e.mock.pass).length;
    const bestMock = p.attempts.reduce((a, t) => Math.max(a, t.score), 0);
    const acc = domainAccuracy(e);
    const status = (best) => best == null ? h('span', { class: 'status none', text: 'Not started' }) : best >= e.mock.pass ? h('span', { class: 'status ok', html: icon('check') + 'Passed' }) : h('span', { class: 'status bad', text: 'Try again' });
    const spark = (hist) => { if (!hist.length) return null; const pts = hist.slice(-8); return h('span', { class: 'spark', html: `<svg viewBox="0 0 ${pts.length * 10} 24">${pts.map((v, i) => `<rect x="${i * 10 + 1}" y="${24 - (v.score * 0.24)}" width="7" height="${Math.max(2, v.score * 0.24)}" rx="1.5" fill="${v.score >= e.mock.pass ? 'var(--ok)' : 'var(--warn)'}"/>`).join('')}</svg>` }); };
    coursePage(e, 'grades', h('div', { class: 'narrowish' },
      h('div', { class: 'grade-summary' },
        h('div', { class: 'card gs' }, h('span', { class: 'muted small', text: 'Practice quizzes passed' }), h('b', { text: `${passedQ} / ${quizzes.length}` }), bar(pct(passedQ, quizzes.length), 'ok')),
        h('div', { class: 'card gs' }, h('span', { class: 'muted small', text: 'Best mock exam' }), h('b', { text: bestMock ? bestMock + '%' : '–', style: { color: bestMock >= e.mock.pass ? 'var(--ok)' : '' } }), h('span', { class: 'muted small', text: `${p.attempts.length} attempt${p.attempts.length === 1 ? '' : 's'} · pass ${e.mock.pass}%` })),
        h('div', { class: 'card gs' }, h('span', { class: 'muted small', text: 'Course progress' }), h('b', { text: courseProgress(e).pct + '%' }), bar(courseProgress(e).pct))),
      h('h2', { class: 'sec-title', text: 'Graded exams' }),
      h('div', { class: 'card table-card' }, h('table', { class: 'gtable' },
        h('thead', null, h('tr', null, ['Item', 'Status', 'Attempts', 'Best grade', ''].map((x) => h('th', { text: x })))),
        h('tbody', null, mocks.map((m) => { const tries = p.attempts.filter((t) => t.key === m.mkey); const last = tries[tries.length - 1];
          return h('tr', null, h('td', null, h('b', { text: m.title }), h('div', { class: 'muted small', text: m.meta })), h('td', null, status(m.grade)), h('td', { text: tries.length }), h('td', null, m.grade != null ? h('b', { text: m.grade + '%' }) : '–'),
            h('td', { class: 'right' }, last ? h('a', { class: 'btn sm ghost', href: `#/exam/${id}/results/${last.id}` }, 'Review') : null, h('a', { class: 'btn sm', href: m.href }, tries.length ? 'Retake' : 'Start'))); })))),
      h('h2', { class: 'sec-title', text: 'Practice quizzes' }),
      h('div', { class: 'card table-card' }, h('table', { class: 'gtable' },
        h('thead', null, h('tr', null, ['Lesson', 'Status', 'History', 'Best grade', ''].map((x) => h('th', { text: x })))),
        h('tbody', null, quizzes.map((x) => h('tr', null,
          h('td', null, h('span', { class: 'dotc', style: { background: dcolor(e, x.c.domain) } }), h('b', { text: `${x.c.num}. ${x.c.title}` })),
          h('td', null, status(x.best)), h('td', null, spark(x.hist) || h('span', { class: 'muted', text: '–' })),
          h('td', null, x.best != null ? h('b', { text: x.best + '%' }) : '–'),
          h('td', { class: 'right' }, h('a', { class: 'btn sm', href: `#/exam/${id}/quiz/${x.c.id}` }, x.best != null ? 'Retake' : 'Start'))))))),
      h('h2', { class: 'sec-title', text: 'Mastery by exam domain' }),
      h('div', { class: 'card' }, e.domains.map((d) => { const a = acc[d.id], v = pct(a.correct, a.seen);
        return h('div', { class: 'dom-row' }, h('span', { html: `<i class="dotc" style="background:${KS.color(d.color)}"></i>${d.name} <span class="muted small">${d.weight}%</span>` }), bar(a.seen ? v : 0, a.seen ? (v >= e.mock.pass ? 'ok' : 'warn') : ''), h('b', { text: a.seen ? `${v}%` : '–' }), h('a', { class: 'small', href: `#/exam/${id}/practice/${d.id}` }, 'Drill')); }))));
  }));

  /* ---- Notes ---- */
  KS.route('/exam/:id/notes', ({ id }) => getExam(id).then((e) => {
    const notes = S().notes(id);
    const withNotes = e.chapterList.filter((c) => (notes[c.id] || '').trim());
    const exportMd = () => {
      const md = `# ${e.short} notes\n\n` + withNotes.map((c) => `## ${c.num}. ${c.title}\n\n${notes[c.id].trim()}\n`).join('\n');
      const a = h('a', { href: URL.createObjectURL(new Blob([md], { type: 'text/markdown' })), download: `${id}-notes.md` }); a.click();
    };
    coursePage(e, 'notes', h('div', { class: 'narrowish' },
      h('div', { class: 'row-between' }, h('div', null, h('h2', { class: 'sec-title', style: { marginTop: 0 }, text: 'My notes' }), h('p', { class: 'muted', text: 'Notes you take in the lesson player are saved in this browser and collected here.' })),
        withNotes.length ? h('button', { class: 'btn', onclick: exportMd }, '⬇ Export as Markdown') : null),
      withNotes.length ? withNotes.map((c) => {
        const ta = h('textarea', { class: 'note-ta', rows: 6 }); ta.value = notes[c.id];
        const saved = h('span', { class: 'muted small', text: 'Saved locally' });
        let tmr; ta.addEventListener('input', () => { clearTimeout(tmr); saved.textContent = 'Saving…'; tmr = setTimeout(() => { notes[c.id] = ta.value; S().save(); saved.textContent = 'Saved locally'; }, 400); });
        return h('section', { class: 'card note-card' }, h('div', { class: 'row-between' }, h('h3', { text: `${c.icon || ''} ${c.num}. ${c.title}` }), h('a', { class: 'btn sm ghost', href: `#/exam/${id}/learn/${c.id}` }, 'Open lesson')), ta, saved);
      }) : h('div', { class: 'card empty' }, h('div', { class: 'big', html: icon('notes') }), h('h3', { text: 'No notes yet' }), h('p', { class: 'muted', text: 'Open any lesson and press the Notes button in the player to start writing.' }), h('a', { class: 'btn primary', href: resumeTarget(e).href }, 'Go to my lesson'))));
  }));

  /* ---- Exam guide ---- */
  KS.route('/exam/:id/intel', ({ id }) => getExam(id).then((e) => {
    const intel = e.intel || { sections: [] };
    coursePage(e, 'intel', h('div', { class: 'narrowish guide' },
      intel.intro ? h('p', { class: 'lead', html: intel.intro }) : null,
      intel.sections.map((s) => h('section', { class: 'card guide-sec' }, h('h2', { html: (s.icon ? s.icon + ' ' : '') + s.title }), KS.renderBlocks(s.blocks, { steppers: [] })))));
  }));

  /* ---- Resources ---- */
  KS.route('/exam/:id/library', ({ id }) => getExam(id).then((e) => {
    const items = e.library || [];
    const groups = {};
    items.forEach((it, i) => (groups[it.group || 'Resources'] = groups[it.group || 'Resources'] || []).push([it, i]));
    coursePage(e, 'library', h('div', null,
      h('div', { class: 'res-top' },
        h('a', { class: 'card res-feature', href: `#/exam/${id}/flash/all` }, h('span', { class: 'rf-ic', html: icon('cards') }), h('div', null, h('h3', { text: 'All flashcards' }), h('p', { class: 'muted small', text: e.chapterList.reduce((a, c) => a + (c.glossary || []).length, 0) + ' key terms, spaced by what you still don’t know.' }))),
        h('a', { class: 'card res-feature', href: `#/exam/${id}/cheatsheet` }, h('span', { class: 'rf-ic', html: icon('notes') }), h('div', null, h('h3', { text: 'Cheat sheet' }), h('p', { class: 'muted small', text: 'Every lesson recap on one printable page.' }))),
        h('a', { class: 'card res-feature', href: `#/exam/${id}/drill` }, h('span', { class: 'rf-ic', html: icon('quiz') }), h('div', null, h('h3', { text: 'Weak-area drill' }), h('p', { class: 'muted small', text: 'Questions you missed come back first.' })))),
      Object.entries(groups).map(([g, list]) => h('section', null, h('h2', { class: 'sec-title', text: g }), h('div', { class: 'grid g3' }, list.map(([it, i]) => {
        const local = it.kind === 'page' || it.kind === 'route';
        return h('a', { class: 'card res-card', href: it.kind === 'route' ? it.url : local ? `#/exam/${id}/lib/${i}` : it.url, target: local ? null : '_blank', rel: local ? null : 'noopener' },
          h('div', { class: 'res-ic', text: it.icon || '🔗' }), h('h3', { text: it.title }), it.note ? h('p', { class: 'muted small', html: it.note }) : null,
          h('span', { class: 'tag', text: local ? 'Opens here' : 'External ↗' }));
      })))),
      h('p', { class: 'muted small', html: 'Add your own Claude artifacts: save the HTML into <code>exams/' + id + '/library/</code> and list it in <code>exams/' + id + '/exam.js</code>.' })));
  }));

  /* ================================================================ PLAYER (lesson · quiz · flashcards) */
  function player(e, ch, kind, opts) {
    KS.studying = true; KS.onLeave(() => (KS.studying = false));
    const d = e.domainById[ch.domain] || {};
    const modChapters = e.chapterList.filter((c) => c.domain === ch.domain);
    const modNum = e.domains.indexOf(d) + 1;
    const all = orderedItems(e);
    const idx = all.findIndex((x) => x.ch === ch && x.kind === kind);
    const prevIt = all[idx - 1], nextIt = all[idx + 1];
    const label = { learn: 'Lesson', quiz: 'Practice quiz', flash: 'Flashcards' }[kind];
    S().setLast({ exam: e.id, route: location.hash, label: `${ch.title}: ${label}` });

    const ui = (S().state.ui = S().state.ui || {});
    const root = app();
    root.innerHTML = '';
    const sideList = h('div', { class: 'pl-outline' }, modChapters.map((c) => h('div', { class: 'pl-group' + (c === ch ? ' current' : '') },
      h('div', { class: 'pl-gtitle' }, h('span', { text: c.icon || '📘' }), h('span', { text: `${c.num}. ${c.title}` })),
      chapterItems(e, c).map((it) => h('a', { class: 'pl-item' + (it.ch === ch && it.kind === kind ? ' on' : '') + (it.done ? ' done' : ''), href: it.href },
        statusDot(it), h('span', { class: 'pl-it' }, h('span', { text: it.kind === 'learn' ? 'Slides' : it.type }), h('span', { class: 'muted small', text: it.meta })))))));
    const mp = (() => { const its = modChapters.flatMap((c) => chapterItems(e, c)).filter((x) => x.required); const dn = its.filter((x) => x.done).length; return { dn, n: its.length }; })();
    const side = h('aside', { class: 'pl-side' },
      h('a', { class: 'pl-course', href: '#/exam/' + e.id }, I('left'), h('span', { text: e.title })),
      h('div', { class: 'pl-mod' }, h('div', { class: 'eyebrow', style: { color: KS.color(d.color) }, text: 'Module ' + modNum }), h('h3', { text: d.name }),
        h('div', { class: 'mod-prog' }, bar(pct(mp.dn, mp.n), mp.dn === mp.n ? 'ok' : ''), h('span', { class: 'small', text: `${mp.dn}/${mp.n}` }))),
      sideList);
    if (ui.sideClosed || window.innerWidth < 860) side.classList.add('closed');

    // notes drawer (per lesson, autosaved to localStorage)
    const notes = S().notes(e.id);
    const ta = h('textarea', { class: 'note-ta', placeholder: 'Write what you want to remember from this lesson…' });
    ta.value = notes[ch.id] || '';
    const saved = h('span', { class: 'muted small', text: notes[ch.id] ? 'Saved locally' : 'Autosaves in this browser' });
    let tmr;
    ta.addEventListener('input', () => { clearTimeout(tmr); saved.textContent = 'Saving…'; tmr = setTimeout(() => { notes[ch.id] = ta.value; S().save(); saved.textContent = 'Saved locally · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }, 400); });
    ta.addEventListener('keydown', (ev) => ev.stopPropagation());
    const drawer = h('aside', { class: 'pl-notes' + (ui.notesOpen ? ' open' : '') },
      h('div', { class: 'row-between' }, h('h3', { html: icon('notes') + ' My notes' }), h('button', { class: 'icon-btn', onclick: () => toggleNotes(), html: icon('close') })),
      h('p', { class: 'muted small', text: `${ch.num}. ${ch.title}` }),
      opts.insertRef ? h('button', { class: 'btn sm ghost', onclick: () => { const r = opts.insertRef(); const pos = ta.selectionStart || ta.value.length; ta.value = ta.value.slice(0, pos) + r + ta.value.slice(pos); ta.dispatchEvent(new Event('input')); ta.focus(); } }, '+ Reference this slide') : null,
      ta, saved, h('a', { class: 'small', href: `#/exam/${e.id}/notes` }, 'All notes →'));
    function toggleNotes() { ui.notesOpen = !drawer.classList.contains('open'); drawer.classList.toggle('open', ui.notesOpen); S().save(); }

    const main = h('section', { class: 'pl-main' });
    const head = h('div', { class: 'pl-head' },
      h('button', { class: 'icon-btn', title: 'Toggle outline', onclick: () => { side.classList.toggle('closed'); ui.sideClosed = side.classList.contains('closed'); S().save(); }, html: icon('menu') }),
      h('div', { class: 'pl-crumbs', html: `<span class="muted">Module ${modNum}</span> <span class="muted">›</span> <span class="muted">${KS.esc(ch.title)}</span> <span class="muted">›</span> <b>${label}</b>` }),
      h('div', { class: 'spacer' }),
      opts.headRight || null,
      h('button', { class: 'btn sm ghost', onclick: toggleNotes, html: icon('notes') + ' Notes' }),
      prevIt ? h('a', { class: 'icon-btn', href: prevIt.href, title: 'Previous item: ' + prevIt.title, html: icon('left') }) : null,
      nextIt ? h('a', { class: 'icon-btn', href: nextIt.href, title: 'Next item: ' + nextIt.title, html: icon('right') }) : null);
    const body = h('div', { class: 'pl-body' });
    main.appendChild(head); main.appendChild(body);
    root.appendChild(topbar({ compact: true, nav: 'kcna' }));
    root.appendChild(h('div', { class: 'player' }, side, main, drawer));
    return { body, head, nextIt, prevIt, label, d };
  }
  function nextItemBar(e, cur, nextIt, doneText) {
    return h('div', { class: 'next-bar' },
      h('div', { class: 'nb-left' }, h('span', { class: 'sdot done', html: icon('check') }), h('div', null, h('b', { text: doneText || 'Item completed' }), h('div', { class: 'muted small', text: 'Your progress is saved in this browser.' }))),
      nextIt ? h('a', { class: 'btn primary', href: nextIt.href }, 'Go to next item', I('right')) : h('a', { class: 'btn primary', href: `#/exam/${e.id}/mock/1` }, 'Take Mock exam 1', I('right')));
  }

  /* ---- Lesson (slides) ---- */
  KS.route('/exam/:id/learn/:ch', (p) => lesson(p.id, p.ch, 0));
  KS.route('/exam/:id/learn/:ch/:n', (p) => lesson(p.id, p.ch, parseInt(p.n, 10) - 1 || 0));
  function lesson(id, chId, start) {
    return getExam(id).then((e) => {
      const c = e.chapterList.find((x) => x.id === chId);
      if (!c) throw new Error('Lesson not found: ' + chId);
      const slides = [{ _cover: true }].concat(c.slides, [{ _end: true }]);
      const st = S().chapter(id, c.id);
      let i = Math.max(0, Math.min(start, slides.length - 1));
      let ctx = { steppers: [] };
      const counter = h('span', { class: 'muted small' });
      const pl = player(e, c, 'learn', { headRight: counter, insertRef: () => `\n[Slide ${i + 1}: ${(slides[i].title || (slides[i]._cover ? 'Intro' : 'Recap')).replace(/<[^>]+>/g, '')}] ` });
      const prog = h('span');
      const stage = h('div', { class: 'stage' });
      const dots = h('div', { class: 'dots' });
      const prevBtn = h('button', { class: 'btn', onclick: () => go(i - 1) }, I('left'), 'Previous');
      const nextBtn = h('button', { class: 'btn primary', onclick: () => next() });
      pl.body.appendChild(h('div', { class: 'deck-progress' }, prog));
      pl.body.appendChild(stage);
      pl.body.appendChild(h('div', { class: 'deck-foot' }, prevBtn, dots, nextBtn));

      function next() { const s = ctx.steppers.find((x) => x.pending()); if (s) return s.next(); if (i < slides.length - 1) go(i + 1); else if (pl.nextIt) location.hash = pl.nextIt.href; }
      function go(n) {
        if (n < 0 || n >= slides.length) return;
        KS.cleanup.splice(0).forEach((fn) => { try { fn(); } catch (_) {} });
        KS.studying = true; KS.onLeave(() => (KS.studying = false));
        document.addEventListener('keydown', onKey); KS.onLeave(() => document.removeEventListener('keydown', onKey));
        i = n; render();
        history.replaceState(null, '', `#/exam/${id}/learn/${c.id}/${i + 1}`);
        S().setLast({ exam: id, route: location.hash, label: `${c.title}: Lesson (slide ${i + 1})` });
      }
      function render() {
        ctx = { steppers: [] };
        stage.innerHTML = '';
        stage.appendChild(renderSlide(e, c, slides[i], ctx, pl));
        pl.body.scrollTop = 0;
        if (!st.viewed.includes(i)) { st.viewed.push(i); S().touch({ slides: 1 }); }
        if (i === slides.length - 1 && !st.completed) { st.completed = true; S().event(id, `Completed lesson <b>${KS.esc(c.title)}</b>`, '📘'); }
        st.last = i; S().save();
        prog.style.width = ((i + 1) / slides.length) * 100 + '%';
        counter.textContent = `Slide ${i + 1} of ${slides.length}`;
        prevBtn.disabled = i === 0;
        nextBtn.innerHTML = i === slides.length - 1 ? (pl.nextIt ? 'Next item ' + icon('right') : 'Done') : 'Next ' + icon('right');
        dots.innerHTML = '';
        slides.forEach((_, j) => dots.appendChild(h('button', { class: (j === i ? 'cur ' : '') + (st.viewed.includes(j) ? 'seen' : ''), title: 'Slide ' + (j + 1), onclick: () => go(j) })));
      }
      function onKey(ev) {
        if (/input|textarea|select/i.test((ev.target || {}).tagName)) return;
        if (ev.key === 'ArrowRight' || ev.key === 'PageDown' || ev.key === ' ') { ev.preventDefault(); next(); }
        else if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') { ev.preventDefault(); go(i - 1); }
      }
      let tx = null;
      stage.addEventListener('touchstart', (ev) => { tx = ev.touches[0].clientX; }, { passive: true });
      stage.addEventListener('touchend', (ev) => { if (tx == null) return; const dx = ev.changedTouches[0].clientX - tx; if (Math.abs(dx) > 70) (dx < 0 ? next() : go(i - 1)); tx = null; });
      document.addEventListener('keydown', onKey);
      KS.onLeave(() => document.removeEventListener('keydown', onKey));
      render();
    });
  }
  function renderSlide(e, c, s, ctx, pl) {
    if (s._cover) {
      const d = e.domainById[c.domain] || {};
      return h('article', { class: 'slide cover' },
        h('div', { class: 'cover-art', html: courseArt(e, { k: 'c' + c.num, w: 1100, h: 200, tag: `${e.short} · Lesson ${c.num}`, title: '', fs: 40 }) }),
        h('div', { class: 'cover-body' },
          h('div', { class: 'kicker', style: { color: KS.color(d.color) }, text: `Lesson ${c.num} · ${d.name || ''} · ${d.weight || '?'}% of exam` }),
          h('h1', null, h('span', { class: 'cover-ic', text: c.icon || '📘' }), c.title),
          h('div', { class: 'sub', html: c.subtitle || '' }),
          c.objectives ? h('div', null, h('h3', { text: 'What you’ll learn' }), h('ul', { class: 'objectives' }, c.objectives.map((o) => h('li', null, I('check'), h('span', { html: o }))))) : null,
          h('p', { class: 'muted small', html: `${c.slides.length + 2} slides · ~${c.minutes || Math.round(c.slides.length * 2.5)} min · then a ${(c.quiz || []).length}-question practice quiz. Use <kbd>←</kbd> <kbd>→</kbd> or <kbd>Space</kbd>.` })));
    }
    if (s._end) {
      return h('article', { class: 'slide' },
        h('div', { class: 'kicker', text: 'Lesson recap' }),
        h('h2', { class: 'slide-title', text: 'What to remember for the exam' }),
        h('ul', { class: 'b-bullets' }, (c.summary || []).map((x) => h('li', { html: x }))),
        nextItemBar(e, c, pl.nextIt, 'Lesson completed'));
    }
    return h('article', { class: 'slide' },
      s.kicker ? h('div', { class: 'kicker', html: s.kicker }) : null,
      s.title ? h('h2', { class: 'slide-title', html: s.title }) : null,
      KS.renderBlocks(s.blocks, ctx),
      s.tip ? h('div', { class: 'tip-box', html: '<b>🎯 Exam tip</b> ' + s.tip }) : null);
  }

  /* ---- Practice quiz (in player) ---- */
  KS.route('/exam/:id/quiz/:ch', ({ id, ch }) => getExam(id).then((e) => {
    const c = e.chapterList.find((x) => x.id === ch);
    if (!c) throw new Error('Lesson not found');
    const pl = player(e, c, 'quiz', {});
    practice(e, KS.shuffle(c.quiz || []), { title: 'Practice quiz: ' + c.title, chapter: c, back: `#/exam/${id}`, mount: pl.body, nextIt: pl.nextIt });
  }));
  KS.route('/exam/:id/practice/:domain', ({ id, domain }) => getExam(id).then((e) => {
    const d = e.domainById[domain];
    const qs = KS.shuffle(allQuestions(e).filter((q) => q.domain === domain)).slice(0, 20);
    practice(e, qs, { title: 'Domain drill: ' + (d ? d.name : domain), back: `#/exam/${id}` });
  }));
  KS.route('/exam/:id/drill', ({ id }) => getExam(id).then((e) => {
    const stats = S().exam(id).qstats;
    const score = (q) => { const s = stats[q.id]; if (!s) return 1; if (s.last === 0) return 0; return 2 + s.correct / s.seen; };
    const qs = KS.shuffle(allQuestions(e)).sort((a, b) => score(a) - score(b)).slice(0, 20);
    practice(e, qs, { title: 'Weak-area drill', back: `#/exam/${id}` });
  }));

  function practice(e, questions, opts) {
    let idx = 0, correct = 0;
    const missed = [];
    let wrap;
    if (opts.mount) { wrap = h('div', { class: 'quiz-wrap' }); opts.mount.appendChild(wrap); }
    else {
      KS.studying = true; KS.onLeave(() => (KS.studying = false));
      wrap = h('main', { class: 'quiz-wrap standalone' });
      shell(h('div', null, h('div', { class: 'page-head' }, h('div', { class: 'crumbs', html: `<a href="#/exam/${e.id}">${e.short}</a> <span>›</span> ${KS.esc(opts.title)}` })), wrap), { nav: 'kcna' });
    }
    if (!questions.length) { wrap.appendChild(h('div', { class: 'empty', text: 'No questions here yet.' })); return; }
    const intro = () => {
      wrap.innerHTML = '';
      const st = opts.chapter ? S().chapter(e.id, opts.chapter.id) : null;
      wrap.appendChild(h('div', { class: 'q-card quiz-intro' },
        h('div', { class: 'eyebrow', text: opts.chapter ? 'Practice quiz · ungraded' : 'Practice' }),
        h('h1', { text: opts.title }),
        h('div', { class: 'kv' },
          h('div', null, h('b', { text: questions.length }), h('span', { text: 'questions' })),
          h('div', null, h('b', { text: e.mock.pass + '%' }), h('span', { text: 'to pass' })),
          st ? h('div', null, h('b', { text: st.quizBest != null ? st.quizBest + '%' : '–' }), h('span', { text: 'your best' })) : null,
          h('div', null, h('b', { text: 'Instant' }), h('span', { text: 'feedback + source' }))),
        h('p', { class: 'muted', text: 'Every answer is explained and linked to its official source. Retake as often as you like; your best grade counts.' }),
        h('button', { class: 'btn primary lg', onclick: () => show() }, st && st.quizBest != null ? 'Retake quiz' : 'Start quiz')));
    };
    const show = () => {
      wrap.innerHTML = '';
      if (idx >= questions.length) return finish();
      const q = questions[idx];
      const order = KS.shuffle(q.options.map((_, i) => i));
      const multi = Array.isArray(q.answer);
      const need = multi ? q.answer.length : 1;
      const picked = new Set();
      let locked = false;
      const exp = h('div');
      const nextBtn = h('button', { class: 'btn primary', style: { display: 'none' }, onclick: () => { idx++; show(); } }, idx === questions.length - 1 ? 'See results' : 'Next question');
      const checkBtn = h('button', { class: 'btn primary', style: { display: multi ? '' : 'none' }, disabled: true, onclick: () => grade() }, 'Submit answer');
      const btns = order.map((oi, k) => {
        const b = h('button', { class: 'opt' + (multi ? ' multi' : ''), html: `<span class="key">${multi ? '' : String.fromCharCode(65 + k)}</span><span>${q.options[oi]}</span>` });
        b.addEventListener('click', () => {
          if (locked) return;
          if (multi) { picked.has(oi) ? picked.delete(oi) : picked.add(oi); b.classList.toggle('sel'); b.querySelector('.key').innerHTML = picked.has(oi) ? icon('check') : ''; checkBtn.disabled = picked.size !== need; }
          else { picked.clear(); picked.add(oi); grade(); }
        });
        return b;
      });
      function grade() {
        locked = true;
        const ok = isCorrect(q, [...picked]);
        const ans = asArr(q.answer);
        btns.forEach((b, k) => { b.disabled = true; const oi = order[k]; if (ans.includes(oi)) b.classList.add('correct'); else if (picked.has(oi)) b.classList.add('wrong'); });
        if (ok) correct++; else missed.push({ q, picked: [...picked] });
        S().recordAnswer(e.id, q.id, ok); S().save();
        exp.appendChild(h('div', { class: 'explain', html: `<div class="verdict ${ok ? 'ok' : 'bad'}">${ok ? '✓ Correct' : '✗ Incorrect'}</div>${q.explain || ''}${KS.refHtml(q)}` }));
        checkBtn.style.display = 'none'; nextBtn.style.display = ''; nextBtn.focus();
      }
      const d = e.domainById[q.domain] || {};
      wrap.appendChild(h('div', { class: 'q-top' }, h('span', { class: 'small', html: `Question <b>${idx + 1}</b> of ${questions.length}` }), bar((idx / questions.length) * 100), h('span', { class: 'small muted', text: `${correct} correct` })));
      wrap.appendChild(h('div', { class: 'q-card' },
        h('div', { class: 'q-meta' }, h('span', { class: 'tag', style: { color: KS.color(d.color) }, text: d.name || '' }), multi ? h('span', { class: 'tag warn', text: `Select ${need}` }) : h('span', { class: 'tag', text: 'Select 1' })),
        h('div', { class: 'q-text', html: q.q }), h('div', { class: 'opts' }, btns), exp,
        h('div', { class: 'q-foot' }, h('a', { class: 'btn ghost sm', href: opts.back }, 'Exit'), h('div', { class: 'row' }, checkBtn, nextBtn))));
    };
    const finish = () => {
      const score = pct(correct, questions.length);
      const pass = score >= e.mock.pass;
      if (opts.chapter) {
        const st = S().chapter(e.id, opts.chapter.id);
        const was = st.quizBest;
        st.quizBest = Math.max(st.quizBest || 0, score); st.quizAttempts = (st.quizAttempts || 0) + 1;
        st.quizHistory = (st.quizHistory || []).concat({ score, t: Date.now() }).slice(-20);
        S().event(e.id, `Scored <b>${score}%</b> on the <b>${KS.esc(opts.chapter.title)}</b> quiz` + (pass && !(was >= e.mock.pass) ? ' and passed it' : ''), pass ? '✅' : '📝');
      } else S().event(e.id, `Scored <b>${score}%</b> on <b>${KS.esc(opts.title)}</b>`, '🎯');
      S().save();
      wrap.appendChild(h('div', { class: 'q-card result-card ' + (pass ? 'pass' : 'fail') },
        h('div', { class: 'result-hero' },
          h('div', { class: 'ring', html: KS.ring(score, pass ? 'var(--ok)' : 'var(--warn)', 132) + `<div class="rv"><b>${score}%</b><span>${correct}/${questions.length}</span></div>` }),
          h('div', null,
            h('div', { class: 'eyebrow', text: pass ? 'Passed' : 'Not passed yet' }),
            h('h2', { text: pass ? 'Great work, you passed!' : `Aim for ${e.mock.pass}% to pass` }),
            h('p', { class: 'muted', text: pass ? 'This item is now marked complete in your course.' : 'Review the explanations below, revisit the slides, then retake.' }),
            h('div', { class: 'row' },
              pass && opts.nextIt ? h('a', { class: 'btn primary', href: opts.nextIt.href }, 'Go to next item', I('right')) : null,
              h('button', { class: 'btn' + (pass ? '' : ' primary'), onclick: () => { questions = KS.shuffle(questions); idx = 0; correct = 0; missed.length = 0; show(); } }, 'Retake'),
              opts.chapter ? h('a', { class: 'btn ghost', href: `#/exam/${e.id}/learn/${opts.chapter.id}` }, 'Review slides') : h('a', { class: 'btn ghost', href: opts.back }, 'Back to course'))))));
      if (missed.length) {
        wrap.appendChild(h('h3', { class: 'sec-title', text: `Review ${missed.length} missed question${missed.length === 1 ? '' : 's'}` }));
        missed.forEach((m) => wrap.appendChild(reviewItem(e, m.q, m.picked, null)));
      }
    };
    if (opts.chapter) intro(); else show();
  }

  function reviewItem(e, q, picked, order, num) {
    const ans = asArr(q.answer);
    picked = picked || [];
    order = order || q.options.map((_, i) => i);
    const ok = isCorrect(q, picked);
    const d = e.domainById[q.domain] || {};
    return h('div', { class: 'review-item', id: num ? 'rq' + num : null },
      h('div', { class: 'q-meta' }, h('span', { class: 'row', style: { gap: '8px' } }, num ? h('b', { text: 'Q' + num }) : null, h('span', { class: 'tag ' + (ok ? 'ok' : picked.length ? 'bad' : 'warn'), text: ok ? 'Correct' : picked.length ? 'Incorrect' : 'Unanswered' })), h('span', { class: 'tag', style: { color: KS.color(d.color) }, text: d.name || '' })),
      h('div', { class: 'q-text', html: q.q }),
      order.map((oi, k) => h('div', { class: 'opt static' + (ans.includes(oi) ? ' correct' : picked.includes(oi) ? ' wrong' : ''), html: `<span class="key">${String.fromCharCode(65 + k)}</span><span>${q.options[oi]}${picked.includes(oi) ? ' <span class="muted small">(your answer)</span>' : ''}</span>` })),
      h('div', { class: 'explain', html: (q.explain || '') + KS.refHtml(q) }));
  }

  /* ---- Flashcards (in player for a lesson, standalone for all) ---- */
  KS.route('/exam/:id/flash/:ch', ({ id, ch }) => getExam(id).then((e) => {
    const chs = ch === 'all' ? e.chapterList : e.chapterList.filter((c) => c.id === ch);
    if (!chs.length) throw new Error('Lesson not found');
    let mount;
    if (ch === 'all') {
      KS.studying = true; KS.onLeave(() => (KS.studying = false));
      mount = h('main', { class: 'quiz-wrap standalone' });
      shell(h('div', null, h('div', { class: 'page-head' }, h('div', { class: 'crumbs', html: `<a href="#/exam/${id}">${e.short}</a> <span>›</span> <a href="#/exam/${id}/library">Resources</a> <span>›</span> All flashcards` })), mount), { nav: 'kcna' });
    } else mount = player(e, chs[0], 'flash', {}).body;
    const nextIt = ch === 'all' ? null : orderedItems(e)[orderedItems(e).findIndex((x) => x.ch === chs[0] && x.kind === 'flash') + 1];
    flashcards(e, chs, mount, ch === 'all' ? 'All flashcards' : 'Flashcards: ' + chs[0].title, ch === 'all' ? null : chs[0], nextIt);
  }));
  function flashcards(e, chs, wrap, label, chapter, nextIt) {
    const p = S().exam(e.id);
    const cards = [];
    chs.forEach((c) => (c.glossary || []).forEach((g) => cards.push(Object.assign({ ch: c }, g))));
    let onlyUnknown = false;
    let deck = KS.shuffle(cards), i = 0;
    const onKey = (ev) => { if (/input|textarea|select/i.test((ev.target || {}).tagName)) return; if (ev.key === ' ') { ev.preventDefault(); const f = wrap.querySelector('.fc'); if (f) f.classList.toggle('on'); } else if (ev.key === '1') mark('again'); else if (ev.key === '2') mark('known'); };
    document.addEventListener('keydown', onKey);
    KS.onLeave(() => document.removeEventListener('keydown', onKey));
    function mark(v) { const c = deck[i]; if (!c) return; p.flash[c.term] = v; S().touch({ cards: 1 }); S().save(); i++; render(); }
    function render() {
      wrap.innerHTML = '';
      const known = cards.filter((c) => p.flash[c.term] === 'known').length;
      wrap.appendChild(h('div', { class: 'row-between fc-head' },
        h('div', null, h('div', { class: 'eyebrow', text: 'Flashcards · optional' }), h('h2', { style: { margin: 0 }, text: label })),
        h('div', { class: 'row' }, h('span', { class: 'tag ok', text: `${known}/${cards.length} known` }),
          h('button', { class: 'btn sm', onclick: () => { onlyUnknown = !onlyUnknown; deck = KS.shuffle(onlyUnknown ? cards.filter((c) => p.flash[c.term] !== 'known') : cards); i = 0; render(); } }, onlyUnknown ? 'Show all' : 'Only unknown'),
          h('button', { class: 'btn sm', onclick: () => { deck = KS.shuffle(deck); i = 0; render(); } }, 'Shuffle'))));
      if (i >= deck.length) {
        if (chapter && deck.length) { const st = S().chapter(e.id, chapter.id); if (!st.flashDone) { st.flashDone = true; S().event(e.id, `Finished the <b>${KS.esc(chapter.title)}</b> flashcards`, '🃏'); } S().save(); }
        wrap.appendChild(h('div', { class: 'q-card center' }, h('h2', { text: deck.length ? '🎉 Deck complete' : 'No cards to show' }), h('p', { class: 'muted', text: `${known} of ${cards.length} terms marked as known.` }),
          h('div', { class: 'row center' }, h('button', { class: 'btn', onclick: () => { deck = KS.shuffle(cards.filter((c) => p.flash[c.term] !== 'known')); onlyUnknown = true; i = 0; render(); } }, 'Study unknown cards'), nextIt ? h('a', { class: 'btn primary', href: nextIt.href }, 'Go to next item', I('right')) : null)));
        return;
      }
      const c = deck[i];
      const fc = h('div', { class: 'fc' }, h('div', { class: 'face front' }, h('small', { text: `${c.ch.num}. ${c.ch.title}` }), h('div', { html: c.term }), h('span', { class: 'fc-hint', text: 'Click or press Space to flip' })), h('div', { class: 'face back' }, h('small', { text: c.term }), h('div', { html: c.def })));
      fc.addEventListener('click', () => fc.classList.toggle('on'));
      wrap.appendChild(bar((i / deck.length) * 100));
      wrap.appendChild(h('div', { class: 'fc-stage' }, fc));
      wrap.appendChild(h('div', { class: 'row center', style: { marginTop: '20px' } },
        h('button', { class: 'btn', onclick: () => mark('again') }, 'Still learning (1)'),
        h('button', { class: 'btn primary', onclick: () => mark('known') }, I('check'), 'I know this (2)')));
      wrap.appendChild(h('p', { class: 'muted small center', text: `Card ${i + 1} of ${deck.length}` }));
    }
    render();
  }

  /* ================================================================ MOCK EXAM */
  function allocate(total, domains) {
    const raw = domains.map((d) => (total * d.weight) / 100);
    const base = raw.map(Math.floor);
    let left = total - base.reduce((a, b) => a + b, 0);
    raw.map((r, i) => [r - base[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { base[i]++; left--; } });
    return base;
  }
  function hashStr(s) { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
  function buildMock(e, key) {
    const counts = allocate(e.mock.questions, e.domains);
    const out = [], used = new Set();
    e.domains.forEach((d, di) => {
      const need = counts[di];
      let chosen;
      if (key === 'random') chosen = KS.shuffle(allQuestions(e).filter((q) => q.domain === d.id)).slice(0, need);
      else {
        const k = parseInt(key, 10) - 1;
        const bank = KS.shuffle(e.mockBank.filter((q) => q.domain === d.id), KS.rng(hashStr(e.id + d.id + 'bank')));
        chosen = bank.slice(k * need, (k + 1) * need);
        if (chosen.length < need) {
          const extra = KS.shuffle(allQuestions(e).filter((q) => q.domain === d.id && !chosen.includes(q)), KS.rng(hashStr(e.id + d.id + key)));
          chosen = chosen.concat(extra.slice(0, need - chosen.length));
        }
      }
      chosen.forEach((q) => { if (!used.has(q.id)) { used.add(q.id); out.push(q); } });
    });
    return KS.shuffle(out, key === 'random' ? Math.random : KS.rng(hashStr(e.id + 'order' + key)));
  }

  KS.route('/exam/:id/mock/:key', ({ id, key }) => getExam(id).then((e) => {
    const p = S().exam(id);
    if (p.activeMock && p.activeMock.key === key) return runMock(e, p.activeMock);
    const title = key === 'random' ? 'Random mock exam' : 'Mock exam ' + key;
    const prev = p.attempts.filter((t) => t.key === key);
    const other = p.activeMock && p.activeMock.key !== key;
    const counts = allocate(e.mock.questions, e.domains);
    shell(h('main', { class: 'quiz-wrap standalone' }, h('div', { class: 'q-card exam-intro' },
      h('div', { class: 'ei-art', html: courseArt(e, { k: 'm' + key, w: 860, h: 150, tag: e.short + ' · ' + title, fs: 46 }) }),
      h('div', { class: 'eyebrow', text: key === 'random' ? 'Ungraded exam' : 'Graded exam · Final assessment' }),
      h('h1', { text: title }),
      h('div', { class: 'kv' },
        h('div', null, h('b', { text: e.mock.questions }), h('span', { text: 'questions' })),
        h('div', null, h('b', { text: e.mock.minutes + ' min' }), h('span', { text: 'time limit' })),
        h('div', null, h('b', { text: e.mock.pass + '%' }), h('span', { text: 'to pass' })),
        h('div', null, h('b', { text: prev.length ? Math.max(...prev.map((t) => t.score)) + '%' : '–' }), h('span', { text: `best of ${prev.length} attempt${prev.length === 1 ? '' : 's'}` }))),
      h('h3', { text: 'Question mix (same as the official blueprint)' }),
      h('div', null, e.domains.map((d, i) => h('div', { class: 'dom-row' }, h('span', { html: `<i class="dotc" style="background:${KS.color(d.color)}"></i>${d.name}` }), h('div', { class: 'pbar' }, h('span', { style: { width: d.weight + '%', background: KS.color(d.color) } })), h('b', { text: counts[i] + ' Qs' })))),
      h('div', { class: 'b-callout info' }, h('span', { class: 'ct', text: 'Exam conditions' }), h('div', { html: 'No feedback until you submit. <b>Flag</b> questions and jump around with the navigator. Multi-select questions score only if every pick is right. The timer keeps running if you close the page, like the real exam, and your answers are saved in this browser.' })),
      other ? h('div', { class: 'b-callout warn' }, h('span', { class: 'ct', text: 'Another mock is in progress' }), h('div', { html: `Starting this one discards your unfinished <b>${p.activeMock.title}</b>.` })) : null,
      h('div', { class: 'q-foot' }, h('a', { class: 'btn ghost', href: '#/exam/' + id }, 'Back to course'),
        h('button', { class: 'btn primary lg', onclick: () => {
          const qs = buildMock(e, key);
          p.activeMock = { key, title, qids: qs.map((q) => q.id), orders: qs.map((q) => KS.shuffle(q.options.map((_, i) => i))), answers: {}, flags: {}, start: Date.now(), duration: e.mock.minutes * 60, cur: 0 };
          S().save(); runMock(e, p.activeMock);
        } }, I('timer'), 'Start the clock')))), { nav: 'kcna' });
  }));

  function runMock(e, m) {
    KS.studying = true; KS.onLeave(() => (KS.studying = false));
    const qs = m.qids.map((qid) => e.questionIndex[qid]).filter(Boolean);
    const timerEl = h('span', { class: 'timer' });
    const counter = h('span', { class: 'small' });
    const flagBtn = h('button', { class: 'btn sm', onclick: () => { m.flags[m.cur] = !m.flags[m.cur]; S().save(); render(); } });
    const drawer = h('div', { class: 'drawer' });
    const body = h('div', { class: 'quiz-wrap' });
    const head = h('div', { class: 'mock-head' }, h('b', { text: m.title }), counter, h('div', { class: 'spacer' }), timerEl, flagBtn,
      h('button', { class: 'btn sm', onclick: () => openNav() }, 'Navigator'),
      h('button', { class: 'btn sm primary', onclick: () => confirmSubmit() }, 'Submit'));
    shell(h('main', null, head, body, drawer), { noFooter: true, compact: true, nav: 'kcna' });

    const tick = () => {
      const left = m.duration - (Date.now() - m.start) / 1000;
      timerEl.innerHTML = icon('timer') + ' ' + KS.fmtTime(left);
      timerEl.classList.toggle('low', left < 300);
      if (left <= 0) { clearInterval(iv); submit(true); }
    };
    const iv = setInterval(tick, 1000); tick();
    KS.onLeave(() => clearInterval(iv));
    const onKey = (ev) => { if (ev.key === 'ArrowRight') go(m.cur + 1); else if (ev.key === 'ArrowLeft') go(m.cur - 1); };
    document.addEventListener('keydown', onKey);
    KS.onLeave(() => document.removeEventListener('keydown', onKey));

    function go(n) { if (n < 0 || n >= qs.length) return; m.cur = n; S().save(); render(); }
    function render() {
      const q = qs[m.cur], order = m.orders[m.cur];
      const multi = Array.isArray(q.answer), need = multi ? q.answer.length : 1;
      const picked = new Set(m.answers[m.cur] || []);
      const answered = Object.keys(m.answers).filter((k) => (m.answers[k] || []).length).length;
      counter.innerHTML = `Question <b>${m.cur + 1}</b> of ${qs.length} · ${answered} answered`;
      flagBtn.textContent = m.flags[m.cur] ? '🚩 Flagged' : '⚐ Flag';
      body.innerHTML = '';
      const btns = order.map((oi, k) => {
        const b = h('button', { class: 'opt' + (multi ? ' multi' : '') + (picked.has(oi) ? ' sel' : ''), html: `<span class="key">${multi ? (picked.has(oi) ? icon('check') : '') : String.fromCharCode(65 + k)}</span><span>${q.options[oi]}</span>` });
        b.addEventListener('click', () => {
          if (multi) { if (picked.has(oi)) picked.delete(oi); else { if (picked.size >= need) return KS.toast(`Select only ${need}. Unselect one first.`); picked.add(oi); } }
          else { picked.clear(); picked.add(oi); }
          m.answers[m.cur] = [...picked]; S().save(); render();
        });
        return b;
      });
      body.appendChild(h('div', { class: 'q-top' }, bar((answered / qs.length) * 100)));
      body.appendChild(h('div', { class: 'q-card' },
        h('div', { class: 'q-meta' }, h('b', { text: 'Question ' + (m.cur + 1) }), h('span', { class: 'tag' + (multi ? ' warn' : ''), text: `Select ${need}` })),
        h('div', { class: 'q-text', html: q.q }), h('div', { class: 'opts' }, btns),
        h('div', { class: 'q-foot' },
          h('button', { class: 'btn', disabled: m.cur === 0, onclick: () => go(m.cur - 1) }, I('left'), 'Previous'),
          m.cur === qs.length - 1 ? h('button', { class: 'btn primary', onclick: () => confirmSubmit() }, 'Review & submit') : h('button', { class: 'btn primary', onclick: () => go(m.cur + 1) }, 'Next', I('right')))));
      body.appendChild(h('div', { class: 'card', style: { marginTop: '16px' } }, navGrid()));
    }
    function navGrid() {
      return h('div', null, h('div', { class: 'row small muted', style: { marginBottom: '10px' }, html: '<span class="tag accent">answered</span><span class="tag warn">● flagged</span><span>Click a number to jump</span>' }),
        h('div', { class: 'navgrid' }, qs.map((_, i) => h('button', { class: ((m.answers[i] || []).length ? 'ans ' : '') + (m.flags[i] ? 'flag ' : '') + (i === m.cur ? 'cur' : ''), onclick: () => { drawer.classList.remove('open'); go(i); }, text: i + 1 }))));
    }
    function sheet(...kids) {
      drawer.innerHTML = '';
      drawer.appendChild(h('div', { class: 'scrim', onclick: () => drawer.classList.remove('open') }));
      drawer.appendChild(h('div', { class: 'sheet' }, kids));
      drawer.classList.add('open');
    }
    function openNav() { sheet(h('h3', { text: 'Navigator' }), navGrid()); }
    function confirmSubmit() {
      const unanswered = qs.filter((_, i) => !(m.answers[i] || []).length).length;
      const flagged = Object.values(m.flags).filter(Boolean).length;
      sheet(h('h2', { text: 'Submit exam?' }),
        h('p', { class: 'muted', html: `<b>${unanswered}</b> unanswered · <b>${flagged}</b> flagged. Unanswered questions score zero, so there is no penalty for guessing.` }),
        navGrid(),
        h('div', { class: 'row', style: { marginTop: '18px' } }, h('button', { class: 'btn', onclick: () => drawer.classList.remove('open') }, 'Keep working'), h('button', { class: 'btn primary', onclick: () => submit(false) }, 'Submit now')));
    }
    function submit(timeout) {
      clearInterval(iv);
      const p = S().exam(e.id);
      let correct = 0;
      const byDomain = {};
      qs.forEach((q, i) => {
        const ok = isCorrect(q, m.answers[i]);
        if (ok) correct++;
        const bd = (byDomain[q.domain] = byDomain[q.domain] || { c: 0, t: 0 }); bd.t++; if (ok) bd.c++;
        S().recordAnswer(e.id, q.id, ok);
      });
      const score = pct(correct, qs.length);
      const att = { id: Date.now().toString(36), key: m.key, title: m.title, date: Date.now(), qids: m.qids, orders: m.orders, answers: m.answers, flags: m.flags, correct, total: qs.length, score, pass: score >= e.mock.pass, byDomain, timeUsed: Math.min(m.duration, Math.round((Date.now() - m.start) / 1000)), timeout: !!timeout };
      p.attempts.push(att);
      delete p.activeMock;
      S().event(e.id, `${att.pass ? 'Passed' : 'Took'} <b>${KS.esc(m.title)}</b> with <b>${score}%</b>`, att.pass ? '🏆' : '⏱️');
      S().save();
      location.hash = `#/exam/${e.id}/results/${att.id}`;
    }
    render();
  }

  /* ---- Results ---- */
  KS.route('/exam/:id/results/:aid', ({ id, aid }) => getExam(id).then((e) => {
    const t = S().exam(id).attempts.find((x) => x.id === aid);
    if (!t) throw new Error('Attempt not found');
    const qs = t.qids.map((q) => e.questionIndex[q]);
    let filter = 'all';
    const list = h('div');
    const renderList = () => {
      list.innerHTML = '';
      qs.forEach((q, i) => {
        if (!q) return;
        const ok = isCorrect(q, t.answers[i]);
        if (filter === 'wrong' && ok) return;
        if (filter === 'flagged' && !t.flags[i]) return;
        list.appendChild(reviewItem(e, q, t.answers[i] || [], t.orders[i], i + 1));
      });
      if (!list.children.length) list.appendChild(h('div', { class: 'empty', text: 'Nothing to show for this filter.' }));
    };
    const seg = h('div', { class: 'seg' }, [['all', 'All'], ['wrong', 'Incorrect'], ['flagged', 'Flagged']].map(([k, l]) => { const b = h('button', { class: k === filter ? 'on' : '', onclick: () => { filter = k; [...seg.children].forEach((x) => x.classList.toggle('on', x === b)); renderList(); } }, l); return b; }));
    const weakest = e.domains.map((d) => ({ d, r: t.byDomain[d.id] })).filter((x) => x.r).sort((a, b) => a.r.c / a.r.t - b.r.c / b.r.t)[0];
    const grid = h('div', { class: 'navgrid', style: { marginTop: '14px' } }, qs.map((q, i) => h('button', { class: q && isCorrect(q, t.answers[i]) ? 'r-ok' : 'r-bad', onclick: () => { filter = 'all'; [...seg.children].forEach((x, j) => x.classList.toggle('on', j === 0)); renderList(); const el = document.getElementById('rq' + (i + 1)); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, text: i + 1 })));
    shell(h('main', { class: 'quiz-wrap standalone' },
      h('div', { class: 'crumbs', html: `<a href="#/exam/${id}">${e.short}</a> <span>›</span> <a href="#/exam/${id}/grades">Grades</a> <span>›</span> ${KS.esc(t.title)}` }),
      h('div', { class: 'q-card result-card ' + (t.pass ? 'pass' : 'fail') },
        h('div', { class: 'result-hero' },
          h('div', { class: 'ring', html: KS.ring(t.score, t.pass ? 'var(--ok)' : 'var(--bad)', 132) + `<div class="rv"><b>${t.score}%</b><span>${t.correct}/${t.total}</span></div>` }),
          h('div', { style: { flex: 1, minWidth: '240px' } },
            h('div', { class: 'eyebrow', text: t.pass ? 'Passed' : 'Not passed' }),
            h('h2', { text: t.pass ? 'You would have passed! 🎉' : `Not yet: ${e.mock.pass}% needed` }),
            h('p', { class: 'muted', html: `${new Date(t.date).toLocaleString()} · time used <b>${KS.fmtTime(t.timeUsed)}</b> of ${e.mock.minutes}:00${t.timeout ? ' (time ran out)' : ''}` }),
            weakest ? h('p', { html: `Weakest domain: <b>${weakest.d.name}</b> (${pct(weakest.r.c, weakest.r.t)}%). <a href="#/exam/${id}/practice/${weakest.d.id}">Drill it →</a>` }) : null,
            h('div', { class: 'row' }, h('a', { class: 'btn primary', href: `#/exam/${id}/mock/${t.key}` }, 'Retake'), h('a', { class: 'btn', href: `#/exam/${id}/drill` }, 'Weak-area drill'), h('a', { class: 'btn ghost', href: '#/exam/' + id }, 'Course home')))),
        h('h3', { style: { marginTop: '22px' }, text: 'Score by domain' }),
        e.domains.map((d) => { const r = t.byDomain[d.id] || { c: 0, t: 0 }; const v = pct(r.c, r.t); return h('div', { class: 'dom-row' }, h('span', { html: `<i class="dotc" style="background:${KS.color(d.color)}"></i>${d.name} <span class="muted small">${d.weight}%</span>` }), bar(v, v >= e.mock.pass ? 'ok' : 'bad'), h('b', { text: `${r.c}/${r.t}` })); }),
        grid),
      h('div', { class: 'row-between', style: { margin: '28px 0 12px' } }, h('h2', { style: { margin: 0 }, text: 'Review answers' }), seg),
      list), { nav: 'kcna' });
    renderList();
  }));

  /* ================================================================ misc pages */
  KS.route('/exam/:id/cheatsheet', ({ id }) => getExam(id).then((e) => {
    shell(h('main', { class: 'page' },
      h('div', { class: 'row-between no-print' }, h('div', null, h('div', { class: 'crumbs', html: `<a href="#/exam/${id}">${e.short}</a> <span>›</span> <a href="#/exam/${id}/library">Resources</a> <span>›</span> Cheat sheet` }), h('h1', { text: e.short + ' cheat sheet' })), h('button', { class: 'btn', onclick: () => window.print() }, 'Print / save PDF')),
      h('p', { class: 'muted', text: 'Every lesson recap and key term on one page. Generated from the lessons, so it is always in sync.' }),
      e.domains.map((d) => h('section', null,
        h('h2', { class: 'sec-title', html: `<i class="dotc" style="background:${KS.color(d.color)}"></i> ${d.name} <span class="muted small">${d.weight}%</span>` }),
        h('div', { class: 'grid g2' }, e.chapterList.filter((c) => c.domain === d.id).map((c) => h('div', { class: 'card' },
          h('h3', { text: `${c.icon || ''} ${c.num}. ${c.title}` }),
          h('ul', { class: 'small cs-list' }, (c.summary || []).map((x) => h('li', { html: x }))),
          (c.glossary || []).length ? h('details', null, h('summary', { class: 'small', text: `${c.glossary.length} key terms` }),
            h('dl', { class: 'small' }, c.glossary.map((g) => [h('dt', { html: g.term }), h('dd', { html: g.def })]))) : null)))))), { nav: 'kcna' });
  }));

  KS.route('/exam/:id/lib/:i', ({ id, i }) => getExam(id).then((e) => {
    const it = (e.library || [])[parseInt(i, 10)];
    if (!it) throw new Error('Library item not found');
    shell(h('main', { class: 'page wide' }, h('div', { class: 'row-between' }, h('div', { class: 'crumbs', html: `<a href="#/exam/${id}/library">Resources</a> <span>›</span> ${KS.esc(it.title)}` }), h('a', { class: 'btn sm', href: `exams/${id}/${it.url}`, target: '_blank' }, 'Open in new tab ↗')),
      h('iframe', { class: 'lib-frame', src: `exams/${id}/${it.url}`, title: it.title })), { noFooter: true, nav: 'kcna' });
  }));

  KS.route('/data', function () {
    const st = S().state;
    const ta = h('textarea', { class: 'note-ta mono', rows: 10 });
    ta.value = S().exportJSON();
    const file = h('input', { type: 'file', accept: 'application/json', style: { display: 'none' }, onchange: (ev) => {
      const f = ev.target.files[0]; if (!f) return;
      f.text().then((t) => { try { S().importJSON(t); KS.toast('Progress restored'); KS.dispatch(); } catch (err) { KS.toast('Could not read that file'); } });
    } });
    let size = 0; try { size = (localStorage.getItem('kubestronaut.v1') || '').length; } catch (_) {}
    shell(h('main', { class: 'page narrow' },
      h('h1', { text: 'Progress & backup' }),
      h('p', { class: 'muted', html: 'Everything (lesson progress, quiz grades, mock attempts, notes, streaks and your weekly goal) is stored in this browser’s <b>local storage</b>. Nothing is sent anywhere. Download a backup to move it to another device or browser.' }),
      h('div', { class: 'kv' },
        h('div', null, h('b', { text: Object.keys(st.activity || {}).length }), h('span', { text: 'study days logged' })),
        h('div', null, h('b', { text: S().streak() }), h('span', { text: 'current streak' })),
        h('div', null, h('b', { text: (size / 1024).toFixed(1) + ' KB' }), h('span', { text: 'stored locally' }))),
      h('div', { class: 'row', style: { margin: '18px 0' } },
        h('button', { class: 'btn primary', onclick: () => { const a = h('a', { href: URL.createObjectURL(new Blob([S().exportJSON()], { type: 'application/json' })), download: 'kubestronaut-progress.json' }); a.click(); } }, '⬇ Download backup'),
        h('button', { class: 'btn', onclick: () => file.click() }, '⬆ Restore from file'), file,
        h('button', { class: 'btn danger', onclick: () => { if (confirm('Erase ALL progress, notes and streaks in this browser?')) { S().reset(); KS.toast('Progress reset'); KS.dispatch(); } } }, 'Reset everything')),
      h('details', null, h('summary', { text: 'Raw data' }), ta)), { nav: '' });
  });
})();
