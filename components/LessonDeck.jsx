'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Blocks, { StepCtx } from './Blocks';
import Icon from './Icon';
import CourseArt from './CourseArt';
import Player, { NextBar, useNeighbours } from './Player';
import { Html } from './ui';
import { store, useStore } from '@/lib/store';
import { color } from '@/lib/util';

function SlideSteps({ registry, children }) {
  const api = useMemo(() => ({ register: (s) => { registry.push(s); return () => { const i = registry.indexOf(s); if (i >= 0) registry.splice(i, 1); }; } }), [registry]);
  return <StepCtx.Provider value={api}>{children}</StepCtx.Provider>;
}

export default function LessonDeck({ e, ch }) {
  const ready = useStore();
  const total = ch.slides.length + 2;
  const [i, setI] = useState(0);
  const steppers = useRef(Array.from({ length: total }, () => [])).current;
  const { next: nextIt } = useNeighbours(e, ch.id, 'learn');
  const d = e.domains.find((x) => x.id === ch.domain) || {};

  // slide index lives in the URL hash (#s3) so links and reloads land on the same slide
  useEffect(() => {
    const fromHash = () => { const m = /^#s(\d+)$/.exec(location.hash); if (m) setI(Math.max(0, Math.min(total - 1, +m[1] - 1))); };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [total]);

  // record progress whenever the visible slide changes
  useEffect(() => {
    if (!ready) return;
    const st = store.chapter(e.id, ch.id);
    if (!st.viewed.includes(i)) { st.viewed.push(i); store.touch({ slides: 1 }); }
    if (i === total - 1 && !st.completed) { st.completed = true; store.event(e.id, `Completed lesson <b>${ch.title}</b>`, 'book-open'); }
    st.last = i;
    store.setLast({ exam: e.id, href: `/${e.id}/learn/${ch.id}/#s${i + 1}`, label: `${ch.title}: Lesson (slide ${i + 1})` });
    history.replaceState(null, '', `#s${i + 1}`);
    document.querySelector('.pl-body')?.scrollTo(0, 0);
  }, [i, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = useCallback((n) => setI((cur) => Math.max(0, Math.min(total - 1, typeof n === 'function' ? n(cur) : n))), [total]);
  const advance = useCallback(() => {
    const s = steppers[i].find((x) => x.pending());
    if (s) return s.next();
    if (i < total - 1) go(i + 1);
    else if (nextIt) location.href = nextIt.href;
  }, [i, total, nextIt, go, steppers]);

  useEffect(() => {
    const onKey = (ev) => {
      if (/input|textarea|select/i.test(ev.target.tagName)) return;
      if (ev.key === 'ArrowRight' || ev.key === 'PageDown' || ev.key === ' ') { ev.preventDefault(); advance(); }
      else if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') { ev.preventDefault(); go(i - 1); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [advance, go, i]);

  const touch = useRef(null);
  const viewed = ready ? store.chapter(e.id, ch.id).viewed : [];
  const slideTitle = (j) => (j === 0 ? 'Intro' : j === total - 1 ? 'Recap' : String(ch.slides[j - 1].title || '').replace(/<[^>]+>/g, ''));

  return (
    <Player e={e} chId={ch.id} kind="learn" headRight={<span className="muted small">Slide {i + 1} of {total}</span>} slideRef={() => `[Slide ${i + 1}: ${slideTitle(i)}]`}>
      <div className="deck-progress"><span style={{ width: ((i + 1) / total) * 100 + '%' }} /></div>
      <div className="stage slide-all" onTouchStart={(ev) => (touch.current = ev.touches[0].clientX)}
        onTouchEnd={(ev) => { if (touch.current == null) return; const dx = ev.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 70) (dx < 0 ? advance() : go(i - 1)); touch.current = null; }}>
        <article className="slide cover" hidden={i !== 0} aria-label="Lesson introduction">
          <div className="cover-art"><CourseArt exam={e} k={'c' + ch.num} w={1100} h={200} tag={`${e.short} · Lesson ${ch.num}`} title="" fs={40} /></div>
          <div className="cover-body">
            <div className="kicker" style={{ color: color(d.color) }}>Lesson {ch.num} · {d.name} · {d.weight}% of exam</div>
            <h1><span className="cover-ic"><Icon name={ch.icon || 'book-open'} size={28} /></span>{ch.title}</h1>
            <Html as="div" className="sub" html={ch.subtitle || ''} />
            {ch.objectives && <div><h2 className="h3">What you’ll learn</h2><ul className="objectives">{ch.objectives.map((o, j) => <li key={j}><Icon name="check" size={18} /><Html html={o} /></li>)}</ul></div>}
            <p className="muted small">{total} slides · ~{ch.minutes || Math.round(ch.slides.length * 2.5)} min · then a {(ch.quiz || []).length}-question practice quiz. Use <kbd>←</kbd> <kbd>→</kbd> or <kbd>Space</kbd>.</p>
          </div>
        </article>
        {ch.slides.map((s, j) => (
          <article key={j} className="slide" hidden={i !== j + 1}>
            {s.kicker && <Html as="div" className="kicker" html={s.kicker} />}
            {s.title && <Html as="h2" className="slide-title" html={s.title} />}
            <SlideSteps registry={steppers[j + 1]}><Blocks blocks={s.blocks} /></SlideSteps>
            {s.tip && <div className="tip-box"><Icon name="target" size={20} /><div><b>Exam tip</b> <Html html={s.tip} /></div></div>}
          </article>
        ))}
        <article className="slide" hidden={i !== total - 1}>
          <div className="kicker">Lesson recap</div>
          <h2 className="slide-title">What to remember for the exam</h2>
          <ul className="b-bullets">{(ch.summary || []).map((x, j) => <Html key={j} as="li" html={x} />)}</ul>
          <NextBar e={e} next={nextIt} text="Lesson completed" />
        </article>
      </div>
      <div className="deck-foot">
        <button className="btn" disabled={i === 0} onClick={() => go(i - 1)}><Icon name="chevron-left" size={17} />Previous</button>
        <div className="dots">{Array.from({ length: total }, (_, j) => <button key={j} aria-label={'Slide ' + (j + 1)} className={(j === i ? 'cur ' : '') + (viewed.includes(j) ? 'seen' : '')} onClick={() => go(j)} />)}</div>
        <button className="btn primary" onClick={advance}>{i === total - 1 ? (nextIt ? 'Next item' : 'Done') : 'Next'} <Icon name="chevron-right" size={17} /></button>
      </div>
    </Player>
  );
}
