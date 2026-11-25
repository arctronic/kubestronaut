/* Generated course artwork: gradient + hexagon lattice + orbit. Pure SVG, renders on the server. */
const PAL = { blue: ['#0b3d91', '#2f7bff', '#8ab4ff'], teal: ['#05525c', '#14a3b3', '#7fe3ec'], green: ['#0b4d2c', '#1f9d5b', '#86e0ad'], amber: ['#6b3a00', '#e08a00', '#ffd27a'], red: ['#6e1414', '#d64343', '#ffadad'] };

export default function CourseArt({ exam, w = 400, h = 225, tag = 'Kubestronaut path', title, fs = 54, k = '' }) {
  const pal = PAL[exam.color] || ['#222a44', '#4f5f99', '#a9b4e8'];
  const id = 'g' + exam.id + k;
  const hex = [];
  for (let r = 0; r <= Math.ceil(h / 45) + 1; r++) for (let c = 0; c <= Math.ceil(w / 52) + 1; c++) {
    const x = c * 52 + (r % 2 ? 26 : 0), y = r * 45;
    hex.push(`M${x} ${y - 26}l22.5 13v26L${x} ${y + 26}l-22.5-13v-26z`);
  }
  const sc = Math.min(1, w / 400, h / 200), cx = w - 100 * sc, cy = Math.min(80, h * 0.38);
  return (
    <svg className="art" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMinYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={pal[0]} /><stop offset="1" stopColor={pal[1]} /></linearGradient>
        <radialGradient id={id + 'r'} cx={(cx / w).toFixed(2)} cy=".3" r=".6"><stop offset="0" stopColor={pal[2]} stopOpacity=".55" /><stop offset="1" stopColor={pal[2]} stopOpacity="0" /></radialGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#${id})`} /><rect width={w} height={h} fill={`url(#${id}r)`} />
      <path d={hex.join('')} fill="none" stroke="#fff" strokeOpacity=".09" strokeWidth="1.2" />
      <g transform={`translate(${cx - 300 * sc} ${cy - 80 * sc}) scale(${sc})`}>
        <ellipse cx="300" cy="80" rx="120" ry="34" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1.4" transform="rotate(-18 300 80)" />
        <circle cx="300" cy="80" r="30" fill="#fff" fillOpacity=".14" />
        <polygon points="300,60 315.6,67.5 319.5,84.4 308.7,97.9 291.3,97.9 280.5,84.4 284.4,67.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinejoin="round" strokeOpacity=".95" />
        <circle cx="300" cy="80" r="4" fill="#fff" />
        <circle cx="407" cy="44" r="5" fill="#fff" transform="rotate(-18 300 80)" opacity=".9" />
      </g>
      {title !== '' && <text x="26" y={h - 39} fill="#fff" fontFamily="Source Sans 3, system-ui, sans-serif" fontWeight="800" fontSize={fs} letterSpacing="1">{title != null ? title : exam.short}</text>}
      <text x="28" y={h - 17} fill="#fff" fillOpacity=".8" fontFamily="Source Sans 3, system-ui, sans-serif" fontWeight="600" fontSize="13" letterSpacing="2.5">{String(tag).toUpperCase()}</text>
    </svg>
  );
}
