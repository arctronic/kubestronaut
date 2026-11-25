'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import CourseArt from './CourseArt';
import { Bar, Html, Ring, StatusDot } from './ui';
import { store, useStore } from '@/lib/store';
import { chapterItems, courseProgress, domainAccuracy, domainOfQuestion, mockItems, resumeTarget } from '@/lib/progress';
import { color, pct } from '@/lib/util';

/* ---------- hero progress card ---------- */
export function CourseHeroCard({ e }) {
  const ready = useStore();
  const cp = ready ? courseProgress(e) : { pct: 0, done: 0, total: e.chapters.length * 2 + e.mock.sets };
  const rt = ready ? resumeTarget(e) : { href: `/${e.id}/learn/${e.chapters[0].id}/`, label: e.chapters[0].title };
  return (
    <div className="ch-card">
      <div className="ch-art"><CourseArt exam={e} k="h" w={340} h={150} tag="Course 1 of 5" fs={46} /></div>
      <div className="ch-prog">
        <Ring value={cp.pct} size={76}><b>{cp.pct}%</b></Ring>
        <div><b>{cp.pct === 100 ? 'Course complete' : cp.pct ? 'Keep going!' : 'Ready when you are'}</b><div className="muted small">{cp.done} of {cp.total} required items done</div></div>
      </div>
      <Link className="btn primary block" href={rt.href}>{cp.done || (ready && store.state.lastVisit) ? 'Resume learning' : 'Start learning'}</Link>
      <div className="muted small center">Next: {rt.label}</div>
    </div>
  );
}

const TABS = [['', 'Course material'], ['grades', 'Grades'], ['notes', 'Notes'], ['guide', 'Exam guide'], ['resources', 'Resources']];
export function CourseTabs({ examId }) {
  const path = (usePathname() || '').replace(/\/$/, '');
  const seg = path.split('/')[2] || '';
  const active = seg === 'cheatsheet' ? 'resources' : seg;
  return (
    <nav className="tabs" aria-label="Course sections"><div className="tabs-inner">
      {TABS.map(([k, l]) => <Link key={k} className={k === active ? 'on' : ''} href={`/${examId}/` + (k ? k + '/' : '')}>{l}</Link>)}
    </div></nav>
  );
}

/* ---------- course material (syllabus) ---------- */
function ItemRow({ it, pass }) {
  const ic = { learn: 'presentation', quiz: 'clipboard-list', flash: 'layers', mock: 'timer' }[it.kind];
  return (
    <Link className={'item-row' + (it.done ? ' done' : '')} href={it.href}>
      <StatusDot item={it} />
      <span className={'it-ic ' + it.kind}><Icon name={ic} size={17} /></span>
      <span className="it-main"><span className="it-title">{it.title}</span><span className="it-meta">{it.type} · {it.meta}</span></span>
      {it.grade != null ? <span className={'grade ' + (it.grade >= pass ? 'ok' : 'bad')}>{it.grade}%</span> : it.kind === 'learn' && it.progress && !it.done ? <span className="grade">{it.progress}%</span> : null}
      <span className="it-act">{it.done ? 'Review' : it.started ? 'Resume' : 'Start'}</span>
    </Link>
  );
}

