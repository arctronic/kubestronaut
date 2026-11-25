import Blocks from '@/components/Blocks';
import Icon from '@/components/Icon';
import JsonLd from '@/components/JsonLd';
import { getExam } from '@/lib/content';
import { breadcrumbLd } from '@/lib/site';

export async function generateMetadata({ params }) {
  const { exam } = await params;
  const e = getExam(exam);
  const title = `${e.short} exam guide: format, blueprint, tips and candidate experiences`;
  const description = `Everything about the ${e.short} exam: ${e.mock.questions} questions, ${e.mock.minutes} minutes, ${e.mock.pass}% to pass, official domain weights, what candidates report, common traps and an exam-day checklist.`;
  return { title, description, alternates: { canonical: `/${exam}/guide/` }, openGraph: { title, description, url: `/${exam}/guide/` } };
}

export default async function Page({ params }) {
  const { exam } = await params;
  const e = getExam(exam);
  const intel = e.intel || { sections: [] };
  const faq = e.faq || [];
  const faqLd = faq.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) } : null;
  return (
    <div className="narrowish guide">
      <JsonLd data={[breadcrumbLd([['Home', '/'], [`${e.short} course`, `/${exam}/`], [`${e.short} exam guide`, `/${exam}/guide/`]]), faqLd].filter(Boolean)} />
      {intel.intro && <p className="lead" dangerouslySetInnerHTML={{ __html: intel.intro }} />}
      {intel.sections.map((s, i) => (
        <section key={i} className="card guide-sec">
          <h2 className="with-ic">{s.icon && <Icon name={s.icon} size={22} />}<span dangerouslySetInnerHTML={{ __html: s.title }} /></h2>
          <Blocks blocks={s.blocks} />
        </section>
      ))}
      {faq.length > 0 && (
        <section className="card guide-sec" id="faq">
          <h2 className="with-ic"><Icon name="circle-help" size={22} /><span>{e.short} exam FAQ</span></h2>
          <div className="b-reveal">{faq.map((f) => <details key={f.q}><summary>{f.q}</summary><div>{f.a}</div></details>)}</div>
        </section>
      )}
    </div>
  );
}
