'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from './Icon';
import CourseArt from './CourseArt';
import Shell from './Shell';
import { ReviewItem } from './Quiz';
import { Bar, Html, Ring } from './ui';
import { store, useStore, useStudyTimer } from '@/lib/store';
import { allocate, color, fmtTime, hashStr, isCorrect, pct, rng, shuffle } from '@/lib/util';

function buildMock(e, bank, key) {
  const counts = allocate(e.mock.questions, e.domains);
  const out = [], used = new Set();
  e.domains.forEach((d, di) => {
    const need = counts[di];
    let chosen;
    if (key === 'random') chosen = shuffle(bank.filter((q) => q.domain === d.id)).slice(0, need);
    else {
      const k = parseInt(key, 10) - 1;
      const mock = shuffle(bank.filter((q) => q.domain === d.id && q.source === 'mock'), rng(hashStr(e.id + d.id + 'bank')));
      chosen = mock.slice(k * need, (k + 1) * need);
      if (chosen.length < need) {
        const extra = shuffle(bank.filter((q) => q.domain === d.id && !chosen.includes(q)), rng(hashStr(e.id + d.id + key)));
        chosen = chosen.concat(extra.slice(0, need - chosen.length));
      }
    }
    chosen.forEach((q) => { if (!used.has(q.id)) { used.add(q.id); out.push(q); } });
  });
  return shuffle(out, key === 'random' ? Math.random : rng(hashStr(e.id + 'order' + key)));
}

export default function MockExam({ e, bank, mkey }) {
  const ready = useStore();
  const title = mkey === 'random' ? 'Random mock exam' : 'Mock exam ' + mkey;
  const p = ready ? store.exam(e.id) : null;
  const active = p && p.activeMock && p.activeMock.key === mkey ? p.activeMock : null;
  const [, force] = useState(0);
  if (active) return <Running e={e} bank={bank} m={active} />;
  const prev = p ? p.attempts.filter((t) => t.key === mkey) : [];
  const other = p && p.activeMock && p.activeMock.key !== mkey;
  const counts = allocate(e.mock.questions, e.domains);
  const start = () => {
    const qs = buildMock(e, bank, mkey);
    p.activeMock = { key: mkey, title, qids: qs.map((q) => q.id), orders: qs.map((q) => shuffle(q.options.map((_, i) => i))), answers: {}, flags: {}, start: Date.now(), duration: e.mock.minutes * 60, cur: 0 };
    store.save(); force((n) => n + 1);
  };
  return (
    <Shell>
      <main className="quiz-wrap standalone">
        <div className="q-card exam-intro">
          <div className="ei-art"><CourseArt exam={e} k={'m' + mkey} w={860} h={150} tag={`${e.short} · ${title}`} fs={46} /></div>
          <div className="eyebrow">{mkey === 'random' ? 'Ungraded exam' : 'Graded exam · Final assessment'}</div>
          <h1>{e.short} {title}</h1>
          <div className="kv">
            <div><b>{e.mock.questions}</b><span>questions</span></div>
            <div><b>{e.mock.minutes} min</b><span>time limit</span></div>
            <div><b>{e.mock.pass}%</b><span>to pass</span></div>
            <div><b>{prev.length ? Math.max(...prev.map((t) => t.score)) + '%' : '–'}</b><span>best of {prev.length} attempt{prev.length === 1 ? '' : 's'}</span></div>
          </div>
          <h3>Question mix (same as the official blueprint)</h3>
          {e.domains.map((d, i) => <div key={d.id} className="dom-row"><span><i className="dotc" style={{ background: color(d.color) }} />{d.name}</span><div className="pbar"><span style={{ width: d.weight + '%', background: color(d.color) }} /></div><b>{counts[i]} Qs</b></div>)}
          <div className="b-callout info"><span className="co-ic"><Icon name="info" size={20} /></span><span className="ct">Exam conditions</span><div>No feedback until you submit. <b>Flag</b> questions and jump around with the navigator. Multi-select questions score only if every pick is right. The timer keeps running if you close the page, like the real exam, and your answers are saved in this browser.</div></div>
          {other && <div className="b-callout warn"><span className="co-ic"><Icon name="triangle-alert" size={20} /></span><span className="ct">Another mock is in progress</span><div>Starting this one discards your unfinished <b>{p.activeMock.title}</b>.</div></div>}
          <div className="q-foot"><Link className="btn ghost" href={`/${e.id}/`}>Back to course</Link><button className="btn primary lg" disabled={!ready} onClick={start}><Icon name="timer" size={18} />Start the clock</button></div>
        </div>
      </main>
    </Shell>
  );
}

