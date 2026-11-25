import { getExam } from '@/lib/content';
import { color } from '@/lib/util';
import PrintButton from '@/components/PrintButton';

export async function generateMetadata({ params }) {
  const { exam } = await params;
  const e = getExam(exam);
  const title = `${e.short} cheat sheet: every key fact and term on one page`;
  return { title, description: `Printable ${e.short} cheat sheet: the recap of all ${e.chapterList.length} lessons and every key term, organised by exam domain.`, alternates: { canonical: `/${exam}/cheatsheet/` } };
}

export default async function Page({ params }) {
  const { exam } = await params;
  const e = getExam(exam);
  return (
    <div>
      <div className="row-between no-print"><h2 style={{ margin: 0 }}>{e.short} cheat sheet</h2><PrintButton /></div>
      <p className="muted">Every lesson recap and key term on one page. Generated from the lessons, so it is always in sync.</p>
      {e.domains.map((d) => (
        <section key={d.id}>
          <h2 className="sec-title"><i className="dotc" style={{ background: color(d.color) }} />{d.name} <span className="muted small">{d.weight}%</span></h2>
          <div className="grid g2">
            {e.chapterList.filter((c) => c.domain === d.id).map((c) => (
              <article key={c.id} className="card">
                <h3>{c.num}. {c.title}</h3>
                <ul className="small cs-list">{(c.summary || []).map((x, i) => <li key={i} dangerouslySetInnerHTML={{ __html: x }} />)}</ul>
                {(c.glossary || []).length > 0 && (
                  <details><summary className="small">{c.glossary.length} key terms</summary>
                    <dl className="small">{c.glossary.map((g) => [<dt key={g.term + 't'} dangerouslySetInnerHTML={{ __html: g.term }} />, <dd key={g.term + 'd'} dangerouslySetInnerHTML={{ __html: g.def }} />])}</dl>
                  </details>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
