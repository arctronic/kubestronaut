'use client';
/* Slide blocks: each content block { type, ... } renders to semantic HTML on the server (SEO) and hydrates for
   interactivity. Schema is documented in CONTENT_GUIDE.md. */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { Html } from './ui';
import { color, refLabel, refs, shuffle } from '@/lib/util';

/* Steppers let the deck's Space/Next key reveal bullets one at a time before moving on. */
export const StepCtx = createContext(null);
export function useSteppers() {
  const list = useRef([]);
  return { list, api: { register: (s) => { list.current.push(s); return () => { list.current = list.current.filter((x) => x !== s); }; } } };
}

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default function Blocks({ blocks }) {
  return <div className="blocks">{(blocks || []).map((b, i) => <Block key={i} b={b} />)}</div>;
}

export function Block({ b }) {
  const C = R[b.type];
  if (!C) return <div className="b-callout warn"><span className="ct">Unknown block</span>{b.type}</div>;
  return <C b={b} />;
}

export function SourceLinks({ q }) {
  const list = refs(q);
  if (!list.length) return null;
  return (
    <div className="ref"><Icon name="book-marked" size={16} /><span>Source:{' '}
      {list.map((u, i) => <span key={u}>{i > 0 && ' · '}<a href={u} target="_blank" rel="noopener noreferrer">{refLabel(u)}<Icon name="external-link" size={12} className="xs" /></a></span>)}
    </span></div>
  );
}

/* ---------------- simple blocks ---------------- */
const Text = ({ b }) => <Html as="div" className="b-text" html={b.html || esc(b.text)} />;
const Raw = ({ b }) => <Html as="div" html={b.html} />;

function Bullets({ b }) {
  const items = b.items || [];
  const [shown, setShown] = useState(b.reveal ? 1 : items.length);
  const ctx = useContext(StepCtx);
  const shownRef = useRef(shown);
  shownRef.current = shown;
  useEffect(() => {
    if (!b.reveal || !ctx) return undefined;
    return ctx.register({ pending: () => shownRef.current < items.length, next: () => setShown((n) => Math.min(items.length, n + 1)) });
  }, [b.reveal, ctx, items.length]);
  return (
    <div>
      <ul className="b-bullets" onClick={() => b.reveal && setShown((n) => Math.min(items.length, n + 1))}>
        {items.map((it, i) => <Html key={i} as="li" className={i >= shown ? 'hidden-step' : ''} html={it} />)}
      </ul>
      {b.reveal && shown < items.length && <div className="reveal-hint">Press <kbd>Space</kbd> or click <b>Next</b> to reveal</div>}
    </div>
  );
}

