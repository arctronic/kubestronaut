'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { Topbar } from './Shell';
import { Bar, StatusDot } from './ui';
import { store, useStore, useStudyTimer } from '@/lib/store';
import { chapterItems } from '@/lib/progress';
import { color, pct } from '@/lib/util';

const LABEL = { learn: 'Lesson', quiz: 'Practice quiz', flash: 'Flashcards' };

/** Neighbouring items in course order (slides -> quiz -> flashcards -> next lesson). */
export function useNeighbours(e, chId, kind) {
  const ready = useStore();
  const items = e.chapters.flatMap((c) => chapterItems(e, c, !ready));
  const idx = items.findIndex((x) => x.ch.id === chId && x.kind === kind);
  return { prev: items[idx - 1], next: items[idx + 1] };
}

export default function Player({ e, chId, kind, headRight, slideRef, children }) {
  const ready = useStore();
  useStudyTimer();
  const ch = e.chapters.find((c) => c.id === chId);
  const d = e.domains.find((x) => x.id === ch.domain) || {};
  const modNum = e.domains.indexOf(d) + 1;
  const modChapters = e.chapters.filter((c) => c.domain === ch.domain);
  const { prev, next } = useNeighbours(e, chId, kind);
  const [side, setSide] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState('Autosaves in this browser');
  const ta = useRef(null), tmr = useRef(null);

  useEffect(() => {
    if (!ready) return;
    const ui = store.ui();
    setSide(!(ui.sideClosed || window.innerWidth < 860));
    setNotesOpen(!!ui.notesOpen);
    const n = store.exam(e.id).notes[chId] || '';
    setNote(n); if (n) setSaved('Saved locally');
    if (kind !== 'learn') store.setLast({ exam: e.id, href: location.pathname, label: `${ch.title}: ${LABEL[kind]}` });
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSide = () => { const v = !side; setSide(v); store.ui().sideClosed = !v; store.save(); };
  const toggleNotes = () => { const v = !notesOpen; setNotesOpen(v); store.ui().notesOpen = v; store.save(); };
  const writeNote = (v) => {
    setNote(v); setSaved('Saving…'); clearTimeout(tmr.current);
    tmr.current = setTimeout(() => { store.exam(e.id).notes[chId] = v; store.save(); setSaved('Saved locally · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })); }, 400);
  };
  const insertRef = () => {
    if (!slideRef) return;
    const r = '\n' + slideRef() + ' ';
    const el = ta.current, pos = el ? el.selectionStart || note.length : note.length;
    writeNote(note.slice(0, pos) + r + note.slice(pos));
    el && el.focus();
  };
  const modItems = modChapters.flatMap((c) => chapterItems(e, c, !ready)).filter((x) => x.required);
  const modDone = modItems.filter((x) => x.done).length;

  return (
    <>
      <Topbar compact />
      <div className="player">
        <aside className={'pl-side' + (side ? '' : ' closed')} aria-label="Module outline">
          <Link className="pl-course" href={`/${e.id}/`}><Icon name="chevron-left" size={17} /><span>{e.title}</span></Link>
          <div className="pl-mod">
            <div className="eyebrow" style={{ color: color(d.color) }}>Module {modNum}</div>
            <h3>{d.name}</h3>
            <div className="mod-prog"><Bar value={pct(modDone, modItems.length)} tone={modDone === modItems.length ? 'ok' : ''} /><span className="small">{modDone}/{modItems.length}</span></div>
          </div>
          <div className="pl-outline">
            {modChapters.map((c) => (
              <div key={c.id} className={'pl-group' + (c.id === chId ? ' current' : '')}>
                <div className="pl-gtitle"><span className="pl-gic"><Icon name={c.icon || 'book-open'} size={16} /></span><span>{c.num}. {c.title}</span></div>
                {chapterItems(e, c, !ready).map((it) => (
                  <Link key={it.kind} href={it.href} className={'pl-item' + (c.id === chId && it.kind === kind ? ' on' : '') + (it.done ? ' done' : '')}>
                    <StatusDot item={it} /><span className="pl-it"><span>{it.kind === 'learn' ? 'Slides' : it.type}</span><span className="muted small">{it.meta}</span></span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </aside>

        <section className="pl-main">
          <div className="pl-head">
            <button className="icon-btn" title="Toggle outline" aria-label="Toggle outline" onClick={toggleSide}><Icon name="menu" /></button>
            <div className="pl-crumbs"><span className="muted">Module {modNum}</span> <span className="muted">›</span> <span className="muted">{ch.title}</span> <span className="muted">›</span> <b>{LABEL[kind]}</b></div>
            <div className="spacer" />
            {headRight}
            <button className="btn sm ghost" onClick={toggleNotes}><Icon name="notebook-pen" size={17} /> Notes</button>
            {prev && <Link className="icon-btn" href={prev.href} title={'Previous item: ' + prev.title} aria-label="Previous item"><Icon name="chevron-left" /></Link>}
            {next && <Link className="icon-btn" href={next.href} title={'Next item: ' + next.title} aria-label="Next item"><Icon name="chevron-right" /></Link>}
          </div>
          <div className="pl-body">{children}</div>
        </section>

        <aside className={'pl-notes' + (notesOpen ? ' open' : '')} aria-label="My notes">
          <div className="row-between"><h3><Icon name="notebook-pen" size={20} /> My notes</h3><button className="icon-btn" aria-label="Close notes" onClick={toggleNotes}><Icon name="x" /></button></div>
          <p className="muted small">{ch.num}. {ch.title}</p>
          {slideRef && <button className="btn sm ghost" onClick={insertRef}>+ Reference this slide</button>}
          <textarea ref={ta} className="note-ta" placeholder="Write what you want to remember from this lesson…" value={note} onChange={(ev) => writeNote(ev.target.value)} onKeyDown={(ev) => ev.stopPropagation()} />
          <span className="muted small">{saved}</span>
          <Link className="small link-arrow" href={`/${e.id}/notes/`}>All notes <Icon name="arrow-right" size={15} /></Link>
        </aside>
      </div>
    </>
  );
}

export function NextBar({ e, next, text }) {
  return (
    <div className="next-bar">
      <div className="nb-left"><span className="sdot done"><Icon name="check" size={14} strokeWidth={3} /></span><div><b>{text || 'Item completed'}</b><div className="muted small">Your progress is saved in this browser.</div></div></div>
      {next ? <Link className="btn primary" href={next.href}>Go to next item <Icon name="chevron-right" size={17} /></Link> : <Link className="btn primary" href={`/${e.id}/mock/1/`}>Take Mock exam 1 <Icon name="chevron-right" size={17} /></Link>}
    </div>
  );
}
