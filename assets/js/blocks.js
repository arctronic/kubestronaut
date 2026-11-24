/* Kubestronaut Study Platform: slide block renderers.
   Every block is a plain object { type: '...', ... }. See CONTENT_GUIDE.md for the schema. */
(function () {
  'use strict';
  const KS = window.KS;
  const h = KS.h;
  const R = (KS.blocks = {});

  /** ctx.steppers: array of { pending(): bool, next(): void } used by the deck for click-to-reveal. */
  KS.renderBlocks = function (blocks, ctx) {
    const wrap = h('div', { class: 'blocks' });
    (blocks || []).forEach((b) => wrap.appendChild(KS.renderBlock(b, ctx)));
    return wrap;
  };
  KS.renderBlock = function (b, ctx) {
    ctx = ctx || { steppers: [] };
    const fn = R[b.type];
    if (!fn) return h('div', { class: 'b-callout warn', html: '<span class="ct">Unknown block</span>' + KS.esc(b.type) });
    try { return fn(b, ctx); } catch (e) { console.error(e, b); return h('div', { class: 'b-callout warn', html: '<span class="ct">Block error</span>' + KS.esc(e.message) }); }
  };

  R.text = (b) => h('div', { class: 'b-text', html: b.html || KS.esc(b.text) });
  R.html = (b) => h('div', { html: b.html });

  R.bullets = (b, ctx) => {
    const ul = h('ul', { class: 'b-bullets' });
    const lis = (b.items || []).map((it) => h('li', { html: it }));
    lis.forEach((li) => ul.appendChild(li));
    if (!b.reveal) return ul;
    lis.forEach((li, i) => i > 0 && li.classList.add('hidden-step'));
    let shown = 1;
    const hint = h('div', { class: 'reveal-hint', html: 'Press <kbd>Space</kbd> or click <b>Next</b> to reveal' });
    const st = {
      pending: () => shown < lis.length,
      next: () => { if (shown < lis.length) { lis[shown++].classList.remove('hidden-step'); if (shown >= lis.length) hint.remove(); } },
    };
    ctx.steppers.push(st);
    ul.addEventListener('click', () => st.next());
    return h('div', null, ul, hint);
  };

  R.cards = (b) => {
    const cols = b.cols || Math.min((b.items || []).length, 4) || 3;
    const g = h('div', { class: 'b-cards', style: { gridTemplateColumns: `repeat(auto-fit, minmax(${cols >= 4 ? 180 : 220}px, 1fr))` } });
    (b.items || []).forEach((it) => g.appendChild(h('div', { class: 'b-card', style: { '--cc': KS.color(it.color) } },
      it.icon ? h('div', { class: 'ic', text: it.icon }) : null,
      h('h4', { html: it.title }),
      it.text ? h('p', { html: it.text }) : null)));
    return g;
  };

  R.flip = (b) => {
    const g = h('div', { class: 'b-flip' });
    (b.items || []).forEach((it) => {
      const f = h('div', { class: 'flip', tabindex: '0' },
        h('div', { class: 'flip-inner' },
          h('div', { class: 'flip-face flip-front', html: it.front + '<small>tap to flip</small>' }),
          h('div', { class: 'flip-face flip-back', html: it.back })));
      const toggle = () => f.classList.toggle('on');
      f.addEventListener('click', toggle);
      f.addEventListener('keydown', (e) => { if (e.key === 'Enter') toggle(); });
      g.appendChild(f);
    });
    return h('div', null, b.title ? h('h4', { html: b.title }) : null, g);
  };

  R.compare = R.table = (b) => {
    const t = h('table', { class: 'b-table' });
    if (b.headers) t.appendChild(h('thead', null, h('tr', null, b.headers.map((x) => h('th', { html: x })))));
    const tb = h('tbody');
    (b.rows || []).forEach((r) => tb.appendChild(h('tr', null, r.map((x) => h('td', { html: x })))));
    t.appendChild(tb);
    return h('div', { class: 'table-scroll' }, t);
  };

  /* ---------- code with annotations ---------- */
  function hlLine(line, lang) {
    let code = line, comment = '';
    const ci = findComment(line, lang);
    if (ci >= 0) { code = line.slice(0, ci); comment = line.slice(ci); }
    let out = KS.esc(code);
    if (lang === 'yaml') {
      out = out.replace(/^(\s*-?\s*)([\w.\-/]+)(:)(?=\s|$)/, '$1<span class="tok-k">$2</span>$3');
      out = out.replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, '<span class="tok-s">$1</span>');
      out = out.replace(/(:\s+)(\d+[\w.]*|true|false|null)\s*$/, '$1<span class="tok-n">$2</span>');
    } else if (lang === 'bash' || lang === 'sh' || lang === 'shell') {
      out = out.replace(/^(\s*\$?\s*)(kubectl|helm|docker|podman|crictl|kubeadm|curl|git|k|minikube|kind|etcdctl|argocd|flux|istioctl|systemctl|journalctl|cat|echo|export|ls|ps)\b/, '$1<span class="tok-k">$2</span>');
      out = out.replace(/(\s)(--?[\w-]+)/g, '$1<span class="tok-p">$2</span>');
      out = out.replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, '<span class="tok-s">$1</span>');
    } else if (lang === 'dockerfile') {
      out = out.replace(/^(\s*)(FROM|RUN|COPY|ADD|CMD|ENTRYPOINT|WORKDIR|ENV|EXPOSE|USER|ARG|LABEL|AS)\b/, '$1<span class="tok-k">$2</span>');
      out = out.replace(/\b(AS)\b/g, '<span class="tok-k">$1</span>');
    } else if (lang === 'promql') {
      out = out.replace(/\b(sum|rate|irate|avg|max|min|count|by|without|histogram_quantile|increase)\b/g, '<span class="tok-k">$1</span>');
      out = out.replace(/(\[[\dsmhd]+\])/g, '<span class="tok-n">$1</span>');
      out = out.replace(/(&quot;.*?&quot;)/g, '<span class="tok-s">$1</span>');
    }
    if (comment) out += '<span class="tok-c">' + KS.esc(comment) + '</span>';
    return out;
  }
  function findComment(line, lang) {
    if (lang === 'promql') return -1;
    let q = null;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === q) q = null; continue; }
      if (c === '"' || c === "'") { q = c; continue; }
      if (c === '#' && (i === 0 || /\s/.test(line[i - 1]))) return i;
    }
    return -1;
  }
  R.code = (b) => {
    const lang = (b.lang || 'yaml').toLowerCase();
    const lines = String(b.code || '').replace(/^\n/, '').replace(/\s+$/, '').split('\n');
    const notes = b.notes || {};
    const pre = h('pre');
    const noteBox = h('div', { class: 'note', style: { display: 'none' } });
    let n = 0; const lnEls = [];
    lines.forEach((ln, i) => {
      const note = notes[i + 1];
      const el = h('span', { class: 'ln' + (note ? ' has-note' : ''), html: hlLine(ln, lang) || ' ' });
      if (note) {
        el.setAttribute('data-n', ++n);
        el.addEventListener('click', () => {
          const was = el.classList.contains('active');
          lnEls.forEach((x) => x.classList.remove('active'));
          if (was) { noteBox.style.display = 'none'; return; }
          el.classList.add('active'); noteBox.innerHTML = '<b>Line ' + (i + 1) + ':</b> ' + note; noteBox.style.display = 'block';
        });
      }
      lnEls.push(el); pre.appendChild(el);
    });
    const head = h('div', { class: 'code-head' }, h('span', { text: b.title || lang }), n ? h('span', { text: 'click highlighted lines ◀' }) : h('span'));
    return h('div', { class: 'b-code' }, head, pre, noteBox);
  };

  R.callout = (b) => h('div', { class: 'b-callout ' + (b.kind || 'info') }, b.title ? h('span', { class: 'ct', html: b.title }) : null, h('div', { html: b.html || KS.esc(b.text) }));

  /* ---------- interactive diagram ---------- */
  const SVGNS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, ...kids) {
    const el = document.createElementNS(SVGNS, tag);
    for (const k in attrs || {}) if (attrs[k] != null) el.setAttribute(k, attrs[k]);
    kids.flat().forEach((c) => c && el.appendChild(c.nodeType ? c : document.createTextNode(c)));
    return el;
  }
  function clip(n, tx, ty) { // intersection of ray from node center to (tx,ty) with node rect (+4px pad)
    const cx = n.x + n.w / 2, cy = n.y + n.h / 2, dx = tx - cx, dy = ty - cy;
    if (!dx && !dy) return [cx, cy];
    const hw = n.w / 2 + 4, hh = n.h / 2 + 4;
    const t = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
    return [cx + dx * t, cy + dy * t];
  }
  R.diagram = (b) => {
    const W = b.width || 900, H = b.height || 420;
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': b.caption || 'diagram' });
    const defs = s('defs');
    svg.appendChild(defs);
    const markers = {};
    function marker(color) {
      const key = color.replace(/[^a-z0-9]/gi, '');
      if (!markers[key]) {
        const id = 'mk' + Math.random().toString(36).slice(2, 8) + key;
        defs.appendChild(s('marker', { id, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' },
          s('path', { d: 'M0,0 L10,5 L0,10 z', fill: color })));
        markers[key] = id;
      }
      return 'url(#' + markers[key] + ')';
    }
    (b.groups || []).forEach((g) => {
      const gc = KS.color(g.color || 'gray');
      const el = s('g', { class: 'dg-group', style: `--gc:${gc}` },
        s('rect', { x: g.x, y: g.y, width: g.w, height: g.h, rx: 16 }),
        s('text', { x: g.x + 14, y: g.y + 22 }, (g.label || '').toUpperCase()));
      svg.appendChild(el);
    });
    const nodes = {};
    (b.nodes || []).forEach((n) => { n.w = n.w || 150; n.h = n.h || 56; nodes[n.id] = n; });
    const edgeEls = {};
    const edgeLayer = s('g');
    svg.appendChild(edgeLayer);
    (b.edges || []).forEach((e) => {
      const A = nodes[e.from], B = nodes[e.to];
      if (!A || !B) return;
      const ac = [A.x + A.w / 2, A.y + A.h / 2], bc = [B.x + B.w / 2, B.y + B.h / 2];
      const p1 = clip(A, bc[0], bc[1]), p2 = clip(B, ac[0], ac[1]);
      let d, mx, my;
      if (e.bend) {
        const nx = -(p2[1] - p1[1]), ny = p2[0] - p1[0], len = Math.hypot(nx, ny) || 1;
        const cx = (p1[0] + p2[0]) / 2 + (nx / len) * e.bend, cy = (p1[1] + p2[1]) / 2 + (ny / len) * e.bend;
        d = `M${p1[0]},${p1[1]} Q${cx},${cy} ${p2[0]},${p2[1]}`;
        mx = (p1[0] + 2 * cx + p2[0]) / 4; my = (p1[1] + 2 * cy + p2[1]) / 4;
      } else {
        d = `M${p1[0]},${p1[1]} L${p2[0]},${p2[1]}`;
        mx = (p1[0] + p2[0]) / 2; my = (p1[1] + p2[1]) / 2;
      }
      const ec = KS.color(e.color || 'gray');
      const path = s('path', { d, 'marker-end': e.arrow === false ? null : marker(ec), 'marker-start': e.both ? marker(ec) : null });
      const g = s('g', { class: 'dg-edge' + (e.dashed ? ' dashed' : ''), style: `--ec:${ec}` }, path);
      if (e.label) {
        const tw = e.label.length * 6.4 + 10;
        g.appendChild(s('rect', { class: 'lbl-bg', x: mx - tw / 2, y: my - 10, width: tw, height: 18, rx: 5 }));
        g.appendChild(s('text', { x: mx, y: my + 3.5, 'text-anchor': 'middle' }, e.label));
      }
      edgeLayer.appendChild(g);
      edgeEls[e.from + '>' + e.to] = g;
    });
    const info = h('div', { class: 'dg-info', html: b.intro || '👆 <b>Click any component</b> to learn what it does.' });
    const nodeEls = {};
    (b.nodes || []).forEach((n) => {
      const nc = KS.color(n.color || 'blue');
      const g = s('g', { class: 'dg-node', style: `--nc:${nc}`, tabindex: '0' });
      g.appendChild(s('rect', { x: n.x, y: n.y, width: n.w, height: n.h, rx: n.round ? n.h / 2 : 11, fill: `color-mix(in srgb, ${nc} 16%, var(--panel))`, stroke: nc, 'stroke-width': 1.6 }));
      const lines = String(n.label || '').split('\n');
      const hasSub = !!n.sub;
      const icon = n.icon ? n.icon + ' ' : '';
      const total = lines.length + (hasSub ? 1 : 0);
      const lh = 16;
      let y0 = n.y + n.h / 2 - ((total - 1) * lh) / 2 + 5;
      lines.forEach((ln, i) => g.appendChild(s('text', { x: n.x + n.w / 2, y: y0 + i * lh, 'text-anchor': 'middle', 'font-size': n.fs || 14, 'font-weight': 700 }, (i === 0 ? icon : '') + ln)));
      if (hasSub) g.appendChild(s('text', { class: 'sub', x: n.x + n.w / 2, y: y0 + lines.length * lh, 'text-anchor': 'middle', 'font-size': 11.5 }, n.sub));
      const show = () => {
        Object.values(nodeEls).forEach((x) => x.classList.remove('sel'));
        g.classList.add('sel');
        info.innerHTML = '<b>' + KS.esc((n.icon ? n.icon + ' ' : '') + String(n.label).replace(/\n/g, ' ')) + '</b>: ' + (n.info || n.sub || '');
      };
      g.addEventListener('click', show);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter') show(); });
      nodeEls[n.id] = g;
      svg.appendChild(g);
    });
    const parts = [h('div', { class: 'b-diagram' }, svg)];
    if (b.steps && b.steps.length) {
      let cur = -1;
      const txt = h('div', { class: 'stxt', html: b.stepsIntro || '▶ Press <b>Play</b> or <b>Next step</b> to walk through the flow.' });
      const apply = () => {
        const st = b.steps[cur];
        const on = new Set(st ? st.on || [] : []);
        Object.entries(nodeEls).forEach(([id, el]) => el.classList.toggle('dg-dim', !!st && !on.has(id)));
        Object.entries(edgeEls).forEach(([id, el]) => { el.classList.toggle('dg-dim', !!st && !on.has(id)); el.classList.toggle('flow', !!st && on.has(id)); });
        txt.innerHTML = st ? `<b>Step ${cur + 1}/${b.steps.length}:</b> ${st.text}` : (b.stepsIntro || '▶ Press <b>Play</b> or <b>Next step</b> to walk through the flow.');
      };
      let timer = null;
      const stop = () => { if (timer) { clearInterval(timer); timer = null; playBtn.textContent = '▶ Play'; } };
      const prev = h('button', { class: 'btn sm', onclick: () => { stop(); cur = Math.max(-1, cur - 1); apply(); } }, '◀');
      const next = h('button', { class: 'btn sm primary', onclick: () => { stop(); cur = Math.min(b.steps.length - 1, cur + 1); apply(); } }, 'Next step ▶');
      const playBtn = h('button', { class: 'btn sm', onclick: () => {
        if (timer) return stop();
        cur = -1; apply(); playBtn.textContent = '⏸ Pause';
        timer = setInterval(() => { if (cur >= b.steps.length - 1) { stop(); return; } cur++; apply(); }, b.interval || 2600);
      } }, '▶ Play');
      const reset = h('button', { class: 'btn sm ghost', onclick: () => { stop(); cur = -1; apply(); } }, '↺');
      KS.onLeave(stop);
      parts.push(h('div', { class: 'dg-steps' }, prev, txt, next, playBtn, reset));
    }
    if ((b.nodes || []).some((n) => n.info)) parts.push(info);
    if (b.caption) parts.push(h('div', { class: 'caption', html: b.caption }));
    return h('div', null, parts);
  };

  /* ---------- flow (horizontal pipeline) ---------- */
  R.flow = (b) => {
    const box = h('div', { class: 'b-flow' });
    const steps = [];
    (b.items || []).forEach((it, i) => {
      if (i) box.appendChild(h('div', { class: 'farrow', text: '➜' }));
      const el = h('div', { class: 'fstep' }, it.icon ? h('div', { class: 'ic', text: it.icon }) : null, h('b', { html: it.label }), it.sub ? h('span', { html: it.sub }) : null);
      steps.push(el); box.appendChild(el);
    });
    let cur = -1;
    const desc = h('div', { class: 'dg-info', style: { display: 'none' } });
    const apply = () => {
      box.classList.toggle('stepping', cur >= 0);
      steps.forEach((el, i) => { el.classList.toggle('active', i === cur); el.classList.toggle('done', i < cur); });
      const it = b.items[cur];
      if (it && it.info) { desc.style.display = 'block'; desc.innerHTML = '<b>' + it.label + '</b>: ' + it.info; } else desc.style.display = 'none';
    };
    steps.forEach((el, i) => el.addEventListener('click', () => { cur = i; apply(); }));
    const ctl = h('div', { class: 'flow-ctl' },
      h('button', { class: 'btn sm', onclick: () => { cur = Math.max(-1, cur - 1); apply(); } }, '◀ Back'),
      h('button', { class: 'btn sm primary', onclick: () => { cur = cur >= steps.length - 1 ? -1 : cur + 1; apply(); } }, 'Step ▶'));
    return h('div', null, box, ctl, desc, b.caption ? h('div', { class: 'caption', html: b.caption }) : null);
  };

  R.layers = (b) => {
    const box = h('div', { class: 'b-layers' });
    (b.items || []).forEach((it) => box.appendChild(h('div', { class: 'layer', style: { '--lc': KS.color(it.color) } }, h('b', { html: it.label }), it.sub ? h('span', { html: it.sub }) : null)));
    return h('div', null, b.title ? h('h4', { html: b.title }) : null, box, b.caption ? h('div', { class: 'caption', html: b.caption }) : null);
  };

  R.tabs = (b, ctx) => {
    const bar = h('div', { class: 'tabbar' });
    const pane = h('div', { class: 'tabpane' });
    const btns = [];
    const show = (i) => { btns.forEach((x, j) => x.classList.toggle('on', i === j)); pane.innerHTML = ''; (b.tabs[i].blocks || []).forEach((bb) => pane.appendChild(KS.renderBlock(bb, { steppers: [] }))); };
    (b.tabs || []).forEach((t, i) => { const bt = h('button', { onclick: () => show(i), html: t.label }); btns.push(bt); bar.appendChild(bt); });
    show(0);
    return h('div', { class: 'b-tabs' }, bar, pane);
  };

  R.cols = (b, ctx) => {
    const ratio = b.ratio || (b.cols || []).map(() => '1fr').join(' ');
    return h('div', { class: 'b-cols', style: { gridTemplateColumns: ratio } }, (b.cols || []).map((col) => h('div', null, (col || []).map((bb) => KS.renderBlock(bb, ctx)))));
  };

  R.check = (b) => {
    const box = h('div', { class: 'b-check' });
    box.appendChild(h('div', { class: 'qh', text: 'Quick check' }));
    box.appendChild(h('div', { class: 'qq', html: b.q }));
    const opts = h('div', { class: 'opts' });
    const exp = h('div', { class: 'explain', style: { display: 'none' } });
    const btns = (b.options || []).map((o, i) => h('button', { class: 'opt', html: `<span class="key">${String.fromCharCode(65 + i)}</span><span>${o}</span>` }));
    btns.forEach((bt, i) => {
      bt.addEventListener('click', () => {
        btns.forEach((x, j) => { x.disabled = true; if (j === b.answer) x.classList.add('correct'); else if (j === i) x.classList.add('wrong'); });
        const ok = i === b.answer;
        exp.innerHTML = `<div class="verdict ${ok ? 'ok' : 'bad'}">${ok ? '✓ Correct' : '✗ Not quite'}</div>${b.explain || ''}`;
        exp.style.display = 'block';
      });
      opts.appendChild(bt);
    });
    box.appendChild(opts); box.appendChild(exp);
    return box;
  };

  R.stats = (b) => h('div', { class: 'b-stats' }, (b.items || []).map((it) => h('div', { class: 'stat' }, h('div', { class: 'v', html: it.value }), h('div', { class: 'l', html: it.label }))));

  R.timeline = (b) => h('div', { class: 'b-timeline' }, (b.items || []).map((it) => h('div', { class: 'ti' }, h('div', { class: 'when', html: it.when || '' }), h('div', { class: 'tt', html: it.title }), it.text ? h('div', { class: 'tx', html: it.text }) : null)));

  R.reveal = (b) => h('div', { class: 'b-reveal' }, (b.items || []).map((it) => h('details', null, h('summary', { html: it.q }), h('div', { html: it.a }))));

  R.svg = (b) => h('div', { class: 'b-svg' }, h('div', { html: b.svg }), b.caption ? h('div', { class: 'caption', html: b.caption }) : null);

  R.match = (b) => {
    const pairs = b.pairs || [];
    const left = h('div', { class: 'mcol' }), right = h('div', { class: 'mcol' });
    let selL = null, done = 0;
    const status = h('div', { class: 'reveal-hint', text: `Match each item: click one on the left, then its partner on the right (0/${pairs.length})` });
    const lb = pairs.map((p, i) => { const bt = h('button', { html: p[0] }); bt.dataset.i = i; left.appendChild(bt); return bt; });
    const order = KS.shuffle(pairs.map((_, i) => i));
    order.forEach((i) => {
      const bt = h('button', { html: pairs[i][1] }); bt.dataset.i = i; right.appendChild(bt);
      bt.addEventListener('click', () => {
        if (!selL || bt.classList.contains('done')) return;
        if (selL.dataset.i === bt.dataset.i) {
          selL.classList.remove('sel'); selL.classList.add('done'); bt.classList.add('done'); selL = null; done++;
          status.textContent = done === pairs.length ? '🎉 All matched!' : `Matched ${done}/${pairs.length}`;
        } else { bt.classList.add('wrong'); setTimeout(() => bt.classList.remove('wrong'), 400); }
      });
    });
    lb.forEach((bt) => bt.addEventListener('click', () => { if (bt.classList.contains('done')) return; lb.forEach((x) => x.classList.remove('sel')); bt.classList.add('sel'); selL = bt; }));
    return h('div', null, b.title ? h('h4', { html: b.title }) : null, h('div', { class: 'b-match' }, left, right), status);
  };
})();
