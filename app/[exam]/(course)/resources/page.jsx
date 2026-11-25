import Link from 'next/link';
import Icon from '@/components/Icon';
import { getExam } from '@/lib/content';

export async function generateMetadata({ params }) {
  const { exam } = await params;
  return { title: `${exam.toUpperCase()} study resources`, description: `Flashcards, a printable cheat sheet, drills and official references for the ${exam.toUpperCase()} exam.`, alternates: { canonical: `/${exam}/resources/` } };
}

export default async function Page({ params }) {
  const { exam } = await params;
  const e = getExam(exam);
  const groups = {};
  (e.library || []).forEach((it) => { if (it.kind === 'route') return; (groups[it.group || 'Resources'] = groups[it.group || 'Resources'] || []).push(it); });
  const terms = e.chapterList.reduce((a, c) => a + (c.glossary || []).length, 0);
  return (
    <div>
      <div className="res-top">
        <Link className="card res-feature" href={`/${exam}/flashcards/`}><span className="rf-ic"><Icon name="layers" size={24} /></span><div><h3>All flashcards</h3><p className="muted small">{terms} key terms, with the ones you still don’t know coming back first.</p></div></Link>
        <Link className="card res-feature" href={`/${exam}/cheatsheet/`}><span className="rf-ic"><Icon name="notebook-pen" size={24} /></span><div><h3>Cheat sheet</h3><p className="muted small">Every lesson recap and key term on one printable page.</p></div></Link>
        <Link className="card res-feature" href={`/${exam}/drill/`}><span className="rf-ic"><Icon name="clipboard-list" size={24} /></span><div><h3>Weak-area drill</h3><p className="muted small">Questions you missed come back first.</p></div></Link>
      </div>
      {Object.entries(groups).map(([g, list]) => (
        <section key={g}>
          <h2 className="sec-title">{g}</h2>
          <div className="grid g3">
            {list.map((it) => {
              const local = it.kind === 'page';
              return (
                <a key={it.title} className="card res-card" href={local ? `/${exam}/${it.url}` : it.url} target="_blank" rel="noopener noreferrer">
                  <div className="res-ic"><Icon name={it.icon || 'link'} size={22} /></div>
                  <h3>{it.title}</h3>{it.note && <p className="muted small" dangerouslySetInnerHTML={{ __html: it.note }} />}
                  <span className="tag">{local ? 'Opens in a new tab' : 'External'} <Icon name="external-link" size={13} /></span>
                </a>
              );
            })}
          </div>
        </section>
      ))}
      <p className="muted small">Add your own Claude artifacts: save the HTML into <code>public/{exam}/library/</code> and list it in <code>exams/{exam}/exam.js</code>.</p>
    </div>
  );
}
