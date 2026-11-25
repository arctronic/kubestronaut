/* Shared Open Graph card (1200x630), rendered at build time by next/og. */
import { ImageResponse } from 'next/og';
import { ORG, SITE_NAME } from './site';

export const OG_SIZE = { width: 1200, height: 630 };

const heptagon = Array.from({ length: 7 }, (_, i) => { const a = (-90 + (i * 360) / 7) * (Math.PI / 180); return `${(50 + 30 * Math.cos(a)).toFixed(1)},${(52 + 30 * Math.sin(a)).toFixed(1)}`; }).join(' ');

export function ogImage({ eyebrow, title, subtitle }) {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', color: 'white', background: 'linear-gradient(125deg, #0a2a6b 0%, #0056d2 58%, #5b4ee0 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <svg width="64" height="64" viewBox="0 0 100 100">
            <rect width="100" height="100" rx="24" fill="#ffffff" fillOpacity="0.16" />
            <polygon points={heptagon} fill="none" stroke="#ffffff" strokeWidth="6" strokeLinejoin="round" />
            <ellipse cx="50" cy="52" rx="42" ry="14" transform="rotate(-24 50 52)" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="4" />
            <circle cx="50" cy="52" r="6" fill="#ffffff" />
          </svg>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700 }}>{SITE_NAME}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {eyebrow && <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: '#bcd3ff' }}>{eyebrow}</div>}
          <div style={{ display: 'flex', fontSize: title.length > 42 ? 58 : 70, fontWeight: 800, lineHeight: 1.08, maxWidth: 1000 }}>{title}</div>
          {subtitle && <div style={{ display: 'flex', fontSize: 30, color: '#dbe6ff', maxWidth: 980, lineHeight: 1.3 }}>{subtitle}</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, color: '#dbe6ff' }}>
          <div style={{ display: 'flex' }}>Free · Interactive · Sources for every answer</div>
          <div style={{ display: 'flex', fontWeight: 700, color: '#ffffff' }}>{ORG.domain}</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