function Cards({ b }) {
  const n = b.cols || Math.min((b.items || []).length, 4) || 3;
  return (
    <div className="b-cards" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${n >= 4 ? 180 : 220}px, 1fr))` }}>
      {(b.items || []).map((it, i) => (
        <div key={i} className="b-card" style={{ '--cc': color(it.color) }}>
          {it.icon && <div className="ic"><Icon name={it.icon} size={20} /></div>}
          <Html as="h4" html={it.title} />
          {it.text && <Html as="p" html={it.text} />}
        </div>
      ))}
    </div>
  );
}

function FlipCard({ it }) {
  const [on, setOn] = useState(false);
  return (
    <div className={'flip' + (on ? ' on' : '')} tabIndex={0} role="button" aria-pressed={on} onClick={() => setOn(!on)} onKeyDown={(e) => e.key === 'Enter' && setOn(!on)}>
      <div className="flip-inner">
        <div className="flip-face flip-front"><Html html={it.front} /><small>Tap to flip</small></div>
        <Html as="div" className="flip-face flip-back" html={it.back} />
      </div>
    </div>
  );
}
const Flip = ({ b }) => (
  <div>{b.title && <Html as="h4" html={b.title} />}<div className="b-flip">{(b.items || []).map((it, i) => <FlipCard key={i} it={it} />)}</div></div>
);

const Compare = ({ b }) => (
  <div className="table-scroll">
    <table className="b-table">
      {b.headers && <thead><tr>{b.headers.map((x, i) => <Html key={i} as="th" html={x} />)}</tr></thead>}
      <tbody>{(b.rows || []).map((r, i) => <tr key={i}>{r.map((x, j) => <Html key={j} as="td" html={x} />)}</tr>)}</tbody>
    </table>
  </div>
);

const CALLOUT_ICON = { tip: 'lightbulb', warn: 'triangle-alert', trap: 'ban', info: 'info', exam: 'target' };
const Callout = ({ b }) => (
  <div className={'b-callout ' + (b.kind || 'info')}>
    <span className="co-ic"><Icon name={CALLOUT_ICON[b.kind] || 'info'} size={20} /></span>
    {b.title && <Html className="ct" html={b.title} />}
    <Html as="div" html={b.html || esc(b.text)} />
  </div>
);

const Stats = ({ b }) => (
  <div className="b-stats">{(b.items || []).map((it, i) => <div key={i} className="stat"><Html as="div" className="v" html={it.value} /><Html as="div" className="l" html={it.label} /></div>)}</div>
);
const Timeline = ({ b }) => (
  <div className="b-timeline">{(b.items || []).map((it, i) => (
    <div key={i} className="ti"><Html as="div" className="when" html={it.when || ''} /><Html as="div" className="tt" html={it.title} />{it.text && <Html as="div" className="tx" html={it.text} />}</div>
  ))}</div>
);
const Reveal = ({ b }) => (
  <div className="b-reveal">{(b.items || []).map((it, i) => <details key={i}><Html as="summary" html={it.q} /><Html as="div" html={it.a} /></details>)}</div>
);
const Svg = ({ b }) => <div className="b-svg"><Html as="div" html={b.svg} />{b.caption && <Html as="div" className="caption" html={b.caption} />}</div>;
const Layers = ({ b }) => (
  <div>
    {b.title && <Html as="h4" html={b.title} />}
    <div className="b-layers">{(b.items || []).map((it, i) => <div key={i} className="layer" style={{ '--lc': color(it.color) }}><Html as="b" html={it.label} />{it.sub && <Html html={it.sub} />}</div>)}</div>
    {b.caption && <Html as="div" className="caption" html={b.caption} />}
  </div>
);

function Tabs({ b }) {
  const [i, setI] = useState(0);
  const tabs = b.tabs || [];
  return (
    <div className="b-tabs">
      <div className="tabbar" role="tablist">{tabs.map((t, j) => <button key={j} role="tab" aria-selected={i === j} className={i === j ? 'on' : ''} onClick={() => setI(j)} dangerouslySetInnerHTML={{ __html: t.label }} />)}</div>
      {/* all panes are rendered (visible to crawlers); inactive ones are hidden */}
      {tabs.map((t, j) => <div key={j} className="tabpane" role="tabpanel" hidden={i !== j}><Blocks blocks={t.blocks} /></div>)}
    </div>
  );
}

const Cols = ({ b }) => (
  <div className="b-cols" style={{ gridTemplateColumns: b.ratio || (b.cols || []).map(() => '1fr').join(' ') }}>
    {(b.cols || []).map((col, i) => <div key={i}>{(col || []).map((bb, j) => <Block key={j} b={bb} />)}</div>)}
  </div>
);

function Check({ b }) {
  const [pick, setPick] = useState(null);
  const ok = pick === b.answer;
  return (
    <div className="b-check">
      <div className="qh">Quick check</div>
      <Html as="div" className="qq" html={b.q} />
      <div className="opts">
        {(b.options || []).map((o, i) => (
          <button key={i} disabled={pick != null} className={'opt' + (pick != null && i === b.answer ? ' correct' : pick === i ? ' wrong' : '')} onClick={() => setPick(i)}>
            <span className="key">{String.fromCharCode(65 + i)}</span><Html html={o} />
          </button>
        ))}
      </div>
      {pick != null && (
        <div className="explain">
          <div className={'verdict ' + (ok ? 'ok' : 'bad')}><Icon name={ok ? 'circle-check' : 'circle-x'} size={19} /> {ok ? 'Correct' : 'Not quite'}</div>
          <Html as="div" html={b.explain || ''} />
          <SourceLinks q={b} />
        </div>
      )}
    </div>
  );
}

function Match({ b }) {
  const pairs = b.pairs || [];
  const [right, setRight] = useState(() => pairs.map((_, i) => i));
  useEffect(() => { setRight(shuffle(pairs.map((_, i) => i))); }, [pairs.length]); // shuffle after hydration
  const [sel, setSel] = useState(null);
  const [done, setDone] = useState([]);
  const [wrong, setWrong] = useState(null);
  const tryMatch = (i) => {
    if (sel == null || done.includes(i)) return;
    if (sel === i) { setDone([...done, i]); setSel(null); }
    else { setWrong(i); setTimeout(() => setWrong(null), 400); }
  };
  return (
    <div>
      {b.title && <Html as="h4" html={b.title} />}
      <div className="b-match">
        <div className="mcol">{pairs.map((p, i) => <button key={i} className={done.includes(i) ? 'done' : sel === i ? 'sel' : ''} onClick={() => !done.includes(i) && setSel(i)} dangerouslySetInnerHTML={{ __html: p[0] }} />)}</div>
        <div className="mcol">{right.map((i) => <button key={i} className={done.includes(i) ? 'done' : wrong === i ? 'wrong' : ''} onClick={() => tryMatch(i)} dangerouslySetInnerHTML={{ __html: pairs[i][1] }} />)}</div>
      </div>
      <div className="reveal-hint">{done.length === pairs.length ? 'All matched. Nice work.' : `Click an item on the left, then its partner on the right (${done.length}/${pairs.length})`}</div>
    </div>
  );
}

/* ---------------- code with clickable annotations ---------------- */
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
function hlLine(line, lang) {
  let code = line, comment = '';
  const ci = findComment(line, lang);
  if (ci >= 0) { code = line.slice(0, ci); comment = line.slice(ci); }
  let out = esc(code);
  if (lang === 'yaml') {
    out = out.replace(/^(\s*-?\s*)([\w.\-/]+)(:)(?=\s|$)/, '$1<span class="tok-k">$2</span>$3');
    out = out.replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, '<span class="tok-s">$1</span>');
    out = out.replace(/(:\s+)(\d+[\w.]*|true|false|null)\s*$/, '$1<span class="tok-n">$2</span>');
  } else if (lang === 'bash' || lang === 'sh' || lang === 'shell') {
    out = out.replace(/^(\s*\$?\s*)(kubectl|helm|docker|podman|crictl|kubeadm|curl|git|k|minikube|kind|etcdctl|etcdutl|argocd|flux|istioctl|systemctl|journalctl|cat|echo|export|ls|ps|nslookup|trivy|cosign)\b/, '$1<span class="tok-k">$2</span>');
    out = out.replace(/(\s)(--?[\w-]+)/g, '$1<span class="tok-p">$2</span>');
    out = out.replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, '<span class="tok-s">$1</span>');
  } else if (lang === 'dockerfile') {
    out = out.replace(/^(\s*)(FROM|RUN|COPY|ADD|CMD|ENTRYPOINT|WORKDIR|ENV|EXPOSE|USER|ARG|LABEL)\b/, '$1<span class="tok-k">$2</span>').replace(/\b(AS)\b/g, '<span class="tok-k">$1</span>');
  } else if (lang === 'promql') {
    out = out.replace(/\b(sum|rate|irate|avg|max|min|count|by|without|histogram_quantile|increase)\b/g, '<span class="tok-k">$1</span>').replace(/(\[[\dsmhd]+\])/g, '<span class="tok-n">$1</span>').replace(/(&quot;.*?&quot;)/g, '<span class="tok-s">$1</span>');
  }
  if (comment) out += '<span class="tok-c">' + esc(comment) + '</span>';
  return out || ' ';
}
function Code({ b }) {
  const lang = (b.lang || 'yaml').toLowerCase();
  const lines = String(b.code || '').replace(/^\n/, '').replace(/\s+$/, '').split('\n');
  const notes = b.notes || {};
  const [active, setActive] = useState(null);
  let n = 0;
  const numbered = lines.map((ln, i) => ({ ln, note: notes[i + 1], n: notes[i + 1] ? ++n : 0 }));
  return (
    <div className="b-code">
      <div className="code-head"><span>{b.title || lang}</span>{n > 0 && <span>Click a highlighted line for its note</span>}</div>
      <pre>
        {numbered.map((x, i) => (
          <span key={i} className={'ln' + (x.note ? ' has-note' : '') + (active === i ? ' active' : '')} data-n={x.n || undefined}
            onClick={x.note ? () => setActive(active === i ? null : i) : undefined} dangerouslySetInnerHTML={{ __html: hlLine(x.ln, lang) }} />
        ))}
      </pre>
      {active != null && <div className="note"><b>Line {active + 1}:</b> <Html html={notes[active + 1]} /></div>}
    </div>
  );
}

/* ---------------- interactive SVG diagram ---------------- */
function clip(n, tx, ty) {
  const cx = n.x + n.w / 2, cy = n.y + n.h / 2, dx = tx - cx, dy = ty - cy;
  if (!dx && !dy) return [cx, cy];
  const hw = n.w / 2 + 4, hh = n.h / 2 + 4;
  const t = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
  return [cx + dx * t, cy + dy * t];
}
function Diagram({ b }) {
  const W = b.width || 900, H = b.height || 420;
  const nodes = (b.nodes || []).map((n) => ({ ...n, w: n.w || 150, h: n.h || 56 }));
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const [sel, setSel] = useState(null);
  const [cur, setCur] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const uid = useRef('d' + Math.random().toString(36).slice(2, 7)).current;
  const steps = b.steps || [];
  useEffect(() => {
    if (!playing) return undefined;
    const iv = setInterval(() => setCur((c) => { if (c >= steps.length - 1) { setPlaying(false); return c; } return c + 1; }), b.interval || 2600);
    return () => clearInterval(iv);
  }, [playing, steps.length, b.interval]);
  const st = steps[cur];
  const on = new Set(st ? st.on || [] : []);
  const colors = [...new Set((b.edges || []).map((e) => color(e.color || 'gray')))];
  const mk = (c) => `${uid}m${colors.indexOf(c)}`;
  const sn = sel && byId[sel];
  return (
    <div>
      <div className="b-diagram">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={b.caption ? b.caption.replace(/<[^>]+>/g, '') : 'Diagram'}>
          <defs>{colors.map((c) => <marker key={c} id={mk(c)} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={c} /></marker>)}</defs>
          {(b.groups || []).map((g, i) => (
            <g key={i} className="dg-group" style={{ '--gc': color(g.color || 'gray') }}>
              <rect x={g.x} y={g.y} width={g.w} height={g.h} rx="16" /><text x={g.x + 14} y={g.y + 22}>{(g.label || '').toUpperCase()}</text>
            </g>
          ))}
          <g>
            {(b.edges || []).map((e, i) => {
              const A = byId[e.from], B = byId[e.to];
              if (!A || !B) return null;
              const ac = [A.x + A.w / 2, A.y + A.h / 2], bc = [B.x + B.w / 2, B.y + B.h / 2];
              const p1 = clip(A, bc[0], bc[1]), p2 = clip(B, ac[0], ac[1]);
              let d, mx, my;
              if (e.bend) {
                const nx = -(p2[1] - p1[1]), ny = p2[0] - p1[0], len = Math.hypot(nx, ny) || 1;
                const cx = (p1[0] + p2[0]) / 2 + (nx / len) * e.bend, cy = (p1[1] + p2[1]) / 2 + (ny / len) * e.bend;
                d = `M${p1[0]},${p1[1]} Q${cx},${cy} ${p2[0]},${p2[1]}`; mx = (p1[0] + 2 * cx + p2[0]) / 4; my = (p1[1] + 2 * cy + p2[1]) / 4;
              } else { d = `M${p1[0]},${p1[1]} L${p2[0]},${p2[1]}`; mx = (p1[0] + p2[0]) / 2; my = (p1[1] + p2[1]) / 2; }
              const ec = color(e.color || 'gray'), id = e.from + '>' + e.to;
              const cls = 'dg-edge' + (e.dashed ? ' dashed' : '') + (st ? (on.has(id) ? ' flow' : ' dg-dim') : '');
              const tw = e.label ? e.label.length * 6.4 + 10 : 0;
              return (
                <g key={i} className={cls} style={{ '--ec': ec }}>
                  <path d={d} markerEnd={e.arrow === false ? undefined : `url(#${mk(ec)})`} markerStart={e.both ? `url(#${mk(ec)})` : undefined} />
                  {e.label && <><rect className="lbl-bg" x={mx - tw / 2} y={my - 10} width={tw} height="18" rx="5" /><text x={mx} y={my + 3.5} textAnchor="middle">{e.label}</text></>}
                </g>
              );
            })}
          </g>
          {nodes.map((n) => {
            const nc = color(n.color || 'blue');
            const lines = String(n.label || '').split('\n');
            const total = lines.length + (n.sub ? 1 : 0), lh = 16, fs = n.fs || 14;
            const y0 = n.y + n.h / 2 - ((total - 1) * lh) / 2 + 5;
            const iw = n.icon ? 18 : 0, tx = n.x + n.w / 2 + iw / 2, w0 = lines[0].length * fs * 0.56;
            return (
              <g key={n.id} className={'dg-node' + (sel === n.id ? ' sel' : '') + (st && !on.has(n.id) ? ' dg-dim' : '')} style={{ '--nc': nc }} tabIndex={0}
                onClick={() => setSel(n.id)} onKeyDown={(ev) => ev.key === 'Enter' && setSel(n.id)}>
                <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={n.round ? n.h / 2 : 11} fill={`color-mix(in srgb, ${nc} 16%, var(--panel))`} stroke={nc} strokeWidth="1.6" />
                {n.icon && <Icon name={n.icon} x={tx - w0 / 2 - iw - 2} y={y0 - fs + 1} width={15} height={15} size={15} stroke={nc} strokeWidth={2.2} />}
                {lines.map((ln, i) => <text key={i} x={i === 0 ? tx : n.x + n.w / 2} y={y0 + i * lh} textAnchor="middle" fontSize={fs} fontWeight="700">{ln}</text>)}
                {n.sub && <text className="sub" x={n.x + n.w / 2} y={y0 + lines.length * lh} textAnchor="middle" fontSize="11.5">{n.sub}</text>}
              </g>
            );
          })}
        </svg>
      </div>
      {steps.length > 0 && (
        <div className="dg-steps">
          <button className="btn sm icon-only" aria-label="Previous step" onClick={() => { setPlaying(false); setCur((c) => Math.max(-1, c - 1)); }}><Icon name="chevron-left" size={17} /></button>
          <div className="stxt">{st ? <><b>Step {cur + 1}/{steps.length}:</b> <Html html={st.text} /></> : <Html html={b.stepsIntro || 'Press <b>Play</b> or <b>Next step</b> to walk through the flow.'} />}</div>
          <button className="btn sm primary" onClick={() => { setPlaying(false); setCur((c) => Math.min(steps.length - 1, c + 1)); }}>Next step <Icon name="chevron-right" size={17} /></button>
          <button className="btn sm" onClick={() => { if (playing) setPlaying(false); else { setCur(-1); setPlaying(true); } }}><Icon name={playing ? 'pause' : 'play'} size={17} /> {playing ? 'Pause' : 'Play'}</button>
          <button className="btn sm ghost" aria-label="Reset" onClick={() => { setPlaying(false); setCur(-1); }}><Icon name="rotate-ccw" size={17} /></button>
        </div>
      )}
      {nodes.some((n) => n.info) && (
        <div className="dg-info">{sn ? <>{sn.icon && <Icon name={sn.icon} size={16} />} <b>{String(sn.label).replace(/\n/g, ' ')}</b>: <Html html={sn.info || sn.sub || ''} /></> : <Html html={b.intro || '<b>Click any component</b> to learn what it does.'} />}</div>
      )}
      {/* every node's description is in the HTML for readers without JS and for search engines */}
      <ul className="sr-only">{nodes.filter((n) => n.info).map((n) => <li key={n.id}><b>{String(n.label).replace(/\n/g, ' ')}</b>: <Html html={n.info} /></li>)}</ul>
      {b.caption && <Html as="div" className="caption" html={b.caption} />}
    </div>
  );
}