export function CourseMaterial({ e }) {
  const ready = useStore();
  const [collapsed, setCollapsed] = useState({});
  useEffect(() => { if (ready) setCollapsed({ ...(store.ui().collapsed || {}) }); }, [ready]);
  const toggle = (k) => { const ui = store.ui(); ui.collapsed = { ...(ui.collapsed || {}), [k]: !collapsed[k] }; setCollapsed(ui.collapsed); store.save(); };
  // before hydration (and in the static HTML) items render without personal progress
  const items = (c) => chapterItems(e, c, !ready);
  const mocks = mockItems(e, !ready);
  const modules = e.domains.map((d, i) => ({ d, num: i + 1, chapters: e.chapters.filter((c) => c.domain === d.id) }));
  const finalNum = modules.length + 1;
  const jump = (id) => (ev) => { ev.preventDefault(); document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  return (
    <div className="syllabus">
      <aside className="syl-side"><div className="syl-side-inner">
        <h4>Modules</h4>
        {modules.map((m) => {
          const req = m.chapters.flatMap(items).filter((x) => x.required), dn = req.filter((x) => x.done).length;
          return (
            <a key={m.num} className="syl-nav" href={'#mod-' + m.num} onClick={jump('mod-' + m.num)}>
              <span className="mn" style={{ background: color(m.d.color) }}>{m.num}</span>
              <span className="mt"><b>{m.d.name}</b><span className="muted small">{dn}/{req.length} done · {m.d.weight}% of exam</span></span>
            </a>
          );
        })}
        <a className="syl-nav" href="#mod-final" onClick={jump('mod-final')}>
          <span className="mn" style={{ background: 'var(--text)' }}><Icon name="trophy" size={16} /></span>
          <span className="mt"><b>Final assessment</b><span className="muted small">{mocks.filter((x) => x.done).length}/{e.mock.sets} mocks passed</span></span>
        </a>
        <div className="blueprint">
          <h4>Exam blueprint</h4>
          <div className="bp-bar">{e.domains.map((d) => <span key={d.id} style={{ width: d.weight + '%', background: color(d.color) }} title={`${d.name}: ${d.weight}%`} />)}</div>
          {e.domains.map((d) => <div key={d.id} className="bp-row small"><i style={{ background: color(d.color) }} /><span>{d.name}</span><b>{d.weight}%</b></div>)}
        </div>
      </div></aside>

      <div className="syl-main">
        <div className="syl-intro card">
          <div><h2>Course material</h2><p className="muted">Work through each lesson’s slides, then pass its practice quiz ({e.mock.pass}%+) to complete it. Flashcards are optional. Finish with the graded mock exams in Module {finalNum}.</p></div>
          <div className="legend-items small">
            <span><StatusDot item={{ done: true }} />Completed</span><span><StatusDot item={{ started: true }} />In progress</span><span><StatusDot item={{}} />Not started</span>
          </div>
        </div>

        {modules.map((m) => {
          const req = m.chapters.flatMap(items).filter((x) => x.required), dn = req.filter((x) => x.done).length;
          const key = 'm' + m.num, mins = m.chapters.reduce((a, c) => a + (c.minutes || 25) + 10, 0);
          return (
            <section key={key} id={'mod-' + m.num} className={'module' + (collapsed[key] ? ' collapsed' : '')}>
              <button className="mod-head" onClick={() => toggle(key)} aria-expanded={!collapsed[key]}>
                <div className="mod-num" style={{ '--mc': color(m.d.color) }}><span>MODULE</span><b>{m.num}</b></div>
                <div className="mod-title">
                  <h3>{m.d.name}</h3>
                  <div className="muted small">{m.chapters.length} lessons · {m.chapters.reduce((a, c) => a + c.quizCount, 0)} quiz questions · ~{Math.round(mins / 6) / 10} h · {m.d.weight}% of the exam</div>
                  <div className="mod-prog"><Bar value={pct(dn, req.length)} tone={dn === req.length ? 'ok' : ''} /><span className="small">{dn}/{req.length}</span></div>
                </div>
                <span className="chev"><Icon name="chevron-down" /></span>
              </button>
              <div className="mod-topics">{(m.d.topics || []).map((t) => <span key={t} className="topic">{t}</span>)}</div>
              <div className="mod-body">
                {m.chapters.map((c) => (
                  <div key={c.id} className="lesson">
                    <div className="lesson-head">
                      <span className="lesson-ic"><Icon name={c.icon || 'book-open'} size={22} /></span>
                      <div><div className="eyebrow">Lesson {c.num}</div><h4>{c.title}</h4><Html as="p" className="muted small" html={c.subtitle || ''} /></div>
                    </div>
                    <div className="items">{items(c).map((it) => <ItemRow key={it.kind} it={it} pass={e.mock.pass} />)}</div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <section id="mod-final" className="module final">
          <div className="mod-head static">
            <div className="mod-num" style={{ '--mc': 'var(--text)' }}><span>MODULE</span><b>{finalNum}</b></div>
            <div className="mod-title"><h3>Final assessment</h3><div className="muted small">Timed mock exams under real conditions: {e.mock.questions} questions in {e.mock.minutes} minutes, weighted like the official blueprint.</div></div>
          </div>
          <div className="mod-body">
            <div className="items">
              {mocks.map((it) => <ItemRow key={it.mkey} it={it} pass={e.mock.pass} />)}
              <ItemRow pass={e.mock.pass} it={{ kind: 'mock', title: 'Random mock exam', type: 'Ungraded exam', meta: 'fresh questions every time', href: `/${e.id}/mock/random/` }} />
              <ItemRow pass={e.mock.pass} it={{ kind: 'quiz', title: 'Weak-area drill', type: 'Practice', meta: '20 questions you missed or have not seen', href: `/${e.id}/drill/` }} />
            </div>
            <div className="drills"><span className="muted small">Domain drills:</span>{e.domains.map((d) => <Link key={d.id} className="chip-link" href={`/${e.id}/practice/${d.id}/`} style={{ '--cc': color(d.color) }}>{d.name}</Link>)}</div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------- grades ---------- */
export function Grades({ e }) {
  const ready = useStore();
  if (!ready) return <div className="narrowish"><div className="card empty">Loading your grades…</div></div>;
  const p = store.exam(e.id);
  const quizzes = e.chapters.map((c) => { const st = store.chapter(e.id, c.id); return { c, best: st.quizBest, hist: st.quizHistory || [] }; });
  const mocks = mockItems(e);
  const passedQ = quizzes.filter((x) => (x.best || 0) >= e.mock.pass).length;
  const bestMock = p.attempts.reduce((a, t) => Math.max(a, t.score), 0);
  const acc = domainAccuracy(e, domainOfQuestion(e));
  const cp = courseProgress(e);
  const Status = ({ best }) => best == null ? <span className="status none">Not started</span> : best >= e.mock.pass ? <span className="status ok"><Icon name="check" size={15} />Passed</span> : <span className="status bad">Try again</span>;
  const Spark = ({ hist }) => {
    if (!hist.length) return <span className="muted">–</span>;
    const pts = hist.slice(-8);
    return <span className="spark"><svg viewBox={`0 0 ${pts.length * 10} 24`}>{pts.map((v, i) => <rect key={i} x={i * 10 + 1} y={24 - v.score * 0.24} width="7" height={Math.max(2, v.score * 0.24)} rx="1.5" fill={v.score >= e.mock.pass ? 'var(--ok)' : 'var(--warn)'} />)}</svg></span>;
  };
  return (
    <div className="narrowish">
      <div className="grade-summary">
        <div className="card gs"><span className="muted small">Practice quizzes passed</span><b>{passedQ} / {quizzes.length}</b><Bar value={pct(passedQ, quizzes.length)} tone="ok" /></div>
        <div className="card gs"><span className="muted small">Best mock exam</span><b style={{ color: bestMock >= e.mock.pass ? 'var(--ok)' : undefined }}>{bestMock ? bestMock + '%' : '–'}</b><span className="muted small">{p.attempts.length} attempt{p.attempts.length === 1 ? '' : 's'} · pass {e.mock.pass}%</span></div>
        <div className="card gs"><span className="muted small">Course progress</span><b>{cp.pct}%</b><Bar value={cp.pct} /></div>
      </div>
      <h2 className="sec-title">Graded exams</h2>
      <div className="card table-card"><table className="gtable">
        <thead><tr><th>Item</th><th>Status</th><th>Attempts</th><th>Best grade</th><th /></tr></thead>
        <tbody>{mocks.map((m) => {
          const tries = p.attempts.filter((t) => t.key === m.mkey), last = tries[tries.length - 1];
          return (
            <tr key={m.mkey}><td><b>{m.title}</b><div className="muted small">{m.meta}</div></td><td><Status best={m.grade} /></td><td>{tries.length}</td><td>{m.grade != null ? <b>{m.grade}%</b> : '–'}</td>
              <td className="right">{last && <Link className="btn sm ghost" href={`/${e.id}/results/?id=${last.id}`}>Review</Link>}<Link className="btn sm" href={m.href}>{tries.length ? 'Retake' : 'Start'}</Link></td></tr>
          );
        })}</tbody>
      </table></div>
      <h2 className="sec-title">Practice quizzes</h2>
      <div className="card table-card"><table className="gtable">
        <thead><tr><th>Lesson</th><th>Status</th><th>History</th><th>Best grade</th><th /></tr></thead>
        <tbody>{quizzes.map((x) => (
          <tr key={x.c.id}><td><span className="dotc" style={{ background: color((e.domains.find((d) => d.id === x.c.domain) || {}).color) }} /><b>{x.c.num}. {x.c.title}</b></td><td><Status best={x.best} /></td><td><Spark hist={x.hist} /></td>
            <td>{x.best != null ? <b>{x.best}%</b> : '–'}</td><td className="right"><Link className="btn sm" href={`/${e.id}/quiz/${x.c.id}/`}>{x.best != null ? 'Retake' : 'Start'}</Link></td></tr>
        ))}</tbody>
      </table></div>
      <h2 className="sec-title">Mastery by exam domain</h2>
      <div className="card">{e.domains.map((d) => {
        const a = acc[d.id], v = pct(a.correct, a.seen);
        return <div key={d.id} className="dom-row"><span><i className="dotc" style={{ background: color(d.color) }} />{d.name} <span className="muted small">{d.weight}%</span></span><Bar value={a.seen ? v : 0} tone={a.seen ? (v >= e.mock.pass ? 'ok' : 'warn') : ''} /><b>{a.seen ? v + '%' : '–'}</b><Link className="small" href={`/${e.id}/practice/${d.id}/`}>Drill</Link></div>;
      })}</div>
    </div>
  );
}

/* ---------- notes ---------- */
function NoteEditor({ examId, c }) {
  const notes = store.exam(examId).notes;
  const [val, setVal] = useState(notes[c.id] || '');
  const [saved, setSaved] = useState('Saved locally');
  const t = useRef();
  return (
    <section className="card note-card">
      <div className="row-between"><h3>{c.num}. {c.title}</h3><Link className="btn sm ghost" href={`/${examId}/learn/${c.id}/`}>Open lesson</Link></div>
      <textarea className="note-ta" rows={6} value={val} onChange={(ev) => { setVal(ev.target.value); setSaved('Saving…'); clearTimeout(t.current); const v = ev.target.value; t.current = setTimeout(() => { notes[c.id] = v; store.save(); setSaved('Saved locally'); }, 400); }} />
      <span className="muted small">{saved}</span>
    </section>
  );
}
export function Notes({ e }) {
  const ready = useStore();
  if (!ready) return <div className="narrowish"><div className="card empty">Loading your notes…</div></div>;
  const notes = store.exam(e.id).notes;
  const withNotes = e.chapters.filter((c) => (notes[c.id] || '').trim());
  const exportMd = () => {
    const md = `# ${e.short} notes\n\n` + withNotes.map((c) => `## ${c.num}. ${c.title}\n\n${notes[c.id].trim()}\n`).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown' })); a.download = `${e.id}-notes.md`; a.click();
  };
  return (
    <div className="narrowish">
      <div className="row-between">
        <div><h2 className="sec-title" style={{ marginTop: 0 }}>My notes</h2><p className="muted">Notes you take in the lesson player are saved in this browser and collected here.</p></div>
        {withNotes.length > 0 && <button className="btn" onClick={exportMd}><Icon name="download" size={17} />Export as Markdown</button>}
      </div>
      {withNotes.length ? withNotes.map((c) => <NoteEditor key={c.id} examId={e.id} c={c} />) : (
        <div className="card empty">
          <div className="big"><Icon name="notebook-pen" size={44} /></div>
          <h3>No notes yet</h3><p className="muted">Open any lesson and press the Notes button in the player to start writing.</p>
          <Link className="btn primary" href={resumeTarget(e).href}>Go to my lesson</Link>
        </div>
      )}
    </div>
  );
}
