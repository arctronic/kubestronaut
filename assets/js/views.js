/* Kubestronaut Study Platform: views (home, exam overview, deck, quiz, mock, results, flashcards, intel, library) */
(function () {
  'use strict';
  const KS = window.KS;
  const h = KS.h;
  const app = () => document.getElementById('app');

  /* ---------------- shell ---------------- */
  const LOGO = `<svg class="brand-logo" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f8cff"/><stop offset="1" stop-color="#9b7bff"/></linearGradient></defs><path d="M32 3l25 12v34L32 61 7 49V15z" fill="url(#lg)"/><circle cx="32" cy="32" r="11" fill="none" stroke="#fff" stroke-width="3.2"/><g stroke="#fff" stroke-width="3.2" stroke-linecap="round"><path d="M32 13v8M32 43v8M13 32h8M43 32h8M18.6 18.6l5.7 5.7M39.7 39.7l5.7 5.7M18.6 45.4l5.7-5.7M39.7 24.3l5.7-5.7"/></g><circle cx="32" cy="32" r="3.5" fill="#fff"/></svg>`;

  function shell(crumbs, content, opts) {
    opts = opts || {};
    const root = app();
    root.innerHTML = '';
    const top = h('header', { class: 'topbar' },
      h('a', { class: 'brand', href: '#/', html: LOGO + '<span>Kubestronaut <small>Study Hub</small></span>' }),
      h('nav', { class: 'crumbs' }, (crumbs || []).map((c, i) => [h('span', { text: '/' }), c.href ? h('a', { href: c.href, text: c.label }) : h('span', { text: c.label })])),
      h('div', { class: 'spacer' }),
      opts.right || null,
      h('button', { class: 'icon-btn', title: 'Toggle light/dark', onclick: KS.toggleTheme, html: '🌓' }));
    root.appendChild(top);
    root.appendChild(content);
    if (!opts.noFooter) root.appendChild(h('footer', { class: 'footer', html: 'Kubestronaut Study Hub: your personal prep platform for KCNA · KCSA · CKAD · CKA · CKS. Progress is saved in this browser. <a href="#/data">Backup / restore</a>' }));
    return root;
  }
  KS.renderError = function (err) {
    console.error(err);
    shell([], h('div', { class: 'wrap' }, h('div', { class: 'empty' }, h('h2', { text: 'Something went wrong' }), h('p', { text: err && err.message ? err.message : String(err) }), h('a', { class: 'btn', href: '#/' }, 'Back home'))));
  };

  function getExam(id) { return KS.loadExam(id); }
  function allQuestions(e) { return Object.values(e.questionIndex); }
  function asArr(a) { return Array.isArray(a) ? a.slice().sort() : [a]; }
  function isCorrect(q, picked) { const A = asArr(q.answer), P = (picked || []).slice().sort(); return A.length === P.length && A.every((x, i) => x === P[i]); }
  function domainColor(e, did) { const d = e.domainById[did]; return KS.color(d ? d.color : 'gray'); }

  /* ---------------- HOME ---------------- */
  KS.route('/', function () {
    const hero = h('section', { class: 'hero' },
      h('div', { class: 'chip accent', text: '🚀 Kubestronaut program: 5 certifications' }),
      h('h1', { style: { marginTop: '14px' }, text: 'Your mission control for becoming a Kubestronaut' }),
      h('p', { class: 'lead', html: 'Interactive slides, clickable architecture diagrams, chapter quizzes, flashcards and full-length timed mock exams, organised exam by exam. Start with <b>KCNA</b>, then work through the rest of the path.' }));
    const journey = h('div', { class: 'journey' });
    KS.order.forEach((id, i) => {
      const m = KS.exams[id];
      const p = KS.store.exam(id);
      const done = Object.values(p.chapters).filter((c) => c.completed).length;
      const best = p.attempts.reduce((a, t) => Math.max(a, t.score), 0);
      const card = h(m.available ? 'a' : 'div', { class: 'card exam-card' + (m.available ? '' : ' locked'), href: m.available ? '#/exam/' + id : null, style: { borderTop: '3px solid ' + KS.color(m.color) } },
        h('span', { class: 'step', text: 'Step ' + (i + 1) }),
        h('span', { class: 'tag chip ' + (m.available ? 'ok' : ''), text: m.available ? 'Ready' : 'Coming soon' }),
        h('div', { class: 'card-icon', text: m.icon }),
        h('h3', { text: m.short }),
        h('div', { class: 'muted small', text: m.title }),
        h('div', { class: 'row small' }, h('span', { class: 'chip', text: m.format }), h('span', { class: 'chip', text: m.duration })),
        m.available ? h('div', { class: 'small muted', html: `${done} chapter${done === 1 ? '' : 's'} completed · best mock <b>${best ? best + '%' : '–'}</b>` }) : h('div', { class: 'small muted', text: m.blurb || '' }));
      journey.appendChild(card);
    });
    const how = h('div', { class: 'grid g4' },
      [['📽️', 'Learn with slides', 'Chapter decks mapped to the official curriculum with interactive diagrams, flip cards and annotated YAML.'],
        ['✅', 'Check every chapter', 'Short practice quizzes with instant feedback and explanations for every option.'],
        ['⏱️', 'Simulate the exam', 'Timed, full-length mock exams weighted exactly like the real blueprint, with domain breakdown.'],
        ['🃏', 'Drill the vocabulary', 'Flashcards for every term, plus a weak-area drill built from the questions you missed.']]
        .map(([i, t, d]) => h('div', { class: 'card' }, h('div', { class: 'card-icon', text: i }), h('h3', { text: t }), h('p', { class: 'muted small', text: d }))));
    shell([], h('main', { class: 'wrap' }, hero,
      h('section', { class: 'section' }, h('div', { class: 'section-head' }, h('h2', { text: 'The Kubestronaut path' }), h('span', { class: 'muted small', text: 'Hold all five active certifications to earn the Kubestronaut title' })), journey),
      h('section', { class: 'section' }, h('div', { class: 'section-head' }, h('h2', { text: 'How this hub works' })), how)));
  });

  /* ---------------- DATA (backup/restore) ---------------- */
  KS.route('/data', function () {
    const ta = h('textarea', { style: { width: '100%', height: '220px', background: 'var(--panel-2)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: '10px', padding: '10px', fontFamily: 'var(--mono)', fontSize: '.8rem' } });
    ta.value = KS.store.exportJSON();
    const file = h('input', { type: 'file', accept: 'application/json', style: { display: 'none' }, onchange: (e) => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then((t) => { try { KS.store.importJSON(t); KS.toast('Progress restored'); KS.dispatch(); } catch (err) { KS.toast('Could not read that file'); } });
    } });
    shell([{ label: 'Backup / restore' }], h('main', { class: 'wrap' },
      h('h1', { text: 'Backup & restore progress' }),
      h('p', { class: 'muted', text: 'Progress lives in this browser’s local storage. Download a backup to move it to another device or browser.' }),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', onclick: () => { const blob = new Blob([KS.store.exportJSON()], { type: 'application/json' }); const a = h('a', { href: URL.createObjectURL(blob), download: 'kubestronaut-progress.json' }); a.click(); } }, '⬇ Download backup'),
        h('button', { class: 'btn', onclick: () => file.click() }, '⬆ Restore from file'), file,
        h('button', { class: 'btn danger', onclick: () => { if (confirm('Erase ALL progress in this browser?')) { KS.store.reset(); KS.toast('Progress reset'); KS.dispatch(); } } }, 'Reset everything')),
      h('h3', { style: { marginTop: '26px' }, text: 'Raw data' }), ta));
  });

  /* ---------------- EXAM OVERVIEW ---------------- */
  KS.route('/exam/:id', function ({ id }) {
    return getExam(id).then((e) => {
      const p = KS.store.exam(id);
      const chs = e.chapterList;
      const totalSlides = chs.reduce((a, c) => a + c.slides.length + 2, 0);
      const seenSlides = chs.reduce((a, c) => a + Math.min(KS.store.chapter(id, c.id).viewed.length, c.slides.length + 2), 0);
      const quizScores = chs.map((c) => KS.store.chapter(id, c.id).quizBest).filter((x) => x != null);
      const avgQuiz = quizScores.length ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) : null;
      const best = p.attempts.reduce((a, t) => Math.max(a, t.score), 0);
      const lastCh = chs.find((c) => !KS.store.chapter(id, c.id).completed) || chs[0];

      const hero = h('section', { class: 'hero' },
        h('div', { class: 'row' }, h('span', { class: 'chip accent', text: e.icon + ' ' + e.short }), h('span', { class: 'chip', text: e.format }), h('span', { class: 'chip', text: e.duration }), h('span', { class: 'chip', text: 'Pass ≥ ' + e.mock.pass + '%' })),
        h('h1', { style: { marginTop: '14px' }, text: e.title }),
        h('p', { class: 'lead', html: e.tagline || '' }),
        h('div', { class: 'row', style: { marginTop: '16px' } },
          h('a', { class: 'btn primary', href: `#/exam/${id}/learn/${lastCh.id}` }, (seenSlides ? 'Continue' : 'Start') + ': Ch ' + lastCh.num + ' ' + lastCh.title + ' →'),
          p.activeMock ? h('a', { class: 'btn', href: `#/exam/${id}/mock/${p.activeMock.key}` }, '⏱ Resume mock exam') : h('a', { class: 'btn', href: `#/exam/${id}/mock/1` }, '⏱ Mock exam 1'),
          h('a', { class: 'btn ghost', href: `#/exam/${id}/intel` }, '🎯 Exam intel')));

      const kv = h('div', { class: 'kv', style: { marginTop: '18px' } },
        h('div', null, h('b', { text: Math.round((100 * seenSlides) / totalSlides) + '%' }), h('span', { text: `Slides viewed (${seenSlides}/${totalSlides})` })),
        h('div', null, h('b', { text: chs.filter((c) => KS.store.chapter(id, c.id).completed).length + '/' + chs.length }), h('span', { text: 'Chapters completed' })),
        h('div', null, h('b', { text: avgQuiz == null ? '–' : avgQuiz + '%' }), h('span', { text: 'Avg chapter-quiz best' })),
        h('div', null, h('b', { text: best ? best + '%' : '–', style: { color: best >= e.mock.pass ? 'var(--ok)' : '' } }), h('span', { text: `Best mock (${p.attempts.length} taken)` })),
        h('div', null, h('b', { text: allQuestions(e).length }), h('span', { text: 'Practice questions in bank' })));

      // domain bar
      const bar = h('div', { class: 'domain-bar' }, e.domains.map((d) => h('div', { style: { width: d.weight + '%', background: KS.color(d.color) }, title: d.name, text: d.weight + '%' })));
      const legend = h('div', { class: 'legend' }, e.domains.map((d) => h('span', { html: `<i style="background:${KS.color(d.color)}"></i>${d.name}` })));

      const groups = e.domains.map((d) => {
        const list = chs.filter((c) => c.domain === d.id);
        return h('div', { class: 'domain-group' },
          h('h3', null, h('span', { class: 'dot', style: { background: KS.color(d.color) } }), d.name, h('span', { class: 'pct', text: d.weight + '% of exam' }),
            h('a', { class: 'btn sm ghost', style: { marginLeft: 'auto' }, href: `#/exam/${id}/practice/${d.id}` }, 'Domain drill →')),
          h('div', { class: 'grid g3' }, list.map((c) => chapterCard(e, c))));
      });

      const mocks = h('div', { class: 'grid g3' },
        Array.from({ length: e.mock.sets }, (_, i) => mockCard(e, String(i + 1), `Mock exam ${i + 1}`, `${e.mock.questions} fixed questions · ${e.mock.minutes} min · blueprint-weighted`)),
        mockCard(e, 'random', 'Random mock', `${e.mock.questions} questions drawn fresh from the whole bank every time`),
        h('a', { class: 'card', href: `#/exam/${id}/drill` }, h('div', { class: 'card-icon', text: '🩹' }), h('h3', { text: 'Weak-area drill' }), h('p', { class: 'muted small', text: 'Practice mode with feedback: questions you got wrong or have not seen yet come first.' })));

      const history = p.attempts.length ? h('div', { class: 'panel', style: { marginTop: '14px' } },
        h('h3', { text: 'Attempt history' }),
        h('ul', { class: 'list-plain' }, p.attempts.slice().reverse().slice(0, 12).map((t) => h('li', { class: 'row' },
          h('span', { class: 'chip ' + (t.pass ? 'ok' : 'bad'), text: t.pass ? 'PASS' : 'FAIL' }),
          h('b', { text: t.score + '%' }), h('span', { text: t.title }),
          h('span', { class: 'muted small', text: new Date(t.date).toLocaleString() }),
          h('a', { class: 'btn sm', style: { marginLeft: 'auto' }, href: `#/exam/${id}/results/${t.id}` }, 'Review'))))) : null;

      const extras = h('div', { class: 'grid g3' },
        h('a', { class: 'card', href: `#/exam/${id}/flash/all` }, h('div', { class: 'card-icon', text: '🃏' }), h('h3', { text: 'Flashcards' }), h('p', { class: 'muted small', text: chs.reduce((a, c) => a + (c.glossary || []).length, 0) + ' key terms across every chapter.' })),
        h('a', { class: 'card', href: `#/exam/${id}/intel` }, h('div', { class: 'card-icon', text: '🎯' }), h('h3', { text: 'Exam intel' }), h('p', { class: 'muted small', text: 'Format, blueprint, what candidates report seeing, traps and exam-day checklist.' })),
        h('a', { class: 'card', href: `#/exam/${id}/library` }, h('div', { class: 'card-icon', text: '📚' }), h('h3', { text: 'Library' }), h('p', { class: 'muted small', text: 'Your saved artifacts, cheat sheets and official references.' })));

      shell([{ label: e.short }], h('main', { class: 'wrap' }, hero, kv,
        h('section', { class: 'section' }, h('div', { class: 'section-head' }, h('h2', { text: 'Exam blueprint' }), h('span', { class: 'muted small', text: 'Official CNCF curriculum weights' })), bar, legend),
        h('section', { class: 'section' }, h('div', { class: 'section-head' }, h('h2', { text: 'Chapters' }), h('span', { class: 'muted small', text: chs.length + ' chapters · ' + totalSlides + ' slides' })), groups),
        h('section', { class: 'section' }, h('div', { class: 'section-head' }, h('h2', { text: 'Mock exams' }), h('span', { class: 'muted small', text: `Timed like the real thing: ${e.mock.questions} questions in ${e.mock.minutes} minutes` })), mocks, history),
        h('section', { class: 'section' }, h('div', { class: 'section-head' }, h('h2', { text: 'Tools' })), extras)));
    });
  });

  function chapterCard(e, c) {
    const st = KS.store.chapter(e.id, c.id);
    const total = c.slides.length + 2;
    const pct = Math.round((100 * Math.min(st.viewed.length, total)) / total);
    return h('div', { class: 'card chapter-card', style: { borderLeft: '3px solid ' + domainColor(e, c.domain) } },
      h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('span', { class: 'num', text: 'CH ' + String(c.num).padStart(2, '0') }), st.completed ? h('span', { class: 'chip ok', text: '✓ done' }) : null),
      h('div', { class: 'row', style: { gap: '10px', flexWrap: 'nowrap', alignItems: 'flex-start' } }, h('div', { class: 'card-icon', text: c.icon || '📘' }), h('div', null, h('h3', { text: c.title }), h('div', { class: 'muted small', html: c.subtitle || '' }))),
      h('div', { class: 'bar' + (pct === 100 ? ' ok' : '') }, h('span', { style: { width: pct + '%' } })),
      h('div', { class: 'meta' }, h('span', { class: 'chip', text: total + ' slides' }), h('span', { class: 'chip', text: (c.quiz || []).length + ' quiz Qs' }),
        st.quizBest != null ? h('span', { class: 'chip ' + (st.quizBest >= 75 ? 'ok' : 'warn'), text: 'quiz ' + st.quizBest + '%' }) : null),
      h('div', { class: 'actions' }, h('a', { class: 'btn sm primary', href: `#/exam/${e.id}/learn/${c.id}` }, pct ? 'Continue' : 'Learn'), h('a', { class: 'btn sm', href: `#/exam/${e.id}/quiz/${c.id}` }, 'Quiz'), (c.glossary || []).length ? h('a', { class: 'btn sm ghost', href: `#/exam/${e.id}/flash/${c.id}` }, 'Cards') : null));
  }
  function mockCard(e, key, title, desc) {
    const p = KS.store.exam(e.id);
    const tries = p.attempts.filter((t) => t.key === key);
    const best = tries.reduce((a, t) => Math.max(a, t.score), 0);
    const active = p.activeMock && p.activeMock.key === key;
    return h('a', { class: 'card', href: `#/exam/${e.id}/mock/${key}` },
      h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('div', { class: 'card-icon', text: key === 'random' ? '🎲' : '⏱️' }), active ? h('span', { class: 'chip warn', text: 'in progress' }) : tries.length ? h('span', { class: 'chip ' + (best >= e.mock.pass ? 'ok' : 'bad'), text: 'best ' + best + '%' }) : null),
      h('h3', { text: title }), h('p', { class: 'muted small', text: desc }));
  }

  /* ---------------- DECK ---------------- */
  KS.route('/exam/:id/learn/:ch', (p) => deck(p.id, p.ch, 0));
  KS.route('/exam/:id/learn/:ch/:n', (p) => deck(p.id, p.ch, parseInt(p.n, 10) - 1 || 0));

  function buildSlides(e, c) {
    const cover = { _cover: true };
    const end = { _end: true };
    return [cover].concat(c.slides, [end]);
  }
  function deck(id, chId, start) {
    return getExam(id).then((e) => {
      const c = e.chapterList.find((x) => x.id === chId);
      if (!c) throw new Error('Chapter not found: ' + chId);
      const slides = buildSlides(e, c);
      const st = KS.store.chapter(id, c.id);
      let i = Math.max(0, Math.min(start, slides.length - 1));
      let ctx = { steppers: [] };

      const prog = h('span');
      const counter = h('span', { class: 'muted small' });
      const stage = h('div', { class: 'deck-stage' });
      const dots = h('div', { class: 'dots' });
      const prevBtn = h('button', { class: 'btn', onclick: () => go(i - 1) }, '← Prev');
      const nextBtn = h('button', { class: 'btn primary', onclick: () => next() }, 'Next →');
      const deckEl = h('div', { class: 'deck' },
        h('div', { class: 'deck-head' },
          h('a', { class: 'btn sm ghost', href: `#/exam/${id}` }, '✕'),
          h('span', { class: 'chip', style: { borderColor: domainColor(e, c.domain), color: domainColor(e, c.domain) }, text: (e.domainById[c.domain] || {}).name || '' }),
          h('span', { class: 'title', text: `Ch ${c.num} · ${c.title}` }),
          h('div', { class: 'spacer' }), counter,
          h('a', { class: 'btn sm', href: `#/exam/${id}/quiz/${c.id}` }, 'Quiz'),
          h('button', { class: 'btn sm', title: 'Fullscreen (F)', onclick: () => toggleFs() }, '⛶')),
        h('div', { class: 'deck-progress' }, prog), stage,
        h('div', { class: 'deck-foot' }, prevBtn, dots, nextBtn));
      shell([{ label: e.short, href: '#/exam/' + id }, { label: 'Ch ' + c.num }], deckEl, { noFooter: true });

      function toggleFs() {
        const el = document.documentElement;
        if (!document.fullscreenElement) { (el.requestFullscreen ? el.requestFullscreen() : Promise.resolve()).catch(() => {}); } else document.exitFullscreen();
      }
      function next() {
        const s = ctx.steppers.find((x) => x.pending());
        if (s) return s.next();
        go(i + 1);
      }
      function go(n) {
        if (n < 0) return;
        if (n >= slides.length) { location.hash = `#/exam/${id}/quiz/${c.id}`; return; }
        // stop per-slide timers (diagram autoplay); keep the deck key handler alive
        KS.cleanup.splice(0).forEach((fn) => { try { fn(); } catch (_) {} });
        document.addEventListener('keydown', onKey);
        KS.onLeave(() => document.removeEventListener('keydown', onKey));
        i = n; render();
        history.replaceState(null, '', `#/exam/${id}/learn/${c.id}/${i + 1}`);
      }
      function render() {
        ctx = { steppers: [] };
        stage.innerHTML = '';
        stage.appendChild(renderSlide(e, c, slides[i], ctx));
        stage.scrollTop = 0; window.scrollTo(0, 0);
        if (!st.viewed.includes(i)) st.viewed.push(i);
        if (i === slides.length - 1) st.completed = true;
        st.last = i; KS.store.save();
        prog.style.width = ((i + 1) / slides.length) * 100 + '%';
        counter.textContent = `${i + 1} / ${slides.length}`;
        prevBtn.disabled = i === 0;
        nextBtn.textContent = i === slides.length - 1 ? 'Take the quiz →' : 'Next →';
        dots.innerHTML = '';
        slides.forEach((_, j) => dots.appendChild(h('button', { class: (j === i ? 'cur ' : '') + (st.viewed.includes(j) ? 'seen' : ''), title: 'Slide ' + (j + 1), onclick: () => go(j) })));
      }
      function onKey(ev) {
        if (/input|textarea|select/i.test((ev.target || {}).tagName)) return;
        if (ev.key === 'ArrowRight' || ev.key === 'PageDown' || ev.key === ' ') { ev.preventDefault(); next(); }
        else if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') { ev.preventDefault(); go(i - 1); }
        else if (ev.key === 'f' || ev.key === 'F') toggleFs();
        else if (ev.key === 'Escape' && !document.fullscreenElement) location.hash = '#/exam/' + id;
      }
      // touch swipe
      let tx = null;
      stage.addEventListener('touchstart', (ev) => { tx = ev.touches[0].clientX; }, { passive: true });
      stage.addEventListener('touchend', (ev) => { if (tx == null) return; const dx = ev.changedTouches[0].clientX - tx; if (Math.abs(dx) > 70) (dx < 0 ? next() : go(i - 1)); tx = null; });
      document.addEventListener('keydown', onKey);
      KS.onLeave(() => document.removeEventListener('keydown', onKey));
      render();
    });
  }

  function renderSlide(e, c, s, ctx) {
    if (s._cover) {
      const d = e.domainById[c.domain] || {};
      return h('article', { class: 'slide cover' },
        h('div', { class: 'big-icon', text: c.icon || '📘' }),
        h('div', { class: 'kicker', text: `Chapter ${c.num} · ${d.name || ''} (${d.weight || '?'}% of exam)` }),
        h('h1', { text: c.title }),
        h('div', { class: 'sub', html: c.subtitle || '' }),
        c.objectives ? h('div', null, h('h3', { style: { marginTop: '26px' }, text: 'By the end of this chapter you can…' }), h('ul', { class: 'objectives' }, c.objectives.map((o) => h('li', { html: o })))) : null,
        h('p', { class: 'muted small', style: { marginTop: '20px' }, html: `${c.slides.length + 2} slides · ~${c.minutes || Math.round(c.slides.length * 2.5)} min · ${(c.quiz || []).length}-question quiz at the end. Navigate with <kbd>←</kbd> <kbd>→</kbd> or <kbd>Space</kbd>, <kbd>F</kbd> for fullscreen.` }));
    }
    if (s._end) {
      const nextCh = e.chapterList[c.num];
      return h('article', { class: 'slide' },
        h('div', { class: 'kicker', text: 'Chapter recap' }),
        h('h2', { class: 'slide-title', text: '🧠 What to remember for the exam' }),
        h('ul', { class: 'b-bullets' }, (c.summary || []).map((x) => h('li', { html: x }))),
        h('div', { class: 'row', style: { marginTop: '24px' } },
          h('a', { class: 'btn primary', href: `#/exam/${e.id}/quiz/${c.id}` }, `✅ Take the ${(c.quiz || []).length}-question quiz`),
          (c.glossary || []).length ? h('a', { class: 'btn', href: `#/exam/${e.id}/flash/${c.id}` }, `🃏 ${(c.glossary || []).length} flashcards`) : null,
          nextCh ? h('a', { class: 'btn ghost', href: `#/exam/${e.id}/learn/${nextCh.id}` }, `Next: Ch ${nextCh.num} ${nextCh.title} →`) : null));
    }
    return h('article', { class: 'slide' },
      s.kicker ? h('div', { class: 'kicker', html: s.kicker }) : null,
      s.title ? h('h2', { class: 'slide-title', html: s.title }) : null,
      KS.renderBlocks(s.blocks, ctx),
      s.tip ? h('div', { class: 'tip-box', html: '<b>🎯 Exam tip:</b> ' + s.tip }) : null);
  }

  /* ---------------- PRACTICE QUIZ (feedback per question) ---------------- */
  KS.route('/exam/:id/quiz/:ch', ({ id, ch }) => getExam(id).then((e) => {
    const c = e.chapterList.find((x) => x.id === ch);
    if (!c) throw new Error('Chapter not found');
    practice(e, KS.shuffle(c.quiz || []), { title: `Ch ${c.num} quiz · ${c.title}`, chapter: c, back: `#/exam/${id}` });
  }));
  KS.route('/exam/:id/practice/:domain', ({ id, domain }) => getExam(id).then((e) => {
    const d = e.domainById[domain];
    const qs = KS.shuffle(allQuestions(e).filter((q) => q.domain === domain)).slice(0, 20);
    practice(e, qs, { title: `Domain drill · ${d ? d.name : domain}`, back: `#/exam/${id}` });
  }));
  KS.route('/exam/:id/drill', ({ id }) => getExam(id).then((e) => {
    const stats = KS.store.exam(id).qstats;
    const score = (q) => { const s = stats[q.id]; if (!s) return 1; if (s.last === 0) return 0; return 2 + s.correct / s.seen; };
    const qs = KS.shuffle(allQuestions(e)).sort((a, b) => score(a) - score(b)).slice(0, 20);
    practice(e, qs, { title: 'Weak-area drill', back: `#/exam/${id}` });
  }));

  function practice(e, questions, opts) {
    let idx = 0, correct = 0;
    const missed = [];
    const wrap = h('main', { class: 'quiz-wrap' });
    shell([{ label: e.short, href: '#/exam/' + e.id }, { label: opts.title }], wrap);
    if (!questions.length) { wrap.appendChild(h('div', { class: 'empty', text: 'No questions here yet.' })); return; }
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
      const nextBtn = h('button', { class: 'btn primary', style: { display: 'none' }, onclick: () => { idx++; show(); } }, idx === questions.length - 1 ? 'Finish' : 'Next question →');
      const checkBtn = h('button', { class: 'btn primary', style: { display: multi ? '' : 'none' }, disabled: true, onclick: () => grade() }, 'Check answer');
      const btns = order.map((oi, k) => {
        const b = h('button', { class: 'opt' + (multi ? ' multi' : ''), html: `<span class="key">${multi ? '' : String.fromCharCode(65 + k)}</span><span>${q.options[oi]}</span>` });
        b.addEventListener('click', () => {
          if (locked) return;
          if (multi) { picked.has(oi) ? picked.delete(oi) : picked.add(oi); b.classList.toggle('sel'); b.querySelector('.key').textContent = picked.has(oi) ? '✓' : ''; checkBtn.disabled = picked.size !== need; }
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
        KS.store.recordAnswer(e.id, q.id, ok); KS.store.save();
        exp.appendChild(h('div', { class: 'explain', html: `<div class="verdict ${ok ? 'ok' : 'bad'}">${ok ? '✓ Correct' : '✗ Incorrect'}</div>${q.explain || ''}` }));
        checkBtn.style.display = 'none'; nextBtn.style.display = ''; nextBtn.focus();
      }
      const d = e.domainById[q.domain] || {};
      wrap.appendChild(h('div', { class: 'row', style: { marginBottom: '12px' } }, h('div', { class: 'bar', style: { flex: 1 } }, h('span', { style: { width: (idx / questions.length) * 100 + '%' } })), h('span', { class: 'muted small', text: `${idx + 1}/${questions.length} · ${correct} correct` })));
      wrap.appendChild(h('div', { class: 'q-card' },
        h('div', { class: 'q-meta' }, h('span', { class: 'chip', style: { color: KS.color(d.color) }, text: d.name || '' }), multi ? h('span', { class: 'chip warn', text: `Select ${need}` }) : null),
        h('div', { class: 'q-text', html: q.q }), btns, exp,
        h('div', { class: 'q-foot' }, h('a', { class: 'btn ghost sm', href: opts.back }, 'Exit'), h('div', { class: 'row' }, checkBtn, nextBtn))));
    };
    const finish = () => {
      const pct = Math.round((100 * correct) / questions.length);
      if (opts.chapter) {
        const st = KS.store.chapter(e.id, opts.chapter.id);
        st.quizBest = Math.max(st.quizBest || 0, pct); st.quizAttempts = (st.quizAttempts || 0) + 1; KS.store.save();
      }
      const pass = pct >= e.mock.pass;
      wrap.appendChild(h('div', { class: 'q-card' },
        h('div', { class: 'result-hero' },
          h('div', { class: 'ring', html: KS.ring(pct, pass ? 'var(--ok)' : 'var(--warn)') + `<div class="rv"><b>${pct}%</b><span>${correct}/${questions.length}</span></div>` }),
          h('div', null, h('h2', { text: pass ? '🎉 Nice work!' : '📚 Keep going' }), h('p', { class: 'muted', text: pass ? `You are above the ${e.mock.pass}% pass mark on this set.` : `Aim for ${e.mock.pass}%+ before moving on. Review the explanations below.` }),
            h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => { questions = KS.shuffle(questions); idx = 0; correct = 0; missed.length = 0; show(); } }, '↺ Retry'),
              opts.chapter ? h('a', { class: 'btn', href: `#/exam/${e.id}/learn/${opts.chapter.id}` }, 'Review slides') : null,
              h('a', { class: 'btn ghost', href: opts.back }, 'Back to overview'))))));
      if (missed.length) {
        wrap.appendChild(h('h3', { style: { margin: '26px 0 12px' }, text: `Review your ${missed.length} miss${missed.length === 1 ? '' : 'es'}` }));
        missed.forEach((m) => wrap.appendChild(reviewItem(e, m.q, m.picked, null)));
      }
    };
    show();
  }

  function reviewItem(e, q, picked, order, num) {
    const ans = asArr(q.answer);
    picked = picked || [];
    order = order || q.options.map((_, i) => i);
    const ok = isCorrect(q, picked);
    const d = e.domainById[q.domain] || {};
    return h('div', { class: 'review-item', id: num ? 'rq' + num : null },
      h('div', { class: 'q-meta' }, h('span', { class: 'row', style: { gap: '8px' } }, num ? h('b', { text: '#' + num }) : null, h('span', { class: 'chip ' + (ok ? 'ok' : picked.length ? 'bad' : 'warn'), text: ok ? 'Correct' : picked.length ? 'Incorrect' : 'Unanswered' })), h('span', { class: 'chip', style: { color: KS.color(d.color) }, text: d.name || '' })),
      h('div', { class: 'q-text', html: q.q }),
      order.map((oi, k) => h('div', { class: 'opt' + (ans.includes(oi) ? ' correct' : picked.includes(oi) ? ' wrong' : ''), html: `<span class="key">${String.fromCharCode(65 + k)}</span><span>${q.options[oi]}${picked.includes(oi) ? ' <span class="muted small">(your answer)</span>' : ''}</span>` })),
      h('div', { class: 'explain', html: q.explain || '' }));
  }

  /* ---------------- MOCK EXAM ---------------- */
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
    const out = [];
    const used = new Set();
    e.domains.forEach((d, di) => {
      const need = counts[di];
      let chosen = [];
      if (key === 'random') {
        chosen = KS.shuffle(allQuestions(e).filter((q) => q.domain === d.id)).slice(0, need);
      } else {
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
    const rand = key === 'random' ? Math.random : KS.rng(hashStr(e.id + 'order' + key));
    return KS.shuffle(out, rand);
  }

  KS.route('/exam/:id/mock/:key', ({ id, key }) => getExam(id).then((e) => {
    const p = KS.store.exam(id);
    if (p.activeMock && p.activeMock.key === key) return runMock(e, p.activeMock);
    const title = key === 'random' ? 'Random mock exam' : 'Mock exam ' + key;
    const prev = p.attempts.filter((t) => t.key === key);
    const other = p.activeMock && p.activeMock.key !== key;
    const counts = allocate(e.mock.questions, e.domains);
    shell([{ label: e.short, href: '#/exam/' + id }, { label: title }], h('main', { class: 'quiz-wrap' }, h('div', { class: 'q-card' },
      h('div', { class: 'kicker', style: { color: 'var(--accent-2)', fontWeight: 700, fontSize: '.78rem', letterSpacing: '.12em', textTransform: 'uppercase' }, text: e.short + ' simulation' }),
      h('h1', { text: title }),
      h('div', { class: 'kv', style: { margin: '16px 0' } },
        h('div', null, h('b', { text: e.mock.questions }), h('span', { text: 'questions' })),
        h('div', null, h('b', { text: e.mock.minutes + ' min' }), h('span', { text: 'time limit' })),
        h('div', null, h('b', { text: e.mock.pass + '%' }), h('span', { text: 'to pass' })),
        h('div', null, h('b', { text: prev.length }), h('span', { text: 'previous attempts' }))),
      h('h3', { text: 'Question mix (same as the real blueprint)' }),
      h('div', null, e.domains.map((d, i) => h('div', { class: 'dom-row' }, h('span', { html: `<span class="dot" style="background:${KS.color(d.color)}"></span> ${d.name}` }), h('div', { class: 'bar' }, h('span', { style: { width: d.weight + '%', background: KS.color(d.color) } })), h('b', { text: counts[i] + ' Qs' })))),
      h('div', { class: 'b-callout info', style: { marginTop: '18px' } }, h('span', { class: 'ct', text: 'Exam conditions' }), h('div', { html: 'No feedback until you submit. You can <b>flag</b> questions and jump around with the navigator. Some questions ask you to <b>select multiple</b> answers; all must be right to score. The timer keeps running if you leave the page, just like the real exam.' })),
      other ? h('div', { class: 'b-callout warn', style: { marginTop: '12px' } }, h('span', { class: 'ct', text: 'Another mock is in progress' }), h('div', { html: `Starting this one discards your unfinished <b>${p.activeMock.title}</b>.` })) : null,
      h('div', { class: 'q-foot' }, h('a', { class: 'btn ghost', href: '#/exam/' + id }, 'Back'),
        h('button', { class: 'btn primary', onclick: () => {
          const qs = buildMock(e, key);
          p.activeMock = { key, title, qids: qs.map((q) => q.id), orders: qs.map((q) => KS.shuffle(q.options.map((_, i) => i))), answers: {}, flags: {}, start: Date.now(), duration: e.mock.minutes * 60, cur: 0 };
          KS.store.save(); runMock(e, p.activeMock);
        } }, '▶ Start the clock')))));
  }));

  function runMock(e, m) {
    const qs = m.qids.map((id) => e.questionIndex[id]).filter(Boolean);
    const timerEl = h('span', { class: 'timer' });
    const counter = h('span', { class: 'muted small' });
    const flagBtn = h('button', { class: 'btn sm', onclick: () => { m.flags[m.cur] = !m.flags[m.cur]; KS.store.save(); render(); } });
    const drawer = h('div', { class: 'drawer' });
    const body = h('div', { class: 'quiz-wrap' });
    const head = h('div', { class: 'mock-head' }, h('b', { text: m.title }), counter, h('div', { class: 'spacer' }), timerEl, flagBtn,
      h('button', { class: 'btn sm', onclick: () => openNav() }, '☰ Navigator'),
      h('button', { class: 'btn sm primary', onclick: () => confirmSubmit() }, 'Submit'));
    shell([{ label: e.short, href: '#/exam/' + e.id }, { label: m.title }], h('main', null, head, body, drawer), { noFooter: true });

    const tick = () => {
      const left = m.duration - (Date.now() - m.start) / 1000;
      timerEl.textContent = '⏱ ' + KS.fmtTime(left);
      timerEl.classList.toggle('low', left < 300);
      if (left <= 0) { clearInterval(iv); submit(true); }
    };
    const iv = setInterval(tick, 1000); tick();
    KS.onLeave(() => clearInterval(iv));
    const onKey = (ev) => { if (ev.key === 'ArrowRight') go(m.cur + 1); else if (ev.key === 'ArrowLeft') go(m.cur - 1); };
    document.addEventListener('keydown', onKey);
    KS.onLeave(() => document.removeEventListener('keydown', onKey));

    function go(n) { if (n < 0 || n >= qs.length) return; m.cur = n; KS.store.save(); render(); }
    function render() {
      const q = qs[m.cur];
      const order = m.orders[m.cur];
      const multi = Array.isArray(q.answer);
      const need = multi ? q.answer.length : 1;
      const picked = new Set(m.answers[m.cur] || []);
      const answered = Object.keys(m.answers).filter((k) => (m.answers[k] || []).length).length;
      counter.textContent = `Question ${m.cur + 1} of ${qs.length} · ${answered} answered`;
      flagBtn.textContent = m.flags[m.cur] ? '🚩 Flagged' : '⚐ Flag';
      body.innerHTML = '';
      const btns = order.map((oi, k) => {
        const b = h('button', { class: 'opt' + (multi ? ' multi' : '') + (picked.has(oi) ? ' sel' : ''), html: `<span class="key">${multi ? (picked.has(oi) ? '✓' : '') : String.fromCharCode(65 + k)}</span><span>${q.options[oi]}</span>` });
        b.addEventListener('click', () => {
          if (multi) { if (picked.has(oi)) picked.delete(oi); else { if (picked.size >= need) return KS.toast(`Select only ${need}. Unselect one first.`); picked.add(oi); } }
          else { picked.clear(); picked.add(oi); }
          m.answers[m.cur] = [...picked]; KS.store.save(); render();
        });
        return b;
      });
      body.appendChild(h('div', { class: 'q-card' },
        h('div', { class: 'q-meta' }, h('b', { text: 'Question ' + (m.cur + 1) }), multi ? h('span', { class: 'chip warn', text: `Select ${need}` }) : h('span', { class: 'chip', text: 'Select 1' })),
        h('div', { class: 'q-text', html: q.q }), btns,
        h('div', { class: 'q-foot' },
          h('button', { class: 'btn', disabled: m.cur === 0, onclick: () => go(m.cur - 1) }, '← Previous'),
          m.cur === qs.length - 1 ? h('button', { class: 'btn primary', onclick: () => confirmSubmit() }, 'Review & submit') : h('button', { class: 'btn primary', onclick: () => go(m.cur + 1) }, 'Next →'))));
      body.appendChild(h('div', { class: 'panel', style: { marginTop: '16px' } }, navGrid()));
    }
    function navGrid() {
      return h('div', null, h('div', { class: 'row small muted', style: { marginBottom: '10px' }, html: '<span class="chip accent">answered</span><span class="chip warn">● flagged</span><span>Click a number to jump</span>' }),
        h('div', { class: 'navgrid' }, qs.map((_, i) => h('button', { class: ((m.answers[i] || []).length ? 'ans ' : '') + (m.flags[i] ? 'flag ' : '') + (i === m.cur ? 'cur' : ''), onclick: () => { drawer.classList.remove('open'); go(i); }, text: i + 1 }))));
    }
    function openNav() {
      drawer.innerHTML = '';
      drawer.appendChild(h('div', { class: 'scrim', onclick: () => drawer.classList.remove('open') }));
      drawer.appendChild(h('div', { class: 'sheet' }, h('h3', { text: 'Navigator' }), navGrid()));
      drawer.classList.add('open');
    }
    function confirmSubmit() {
      const unanswered = qs.filter((_, i) => !(m.answers[i] || []).length).length;
      const flagged = Object.values(m.flags).filter(Boolean).length;
      drawer.innerHTML = '';
      drawer.appendChild(h('div', { class: 'scrim', onclick: () => drawer.classList.remove('open') }));
      drawer.appendChild(h('div', { class: 'sheet' },
        h('h2', { text: 'Submit exam?' }),
        h('p', { class: 'muted', html: `<b>${unanswered}</b> unanswered · <b>${flagged}</b> flagged. Unanswered questions score zero, so there is no penalty for guessing.` }),
        navGrid(),
        h('div', { class: 'row', style: { marginTop: '18px' } }, h('button', { class: 'btn', onclick: () => drawer.classList.remove('open') }, 'Keep working'), h('button', { class: 'btn primary', onclick: () => submit(false) }, 'Submit now'))));
      drawer.classList.add('open');
    }
    function submit(timeout) {
      clearInterval(iv);
      const p = KS.store.exam(e.id);
      let correct = 0;
      const byDomain = {};
      qs.forEach((q, i) => {
        const ok = isCorrect(q, m.answers[i]);
        if (ok) correct++;
        const bd = (byDomain[q.domain] = byDomain[q.domain] || { c: 0, t: 0 }); bd.t++; if (ok) bd.c++;
        KS.store.recordAnswer(e.id, q.id, ok);
      });
      const score = Math.round((100 * correct) / qs.length);
      const att = { id: Date.now().toString(36), key: m.key, title: m.title, date: Date.now(), qids: m.qids, orders: m.orders, answers: m.answers, flags: m.flags, correct, total: qs.length, score, pass: score >= e.mock.pass, byDomain, timeUsed: Math.min(m.duration, Math.round((Date.now() - m.start) / 1000)), timeout: !!timeout };
      p.attempts.push(att);
      delete p.activeMock;
      KS.store.save();
      location.hash = `#/exam/${e.id}/results/${att.id}`;
    }
    render();
  }

  /* ---------------- RESULTS ---------------- */
  KS.route('/exam/:id/results/:aid', ({ id, aid }) => getExam(id).then((e) => {
    const t = KS.store.exam(id).attempts.find((x) => x.id === aid);
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
    const grid = h('div', { class: 'navgrid', style: { marginTop: '12px' } }, qs.map((q, i) => h('button', { class: q && isCorrect(q, t.answers[i]) ? 'r-ok' : 'r-bad', onclick: () => { filter = 'all'; [...seg.children].forEach((x, j) => x.classList.toggle('on', j === 0)); renderList(); const el = document.getElementById('rq' + (i + 1)); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, text: i + 1 })));
    shell([{ label: e.short, href: '#/exam/' + id }, { label: 'Results' }], h('main', { class: 'quiz-wrap' },
      h('div', { class: 'q-card' },
        h('div', { class: 'result-hero' },
          h('div', { class: 'ring', html: KS.ring(t.score, t.pass ? 'var(--ok)' : 'var(--bad)') + `<div class="rv"><b>${t.score}%</b><span>${t.correct}/${t.total}</span></div>` }),
          h('div', { style: { flex: 1, minWidth: '240px' } },
            h('span', { class: 'chip ' + (t.pass ? 'ok' : 'bad'), text: t.pass ? 'PASS' : 'FAIL' }),
            h('h2', { style: { marginTop: '10px' }, text: t.pass ? 'You would have passed! 🎉' : `Not yet: ${e.mock.pass}% needed` }),
            h('p', { class: 'muted', html: `${t.title} · ${new Date(t.date).toLocaleString()} · time used <b>${KS.fmtTime(t.timeUsed)}</b> of ${e.mock.minutes}:00${t.timeout ? ' (time ran out)' : ''}` }),
            weakest ? h('p', { html: `Weakest domain: <b>${weakest.d.name}</b> (${Math.round((100 * weakest.r.c) / weakest.r.t)}%). <a href="#/exam/${id}/practice/${weakest.d.id}">Drill it →</a>` }) : null,
            h('div', { class: 'row' }, h('a', { class: 'btn primary', href: `#/exam/${id}/mock/${t.key}` }, '↺ Retake'), h('a', { class: 'btn', href: `#/exam/${id}/drill` }, '🩹 Weak-area drill'), h('a', { class: 'btn ghost', href: '#/exam/' + id }, 'Overview')))),
        h('h3', { style: { marginTop: '22px' }, text: 'Score by domain' }),
        e.domains.map((d) => { const r = t.byDomain[d.id] || { c: 0, t: 0 }; const pct = r.t ? Math.round((100 * r.c) / r.t) : 0; return h('div', { class: 'dom-row' }, h('span', { html: `<span class="dot" style="background:${KS.color(d.color)}"></span> ${d.name} <span class="muted small">(${d.weight}%)</span>` }), h('div', { class: 'bar' }, h('span', { style: { width: pct + '%', background: pct >= e.mock.pass ? 'var(--ok)' : 'var(--bad)' } })), h('b', { text: `${r.c}/${r.t}` })); }),
        grid),
      h('div', { class: 'row', style: { justifyContent: 'space-between', margin: '26px 0 12px' } }, h('h2', { style: { margin: 0 }, text: 'Review answers' }), seg),
      list));
    renderList();
  }));

  /* ---------------- FLASHCARDS ---------------- */
  KS.route('/exam/:id/flash/:ch', ({ id, ch }) => getExam(id).then((e) => {
    const chs = ch === 'all' ? e.chapterList : e.chapterList.filter((c) => c.id === ch);
    const p = KS.store.exam(id);
    let cards = [];
    chs.forEach((c) => (c.glossary || []).forEach((g) => cards.push(Object.assign({ ch: c }, g))));
    let onlyUnknown = false;
    let deckCards = KS.shuffle(cards), i = 0;
    const wrap = h('main', { class: 'quiz-wrap' });
    const label = ch === 'all' ? 'All flashcards' : 'Flashcards · Ch ' + chs[0].num;
    shell([{ label: e.short, href: '#/exam/' + id }, { label }], wrap);
    const onKey = (ev) => { if (ev.key === ' ') { ev.preventDefault(); const f = wrap.querySelector('.fc'); if (f) f.classList.toggle('on'); } else if (ev.key === '1') mark('again'); else if (ev.key === '2') mark('known'); };
    document.addEventListener('keydown', onKey);
    KS.onLeave(() => document.removeEventListener('keydown', onKey));
    function mark(v) { const c = deckCards[i]; if (!c) return; p.flash[c.term] = v; KS.store.save(); i++; render(); }
    function render() {
      wrap.innerHTML = '';
      const known = cards.filter((c) => p.flash[c.term] === 'known').length;
      wrap.appendChild(h('div', { class: 'row', style: { justifyContent: 'space-between', marginBottom: '14px' } },
        h('h2', { style: { margin: 0 }, text: '🃏 ' + label }),
        h('div', { class: 'row' }, h('span', { class: 'chip ok', text: `${known}/${cards.length} known` }),
          h('button', { class: 'btn sm', onclick: () => { onlyUnknown = !onlyUnknown; deckCards = KS.shuffle(onlyUnknown ? cards.filter((c) => p.flash[c.term] !== 'known') : cards); i = 0; render(); } }, onlyUnknown ? 'Show all' : 'Only unknown'),
          h('button', { class: 'btn sm', onclick: () => { deckCards = KS.shuffle(deckCards); i = 0; render(); } }, '🔀 Shuffle'))));
      if (i >= deckCards.length) {
        wrap.appendChild(h('div', { class: 'q-card', style: { textAlign: 'center' } }, h('h2', { text: deckCards.length ? '🎉 Deck complete' : 'No cards to show' }), h('p', { class: 'muted', text: `${known} of ${cards.length} terms marked as known.` }), h('div', { class: 'row', style: { justifyContent: 'center' } }, h('button', { class: 'btn primary', onclick: () => { deckCards = KS.shuffle(cards.filter((c) => p.flash[c.term] !== 'known')); onlyUnknown = true; i = 0; render(); } }, 'Study unknown cards'), h('a', { class: 'btn', href: '#/exam/' + id }, 'Back'))));
        return;
      }
      const c = deckCards[i];
      const fc = h('div', { class: 'fc' }, h('div', { class: 'face front' }, h('small', { text: 'Ch ' + c.ch.num + ' · ' + c.ch.title }), h('div', { html: c.term })), h('div', { class: 'face back' }, h('small', { text: c.term }), h('div', { html: c.def })));
      fc.addEventListener('click', () => fc.classList.toggle('on'));
      wrap.appendChild(h('div', { class: 'bar', style: { marginBottom: '16px' } }, h('span', { style: { width: (i / deckCards.length) * 100 + '%' } })));
      wrap.appendChild(h('div', { class: 'fc-stage' }, fc));
      wrap.appendChild(h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '20px' } },
        h('button', { class: 'btn', onclick: () => mark('again') }, '↺ Again (1)'),
        h('button', { class: 'btn', onclick: () => fc.classList.toggle('on') }, 'Flip (Space)'),
        h('button', { class: 'btn primary', onclick: () => mark('known') }, '✓ Got it (2)')));
      wrap.appendChild(h('p', { class: 'muted small', style: { textAlign: 'center', marginTop: '10px' }, text: `Card ${i + 1} of ${deckCards.length}` }));
    }
    render();
  }));

  /* ---------------- INTEL ---------------- */
  KS.route('/exam/:id/intel', ({ id }) => getExam(id).then((e) => {
    const ctx = { steppers: [] };
    const intel = e.intel || { sections: [] };
    shell([{ label: e.short, href: '#/exam/' + id }, { label: 'Exam intel' }], h('main', { class: 'wrap' },
      h('h1', { text: '🎯 ' + e.short + ' exam intel' }),
      intel.intro ? h('p', { class: 'muted', html: intel.intro }) : null,
      intel.sections.map((s) => h('section', { class: 'section' }, h('h2', { html: (s.icon ? s.icon + ' ' : '') + s.title }), h('div', { class: 'panel' }, KS.renderBlocks(s.blocks, ctx))))));
  }));

  /* ---------------- LIBRARY ---------------- */
  KS.route('/exam/:id/library', ({ id }) => getExam(id).then((e) => {
    const items = e.library || [];
    const groups = {};
    items.forEach((it, i) => { (groups[it.group || 'Resources'] = groups[it.group || 'Resources'] || []).push([it, i]); });
    shell([{ label: e.short, href: '#/exam/' + id }, { label: 'Library' }], h('main', { class: 'wrap' },
      h('h1', { text: '📚 Library' }),
      h('p', { class: 'muted', html: 'Saved artifacts, cheat sheets and official references. To add your own, drop an HTML file into <code>exams/' + id + '/library/</code> or paste a Claude artifact link into the <code>library</code> list in <code>exams/' + id + '/exam.js</code>.' }),
      Object.entries(groups).map(([g, list]) => h('section', { class: 'section' }, h('h2', { text: g }), h('div', { class: 'grid g3' }, list.map(([it, i]) => {
        const local = it.kind === 'page' || it.kind === 'route';
        return h('a', { class: 'card', href: it.kind === 'route' ? it.url : local ? `#/exam/${id}/lib/${i}` : it.url, target: local ? null : '_blank', rel: local ? null : 'noopener' },
          h('div', { class: 'card-icon', text: it.icon || (local ? '🧩' : '🔗') }), h('h3', { text: it.title }), it.note ? h('p', { class: 'muted small', html: it.note }) : null,
          h('span', { class: 'chip', text: local ? 'opens here' : 'external ↗' }));
      }))))));
  }));
  /* ---------------- CHEAT SHEET (generated from chapter summaries + glossary) ---------------- */
  KS.route('/exam/:id/cheatsheet', ({ id }) => getExam(id).then((e) => {
    shell([{ label: e.short, href: '#/exam/' + id }, { label: 'Cheat sheet' }], h('main', { class: 'wrap' },
      h('div', { class: 'row no-print', style: { justifyContent: 'space-between' } }, h('h1', { style: { margin: 0 }, text: '🧾 ' + e.short + ' cheat sheet' }), h('button', { class: 'btn', onclick: () => window.print() }, '🖨 Print / save PDF')),
      h('p', { class: 'muted', text: 'Every chapter recap and key term on one page. Generated from the chapter content, so it stays in sync.' }),
      e.domains.map((d) => h('section', { class: 'section' },
        h('h2', { html: `<span class="dot" style="background:${KS.color(d.color)}"></span> ${d.name} <span class="muted small">${d.weight}%</span>` }),
        h('div', { class: 'grid g2' }, e.chapterList.filter((c) => c.domain === d.id).map((c) => h('div', { class: 'panel' },
          h('h3', { text: `${c.icon || ''} Ch ${c.num} · ${c.title}` }),
          h('ul', { class: 'small', style: { paddingLeft: '18px', color: 'var(--text-2)' } }, (c.summary || []).map((x) => h('li', { html: x }))),
          (c.glossary || []).length ? h('details', null, h('summary', { class: 'small', style: { cursor: 'pointer', fontWeight: 600 }, text: `${c.glossary.length} key terms` }),
            h('dl', { class: 'small' }, c.glossary.map((g) => [h('dt', { style: { fontWeight: 700, marginTop: '6px' }, html: g.term }), h('dd', { style: { margin: 0, color: 'var(--text-2)' }, html: g.def })]))) : null))))))));
  }));

  KS.route('/exam/:id/lib/:i', ({ id, i }) => getExam(id).then((e) => {
    const it = (e.library || [])[parseInt(i, 10)];
    if (!it) throw new Error('Library item not found');
    shell([{ label: e.short, href: '#/exam/' + id }, { label: 'Library', href: `#/exam/${id}/library` }, { label: it.title }],
      h('main', { class: 'wrap', style: { maxWidth: '1400px' } }, h('div', { class: 'row', style: { marginBottom: '10px' } }, h('h2', { style: { margin: 0 }, text: it.title }), h('a', { class: 'btn sm', href: `exams/${id}/${it.url}`, target: '_blank', style: { marginLeft: 'auto' } }, 'Open in new tab ↗')),
        h('iframe', { class: 'lib-frame', src: `exams/${id}/${it.url}`, title: it.title })), { noFooter: true });
  }));
})();