function Running({ e, bank, m }) {
  useStudyTimer();
  const byId = Object.fromEntries(bank.map((q) => [q.id, q]));
  const qs = m.qids.map((id) => byId[id]).filter(Boolean);
  const [cur, setCur] = useState(m.cur || 0);
  const [now, setNow] = useState(Date.now());
  const [sheet, setSheet] = useState(null);
  const [, force] = useState(0);
  const left = m.duration - (now - m.start) / 1000;
  const go = (n) => { if (n < 0 || n >= qs.length) return; m.cur = n; store.save(); setCur(n); setSheet(null); };
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv); }, []);
  useEffect(() => { if (left <= 0) submit(true); }); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onKey = (ev) => { if (ev.key === 'ArrowRight') go(cur + 1); else if (ev.key === 'ArrowLeft') go(cur - 1); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });
  function submit(timeout) {
    const p = store.exam(e.id);
    if (!p.activeMock) return;
    let correct = 0; const byDomain = {};
    qs.forEach((q, i) => {
      const ok = isCorrect(q, m.answers[i]);
      if (ok) correct++;
      const bd = (byDomain[q.domain] = byDomain[q.domain] || { c: 0, t: 0 }); bd.t++; if (ok) bd.c++;
      store.recordAnswer(e.id, q.id, ok);
    });
    const score = pct(correct, qs.length);
    const att = { id: Date.now().toString(36), key: m.key, title: m.title, date: Date.now(), qids: m.qids, orders: m.orders, answers: m.answers, flags: m.flags, correct, total: qs.length, score, pass: score >= e.mock.pass, byDomain, timeUsed: Math.min(m.duration, Math.round((Date.now() - m.start) / 1000)), timeout: !!timeout };
    p.attempts.push(att);
    delete p.activeMock;
    store.event(e.id, `${att.pass ? 'Passed' : 'Took'} <b>${m.title}</b> with <b>${score}%</b>`, att.pass ? 'trophy' : 'timer');
    location.href = `/${e.id}/results/?id=${att.id}`;
  }
  const q = qs[cur], order = m.orders[cur];
  const multi = Array.isArray(q.answer), need = multi ? q.answer.length : 1;
  const picked = m.answers[cur] || [];
  const answered = Object.keys(m.answers).filter((k) => (m.answers[k] || []).length).length;
  const flagged = Object.values(m.flags).filter(Boolean).length;
  const choose = (oi) => {
    let next;
    if (multi) { if (picked.includes(oi)) next = picked.filter((x) => x !== oi); else { if (picked.length >= need) return; next = [...picked, oi]; } }
    else next = [oi];
    m.answers[cur] = next; store.save(); force((n) => n + 1);
  };
  const Grid = () => (
    <div>
      <div className="row small muted" style={{ marginBottom: 10 }}><span className="tag accent">answered</span><span className="tag warn">flagged</span><span>Click a number to jump</span></div>
      <div className="navgrid">{qs.map((_, i) => <button key={i} className={((m.answers[i] || []).length ? 'ans ' : '') + (m.flags[i] ? 'flag ' : '') + (i === cur ? 'cur' : '')} onClick={() => go(i)}>{i + 1}</button>)}</div>
    </div>
  );
  return (
    <Shell compact noFooter>
      <main>
        <div className="mock-head">
          <b>{m.title}</b><span className="small">Question <b>{cur + 1}</b> of {qs.length} · {answered} answered</span>
          <div className="spacer" />
          <span className={'timer' + (left < 300 ? ' low' : '')}><Icon name="timer" size={17} /> {fmtTime(left)}</span>
          <button className={'btn sm' + (m.flags[cur] ? ' flagged' : '')} onClick={() => { m.flags[cur] = !m.flags[cur]; store.save(); force((n) => n + 1); }}><Icon name="flag" size={15} />{m.flags[cur] ? 'Flagged' : 'Flag'}</button>
          <button className="btn sm" onClick={() => setSheet('nav')}>Navigator</button>
          <button className="btn sm primary" onClick={() => setSheet('submit')}>Submit</button>
        </div>
        <div className="quiz-wrap">
          <div className="q-top"><Bar value={(answered / qs.length) * 100} /></div>
          <div className="q-card">
            <div className="q-meta"><b>Question {cur + 1}</b><span className={'tag' + (multi ? ' warn' : '')}>Select {need}</span></div>
            <Html as="div" className="q-text" html={q.q} />
            <div className="opts">
              {order.map((oi, k) => {
                const sel = picked.includes(oi);
                return (
                  <button key={oi} className={'opt' + (multi ? ' multi' : '') + (sel ? ' sel' : '')} onClick={() => choose(oi)}>
                    <span className="key">{multi ? (sel ? <Icon name="check" size={14} strokeWidth={3} /> : '') : String.fromCharCode(65 + k)}</span><Html html={q.options[oi]} />
                  </button>
                );
              })}
            </div>
            <div className="q-foot">
              <button className="btn" disabled={cur === 0} onClick={() => go(cur - 1)}><Icon name="chevron-left" size={17} />Previous</button>
              {cur === qs.length - 1 ? <button className="btn primary" onClick={() => setSheet('submit')}>Review &amp; submit</button> : <button className="btn primary" onClick={() => go(cur + 1)}>Next <Icon name="chevron-right" size={17} /></button>}
            </div>
          </div>
          <div className="card" style={{ marginTop: 16 }}><Grid /></div>
        </div>
        <div className={'drawer' + (sheet ? ' open' : '')}>
          <div className="scrim" onClick={() => setSheet(null)} />
          {sheet && (
            <div className="sheet">
              {sheet === 'submit' ? <>
                <h2>Submit exam?</h2>
                <p className="muted"><b>{qs.length - answered}</b> unanswered · <b>{flagged}</b> flagged. Unanswered questions score zero, so there is no penalty for guessing.</p>
                <Grid />
                <div className="row" style={{ marginTop: 18 }}><button className="btn" onClick={() => setSheet(null)}>Keep working</button><button className="btn primary" onClick={() => submit(false)}>Submit now</button></div>
              </> : <><h3>Navigator</h3><Grid /></>}
            </div>
          )}
        </div>
      </main>
    </Shell>
  );
}