function Flow({ b }) {
  const items = b.items || [];
  const [cur, setCur] = useState(-1);
  const it = items[cur];
  return (
    <div>
      <div className={'b-flow' + (cur >= 0 ? ' stepping' : '')}>
        {items.map((x, i) => (
          <div key={i} style={{ display: 'contents' }}>
            {i > 0 && <div className="farrow"><Icon name="chevron-right" size={18} /></div>}
            <div className={'fstep' + (i === cur ? ' active' : '') + (i < cur ? ' done' : '')} onClick={() => setCur(i)}>
              {x.icon && <div className="ic"><Icon name={x.icon} size={20} /></div>}
              <Html as="b" html={x.label} />{x.sub && <Html html={x.sub} />}
            </div>
          </div>
        ))}
      </div>
      <div className="flow-ctl">
        <button className="btn sm" onClick={() => setCur((c) => Math.max(-1, c - 1))}><Icon name="chevron-left" size={17} /> Back</button>
        <button className="btn sm primary" onClick={() => setCur((c) => (c >= items.length - 1 ? -1 : c + 1))}>Step <Icon name="chevron-right" size={17} /></button>
      </div>
      {it && it.info && <div className="dg-info"><b dangerouslySetInnerHTML={{ __html: it.label }} />: <Html html={it.info} /></div>}
      <ul className="sr-only">{items.filter((x) => x.info).map((x, i) => <li key={i}><Html as="b" html={x.label} />: <Html html={x.info} /></li>)}</ul>
      {b.caption && <Html as="div" className="caption" html={b.caption} />}
    </div>
  );
}

const R = { text: Text, html: Raw, bullets: Bullets, cards: Cards, flip: Flip, compare: Compare, table: Compare, code: Code, callout: Callout, diagram: Diagram, flow: Flow, layers: Layers, tabs: Tabs, cols: Cols, check: Check, stats: Stats, timeline: Timeline, reveal: Reveal, svg: Svg, match: Match };
