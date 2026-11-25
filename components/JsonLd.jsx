/** Renders one or more JSON-LD objects as structured data. */
export default function JsonLd({ data }) {
  const list = Array.isArray(data) ? data : [data];
  return list.map((d, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />);
}
