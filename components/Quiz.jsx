'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { SourceLinks } from './Blocks';
import Icon from './Icon';
import Player, { useNeighbours } from './Player';
import Shell from './Shell';
import { Bar, Html, Ring } from './ui';
import { store, useStore, useStudyTimer } from '@/lib/store';
import { asArr, color, isCorrect, pct, shuffle } from '@/lib/util';

export function ReviewItem({ e, q, picked = [], order, num }) {
  const ans = asArr(q.answer);
  order = order || q.options.map((_, i) => i);
  const ok = isCorrect(q, picked);
  const d = e.domains.find((x) => x.id === q.domain) || {};
  return (
    <div className="review-item" id={num ? 'rq' + num : undefined}>
      <div className="q-meta">
        <span className="row" style={{ gap: 8 }}>{num && <b>Q{num}</b>}<span className={'tag ' + (ok ? 'ok' : picked.length ? 'bad' : 'warn')}>{ok ? 'Correct' : picked.length ? 'Incorrect' : 'Unanswered'}</span></span>
        <span className="tag" style={{ color: color(d.color) }}>{d.name}</span>
      </div>
      <Html as="div" className="q-text" html={q.q} />
      {order.map((oi, k) => (
        <div key={oi} className={'opt static' + (ans.includes(oi) ? ' correct' : picked.includes(oi) ? ' wrong' : '')}>
          <span className="key">{String.fromCharCode(65 + k)}</span><span><Html html={q.options[oi]} />{picked.includes(oi) && <span className="muted small"> (your answer)</span>}</span>
        </div>
      ))}
      <div className="explain"><Html as="div" html={q.explain || ''} /><SourceLinks q={q} /></div>
    </div>
  );
}

