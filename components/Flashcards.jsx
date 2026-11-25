'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from './Icon';
import Player, { useNeighbours } from './Player';
import Shell from './Shell';
import { Bar, Html } from './ui';
import { store, useStore, useStudyTimer } from '@/lib/store';
import { shuffle } from '@/lib/util';

function Deck({ e, cards, label, chapter, next }) {
  const ready = useStore();
  const [deck, setDeck] = useState(cards);
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const [onlyUnknown, setOnlyUnknown] = useState(false);
  useEffect(() => { setDeck(shuffle(cards)); }, [cards]);
  const flash = ready ? store.exam(e.id).flash : {};
  const known = cards.filter((c) => flash[c.term] === 'known').length;
  const mark = (v) => { const c = deck[i]; if (!c) return; store.exam(e.id).flash[c.term] = v; store.touch({ cards: 1 }); store.save(); setFlip(false); setI(i + 1); };
  useEffect(() => {
    const onKey = (ev) => {
      if (/input|textarea|select/i.test(ev.target.tagName)) return;
      if (ev.key === ' ') { ev.preventDefault(); setFlip((f) => !f); } else if (ev.key === '1') mark('again'); else if (ev.key === '2') mark('known');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });
  useEffect(() => {
    if (ready && chapter && deck.length && i >= deck.length) {
      const st = store.chapter(e.id, chapter.id);
      if (!st.flashDone) { st.flashDone = true; store.event(e.id, `Finished the <b>${chapter.title}</b> flashcards`, 'layers'); }
    }
  }, [i, deck.length, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  const restart = (unknownOnly) => { setOnlyUnknown(unknownOnly); setDeck(shuffle(unknownOnly ? cards.filter((c) => flash[c.term] !== 'known') : cards)); setI(0); setFlip(false); };
  const c = deck[i];
  return (
    <div className="quiz-wrap">
      <div className="row-between fc-head">
        <div><div className="eyebrow">Flashcards · optional</div><h2 style={{ margin: 0 }}>{label}</h2></div>
        <div className="row">
          <span className="tag ok">{known}/{cards.length} known</span>
          <button className="btn sm" onClick={() => restart(!onlyUnknown)}>{onlyUnknown ? 'Show all' : 'Only unknown'}</button>
          <button className="btn sm" onClick={() => restart(onlyUnknown)}><Icon name="shuffle" size={15} />Shuffle</button>
        </div>
      </div>
      {!c ? (
        <div className="q-card center">
          <h2>{deck.length ? 'Deck complete' : 'No cards to show'}</h2>
          <p className="muted">{known} of {cards.length} terms marked as known.</p>
          <div className="row center"><button className="btn" onClick={() => restart(true)}>Study unknown cards</button>{next && <Link className="btn primary" href={next.href}>Go to next item <Icon name="chevron-right" size={17} /></Link>}</div>
        </div>
      ) : (
        <>
          <Bar value={(i / deck.length) * 100} />
          <div className="fc-stage">
            <div className={'fc' + (flip ? ' on' : '')} onClick={() => setFlip(!flip)} role="button" tabIndex={0} aria-label="Flip card">
              <div className="face front"><small>{c.ch}</small><Html as="div" html={c.term} /><span className="fc-hint">Click or press Space to flip</span></div>
              <div className="face back"><Html as="small" html={c.term} /><Html as="div" html={c.def} /></div>
            </div>
          </div>
          <div className="row center" style={{ marginTop: 20 }}>
            <button className="btn" onClick={() => mark('again')}>Still learning (1)</button>
            <button className="btn primary" onClick={() => mark('known')}><Icon name="check" size={17} />I know this (2)</button>
          </div>
          <p className="muted small center">Card {i + 1} of {deck.length}</p>
        </>
      )}
      {/* full glossary in the HTML for search engines and no-JS readers */}
      <dl className="sr-only">{cards.map((x) => [<dt key={x.term + 't'} dangerouslySetInnerHTML={{ __html: x.term }} />, <dd key={x.term + 'd'} dangerouslySetInnerHTML={{ __html: x.def }} />])}</dl>
    </div>
  );
}

export function ChapterFlashcards({ e, ch, cards }) {
  const { next } = useNeighbours(e, ch.id, 'flash');
  return <Player e={e} chId={ch.id} kind="flash"><Deck e={e} cards={cards} label={'Flashcards: ' + ch.title} chapter={ch} next={next} /></Player>;
}

export function AllFlashcards({ e, cards }) {
  useStudyTimer();
  return (
    <Shell>
      <div className="page-head"><nav className="crumbs"><Link href={`/${e.id}/`}>{e.short}</Link> <span>›</span> <Link href={`/${e.id}/resources/`}>Resources</Link> <span>›</span> All flashcards</nav></div>
      <Deck e={e} cards={cards} label={`All ${e.short} flashcards`} />
    </Shell>
  );
}