export function Results({ e, bank }) {
  const ready = useStore();
  const [filter, setFilter] = useState('all');
  const [id, setId] = useState(null);
  useEffect(() => { setId(new URLSearchParams(location.search).get('id')); }, []);
  if (!ready || id == null) return <Shell><main className="quiz-wrap standalone"><div className="q-card">Loading results…</div></main></Shell>;
  const t = store.exam(e.id).attempts.find((x) => x.id === id);
  if (!t) return <Shell><main className="quiz-wrap standalone"><div className="q-card empty"><h2>Attempt not found</h2><p className="muted">Results are stored in the browser where you took the exam.</p><Link className="btn primary" href={`/${e.id}/grades/`}>Go to grades</Link></div></main></Shell>;
  const byId = Object.fromEntries(bank.map((q) => [q.id, q]));
  const qs = t.qids.map((x) => byId[x]);
  const weakest = e.domains.map((d) => ({ d, r: t.byDomain[d.id] })).filter((x) => x.r).sort((a, b) => a.r.c / a.r.t - b.r.c / b.r.t)[0];
  const jump = (i) => { setFilter('all'); setTimeout(() => document.getElementById('rq' + (i + 1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30); };
  return (
    <Shell>
      <main className="quiz-wrap standalone">
        <nav className="crumbs"><Link href={`/${e.id}/`}>{e.short}</Link> <span>›</span> <Link href={`/${e.id}/grades/`}>Grades</Link> <span>›</span> {t.title}</nav>
        <div className={'q-card result-card ' + (t.pass ? 'pass' : 'fail')}>
          <div className="result-hero">
            <Ring value={t.score} color={t.pass ? 'var(--ok)' : 'var(--bad)'}><b>{t.score}%</b><span>{t.correct}/{t.total}</span></Ring>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div className="eyebrow">{t.pass ? 'Passed' : 'Not passed'}</div>
              <h2>{t.pass ? 'You would have passed' : `Not yet: ${e.mock.pass}% needed`}</h2>
              <p className="muted">{new Date(t.date).toLocaleString()} · time used <b>{fmtTime(t.timeUsed)}</b> of {e.mock.minutes}:00{t.timeout ? ' (time ran out)' : ''}</p>
              {weakest && <p>Weakest domain: <b>{weakest.d.name}</b> ({pct(weakest.r.c, weakest.r.t)}%). <Link href={`/${e.id}/practice/${weakest.d.id}/`}>Drill it</Link></p>}
              <div className="row"><Link className="btn primary" href={`/${e.id}/mock/${t.key}/`}>Retake</Link><Link className="btn" href={`/${e.id}/drill/`}>Weak-area drill</Link><Link className="btn ghost" href={`/${e.id}/`}>Course home</Link></div>
            </div>
          </div>
          <h3 style={{ marginTop: 22 }}>Score by domain</h3>
          {e.domains.map((d) => { const r = t.byDomain[d.id] || { c: 0, t: 0 }, v = pct(r.c, r.t); return <div key={d.id} className="dom-row"><span><i className="dotc" style={{ background: color(d.color) }} />{d.name} <span className="muted small">{d.weight}%</span></span><Bar value={v} tone={v >= e.mock.pass ? 'ok' : 'bad'} /><b>{r.c}/{r.t}</b></div>; })}
          <div className="navgrid" style={{ marginTop: 14 }}>{qs.map((q, i) => <button key={i} className={q && isCorrect(q, t.answers[i]) ? 'r-ok' : 'r-bad'} onClick={() => jump(i)}>{i + 1}</button>)}</div>
        </div>
        <div className="row-between" style={{ margin: '28px 0 12px' }}>
          <h2 style={{ margin: 0 }}>Review answers</h2>
          <div className="seg">{[['all', 'All'], ['wrong', 'Incorrect'], ['flagged', 'Flagged']].map(([k, l]) => <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>)}</div>
        </div>
        {qs.map((q, i) => {
          if (!q) return null;
          const ok = isCorrect(q, t.answers[i]);
          if ((filter === 'wrong' && ok) || (filter === 'flagged' && !t.flags[i])) return null;
          return <ReviewItem key={i} e={e} q={q} picked={t.answers[i] || []} order={t.orders[i]} num={i + 1} />;
        })}
      </main>
    </Shell>
  );
}