/** Practice quiz with instant feedback. `pool` is the full question list; `pick` selects/orders it on start. */
export function Practice({ e, title, pool, pick, chapter, next, back, intro }) {
  const ready = useStore();
  const [qs, setQs] = useState(null); // null = intro screen
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState([]);
  const [picked, setPicked] = useState([]);
  const [locked, setLocked] = useState(false);
  const [order, setOrder] = useState([]);
  const start = () => { const list = pick ? pick(pool) : shuffle(pool); setQs(list); setIdx(0); setCorrect(0); setMissed([]); setup(list[0]); };
  const setup = (q) => { setPicked([]); setLocked(false); setOrder(q ? shuffle(q.options.map((_, i) => i)) : []); };
  useEffect(() => { if (!intro && ready && !qs) start(); }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const best = ready && chapter ? store.chapter(e.id, chapter.id).quizBest : null;
  if (!qs) {
    return (
      <div className="quiz-wrap"><div className="q-card quiz-intro">
        <div className="eyebrow">{chapter ? 'Practice quiz · ungraded' : 'Practice'}</div>
        <h1>{title}</h1>
        <div className="kv">
          <div><b>{pick ? Math.min(pool.length, 20) : pool.length}</b><span>questions</span></div>
          <div><b>{e.mock.pass}%</b><span>to pass</span></div>
          {chapter && <div><b>{best != null ? best + '%' : '–'}</b><span>your best</span></div>}
          <div><b>Instant</b><span>feedback + source</span></div>
        </div>
        <p className="muted">Every answer is explained and linked to its official source. Retake as often as you like; your best grade counts.</p>
        <button className="btn primary lg" onClick={start} disabled={!ready}>{best != null ? 'Retake quiz' : 'Start quiz'}</button>
      </div></div>
    );
  }

  if (idx >= qs.length) {
    const score = pct(correct, qs.length), pass = score >= e.mock.pass;
    return (
      <div className="quiz-wrap">
        <div className={'q-card result-card ' + (pass ? 'pass' : 'fail')}>
          <div className="result-hero">
            <Ring value={score} color={pass ? 'var(--ok)' : 'var(--warn)'}><b>{score}%</b><span>{correct}/{qs.length}</span></Ring>
            <div>
              <div className="eyebrow">{pass ? 'Passed' : 'Not passed yet'}</div>
              <h2>{pass ? 'Great work, you passed!' : `Aim for ${e.mock.pass}% to pass`}</h2>
              <p className="muted">{pass ? (chapter ? 'This item is now marked complete in your course.' : 'Keep the streak going.') : 'Review the explanations below, revisit the slides, then retake.'}</p>
              <div className="row">
                {pass && next && <Link className="btn primary" href={next.href}>Go to next item <Icon name="chevron-right" size={17} /></Link>}
                <button className={'btn' + (pass ? '' : ' primary')} onClick={start}>Retake</button>
                {chapter ? <Link className="btn ghost" href={`/${e.id}/learn/${chapter.id}/`}>Review slides</Link> : <Link className="btn ghost" href={back}>Back to course</Link>}
              </div>
            </div>
          </div>
        </div>
        {missed.length > 0 && <><h3 className="sec-title">Review {missed.length} missed question{missed.length === 1 ? '' : 's'}</h3>{missed.map((m) => <ReviewItem key={m.q.id} e={e} q={m.q} picked={m.picked} />)}</>}
      </div>
    );
  }

  const q = qs[idx];
  const multi = Array.isArray(q.answer), need = multi ? q.answer.length : 1;
  const ans = asArr(q.answer);
  const d = e.domains.find((x) => x.id === q.domain) || {};
  const grade = (p) => {
    setLocked(true);
    const ok = isCorrect(q, p);
    if (ok) setCorrect((c) => c + 1); else setMissed((m) => [...m, { q, picked: p }]);
    store.recordAnswer(e.id, q.id, ok); store.save();
  };
  const finish = () => {
    const score = pct(correct, qs.length), pass = score >= e.mock.pass;
    if (chapter) {
      const st = store.chapter(e.id, chapter.id), was = st.quizBest;
      st.quizBest = Math.max(st.quizBest || 0, score); st.quizAttempts = (st.quizAttempts || 0) + 1;
      st.quizHistory = (st.quizHistory || []).concat({ score, t: Date.now() }).slice(-20);
      store.event(e.id, `Scored <b>${score}%</b> on the <b>${chapter.title}</b> quiz` + (pass && !(was >= e.mock.pass) ? ' and passed it' : ''), pass ? 'circle-check' : 'clipboard-list');
    } else store.event(e.id, `Scored <b>${score}%</b> on <b>${title}</b>`, 'target');
  };
  const onNext = () => { if (idx === qs.length - 1) finish(); setIdx(idx + 1); setup(qs[idx + 1]); };
  const ok = locked && isCorrect(q, picked);
  return (
    <div className="quiz-wrap">
      <div className="q-top"><span className="small">Question <b>{idx + 1}</b> of {qs.length}</span><Bar value={(idx / qs.length) * 100} /><span className="small muted">{correct} correct</span></div>
      <div className="q-card">
        <div className="q-meta"><span className="tag" style={{ color: color(d.color) }}>{d.name}</span><span className={'tag' + (multi ? ' warn' : '')}>Select {need}</span></div>
        <Html as="div" className="q-text" html={q.q} />
        <div className="opts">
          {order.map((oi, k) => {
            const sel = picked.includes(oi);
            const cls = 'opt' + (multi ? ' multi' : '') + (locked ? (ans.includes(oi) ? ' correct' : sel ? ' wrong' : '') : sel ? ' sel' : '');
            return (
              <button key={oi} className={cls} disabled={locked} onClick={() => {
                if (multi) setPicked(sel ? picked.filter((x) => x !== oi) : [...picked, oi]);
                else { setPicked([oi]); grade([oi]); }
              }}>
                <span className="key">{multi ? (sel ? <Icon name="check" size={14} strokeWidth={3} /> : '') : String.fromCharCode(65 + k)}</span><Html html={q.options[oi]} />
              </button>
            );
          })}
        </div>
        {locked && (
          <div className="explain">
            <div className={'verdict ' + (ok ? 'ok' : 'bad')}><Icon name={ok ? 'circle-check' : 'circle-x'} size={19} /> {ok ? 'Correct' : 'Incorrect'}</div>
            <Html as="div" html={q.explain || ''} /><SourceLinks q={q} />
          </div>
        )}
        <div className="q-foot">
          <Link className="btn ghost sm" href={back}>Exit</Link>
          <div className="row">
            {multi && !locked && <button className="btn primary" disabled={picked.length !== need} onClick={() => grade(picked)}>Submit answer</button>}
            {locked && <button className="btn primary" autoFocus onClick={onNext}>{idx === qs.length - 1 ? 'See results' : 'Next question'}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Chapter quiz inside the lesson player. */
export function ChapterQuiz({ e, ch, questions }) {
  const { next } = useNeighbours(e, ch.id, 'quiz');
  return (
    <Player e={e} chId={ch.id} kind="quiz">
      {/* questions are in the static HTML for search engines; the interactive quiz takes over in the browser */}
      <Practice e={e} title={'Practice quiz: ' + ch.title} pool={questions} chapter={ch} next={next} back={`/${e.id}/`} intro />
      <noscript><ol>{questions.map((q) => <li key={q.id} dangerouslySetInnerHTML={{ __html: q.q }} />)}</ol></noscript>
    </Player>
  );
}

/** Domain drill or weak-area drill (standalone page). */
export function Drill({ e, title, pool, mode }) {
  const ready = useStore();
  useStudyTimer();
  const pick = useMemo(() => (list) => {
    if (mode === 'weak') {
      const stats = store.exam(e.id).qstats;
      const score = (q) => { const s = stats[q.id]; if (!s) return 1; if (s.last === 0) return 0; return 2 + s.correct / s.seen; };
      return shuffle(list).sort((a, b) => score(a) - score(b)).slice(0, 20);
    }
    return shuffle(list).slice(0, 20);
  }, [e.id, mode]);
  return (
    <Shell>
      <div className="page-head"><nav className="crumbs"><Link href={`/${e.id}/`}>{e.short}</Link> <span>›</span> {title}</nav></div>
      {ready ? <Practice e={e} title={title} pool={pool} pick={pick} back={`/${e.id}/`} intro /> : <div className="quiz-wrap"><div className="q-card">Loading…</div></div>}
    </Shell>
  );
}
