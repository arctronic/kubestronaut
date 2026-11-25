import Blocks from '@/components/Blocks';
import Icon from '@/components/Icon';
import { getExam } from '@/lib/content';

export async function generateMetadata({ params }) {
  const { exam } = await params;
  const e = getExam(exam);
  const title = `${e.short} exam guide: format, blueprint, tips and candidate experiences`;
  const description = `Everything about the ${e.short} exam: ${e.mock.questions} questions, ${e.mock.minutes} minutes, ${e.mock.pass}% to pass, official domain weights, what candidates report, common traps and an exam-day checklist.`;
  return { title, description, alternates: { canonical: `/${exam}/guide/` }, openGraph: { title, description, url: `/${exam}/guide/` } };
}

export default async function Page({ params }) {
  const { exam } = await params;
  const intel = getExam(exam).intel || { sections: [] };
  return (
    <div className="narrowish guide">
      {intel.intro && <p className="lead" dangerouslySetInnerHTML={{ __html: intel.intro }} />}
      {intel.sections.map((s, i) => (
        <section key={i} className="card guide-sec">
          <h2 className="with-ic">{s.icon && <Icon name={s.icon} size={22} />}<span dangerouslySetInnerHTML={{ __html: s.title }} /></h2>
          <Blocks blocks={s.blocks} />
        </section>
      ))}
    </div>
  );
}
