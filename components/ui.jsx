import Icon from './Icon';

export function Bar({ value = 0, tone = '' }) {
  return <div className={'pbar ' + tone}><span style={{ width: Math.max(0, Math.min(100, value)) + '%' }} /></div>;
}
export function StatusDot({ item }) {
  if (item.done) return <span className="sdot done" title="Completed"><Icon name="check" size={14} strokeWidth={3} /></span>;
  if (item.started) return <span className="sdot half" title="In progress" />;
  return <span className="sdot" title="Not started" />;
}
export function Ring({ value, color = 'var(--accent)', size = 132, children }) {
  const r = size / 2 - 10, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(1, value / 100)));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset .8s' }} />
      </svg>
      <div className="rv">{children}</div>
    </div>
  );
}
export function Html({ as: Tag = 'span', html, ...rest }) {
  return <Tag {...rest} dangerouslySetInnerHTML={{ __html: html || '' }} />;
}
