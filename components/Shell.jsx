'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Logo from './Logo';
import Icon from './Icon';
import { useNav } from './NavContext';
import { store, toggleTheme, useStore } from '@/lib/store';
import { OFFICIAL_LINKS, ORG } from '@/lib/site';

const ICONS = { kcna: 'ship-wheel', kcsa: 'shield', ckad: 'code', cka: 'wrench', cks: 'lock-keyhole' };

/* "Courses" menu: the full Kubestronaut path, shadcn-style popover. */
function CoursesMenu({ active }) {
  const { exams } = useNav();
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const outside = (e) => { if (!wrap.current.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', outside); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div className={'navmenu' + (open ? ' open' : '')} ref={wrap}>
      <button type="button" className={'navlink' + (active ? ' on' : '')} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)}>
        Courses <Icon name="chevron-down" size={15} className="nav-chev" />
      </button>
      <div className="navmenu-panel" role="menu">
        <div className="nm-head"><b>The Kubestronaut path</b><span className="muted small">Five certifications, one title</span></div>
        {exams.map((m, i) => {
          const inner = (
            <>
              <span className={'nm-ic c-' + (m.color || 'blue')}><Icon name={ICONS[m.id] || 'book-open'} size={18} /></span>
              <span className="nm-txt"><b>{i + 1}. {m.short}</b><span className="muted small">{m.title}</span></span>
              {m.available ? <span className="tag ok">Open</span> : <span className="tag">Soon</span>}
            </>
          );
          return m.available
            ? <Link key={m.id} role="menuitem" className="nm-item" href={`/${m.id}/`} onClick={() => setOpen(false)}>{inner}</Link>
            : <div key={m.id} className="nm-item disabled" aria-disabled="true">{inner}</div>;
        })}
      </div>
    </div>
  );
}

export function Topbar({ compact }) {
  const ready = useStore();
  const path = usePathname() || '/';
  const [mobile, setMobile] = useState(false);
  useEffect(() => setMobile(false), [path]);
  const streak = ready ? store.streak() : 0;
  const resume = ready && store.state.lastVisit ? store.state.lastVisit.href : '/kcna/';
  const is = (re) => re.test(path);
  const links = [
    { href: '/', label: 'Dashboard', on: path === '/' },
    { href: '/kcna/guide/', label: 'Exam guide', on: is(/\/guide\/?$/) },
    { href: '/kcna/mock/1/', label: 'Mock exams', on: is(/\/mock\//) },
    { href: '/kcna/cheatsheet/', label: 'Cheat sheet', on: is(/\/cheatsheet\/?$/) },
  ];
  return (
    <header className={'topbar' + (compact ? ' compact' : '')}>
      <div className="topbar-inner">
        <Link className="brand" href="/" aria-label="Kubestronaut Academy home"><Logo /><span className="wordmark">Kubestronaut<b>Academy</b></span></Link>
        <nav className="topnav" aria-label="Main">
          <Link href="/" className={'navlink' + (links[0].on ? ' on' : '')}>Dashboard</Link>
          <CoursesMenu active={is(/^\/k[a-z]+\/?$/) || is(/\/(learn|quiz|flashcards|grades|notes|resources)\//)} />
          {links.slice(1).map((l) => <Link key={l.href} href={l.href} className={'navlink' + (l.on ? ' on' : '')}>{l.label}</Link>)}
        </nav>
        <div className="spacer" />
        <span className={'streak-pill' + (streak ? ' on' : '')} title={streak ? `${streak}-day streak` : 'Study today to start a streak'}><Icon name="flame" size={16} /><b>{streak}</b></span>
        <button className="icon-btn" title="Light / dark" aria-label="Toggle theme" onClick={toggleTheme}><Icon name="moon" /></button>
        <Link className="icon-btn hide-sm" title="Progress & backup" aria-label="Progress and backup" href="/settings/"><Icon name="settings" /></Link>
        <Link className="btn primary sm cta hide-sm" href={resume}>Continue learning</Link>
        <button className="icon-btn show-md" aria-label="Open menu" aria-expanded={mobile} onClick={() => setMobile(!mobile)}><Icon name={mobile ? 'x' : 'menu'} /></button>
      </div>
      {mobile && (
        <nav className="mobile-nav" aria-label="Mobile">
          {links.map((l) => <Link key={l.href} href={l.href} className={l.on ? 'on' : ''}>{l.label}</Link>)}
          <Link href="/kcna/">KCNA course</Link>
          <Link href="/kcna/flashcards/">Flashcards</Link>
          <Link href="/settings/">Progress &amp; backup</Link>
          <Link className="btn primary" href={resume}>Continue learning</Link>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  const { exams } = useNav();
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="f-brand">
          <Link className="brand" href="/"><Logo size={28} /><span className="wordmark">Kubestronaut<b>Academy</b></span></Link>
          <p className="muted small">Free, interactive preparation for the Kubestronaut certifications: visual lessons, practice questions linked to official sources, and timed mock exams.</p>
          <a className="by-tronics" href={ORG.url} rel="noopener">A <b>{ORG.domain}</b> project <Icon name="external-link" size={13} /></a>
        </div>
        <nav className="f-col" aria-label="Learn">
          <h4>Learn</h4>
          <Link href="/kcna/">KCNA course</Link>
          <Link href="/kcna/guide/">KCNA exam guide</Link>
          <Link href="/kcna/quiz/architecture/">Practice questions</Link>
          <Link href="/kcna/mock/1/">Mock exams</Link>
          <Link href="/kcna/flashcards/">Flashcards</Link>
          <Link href="/kcna/cheatsheet/">Cheat sheet</Link>
        </nav>
        <nav className="f-col" aria-label="Kubestronaut path">
          <h4>Kubestronaut path</h4>
          {exams.map((m) => (m.available
            ? <Link key={m.id} href={`/${m.id}/`}>{m.short} <span className="muted">· {m.format}</span></Link>
            : <span key={m.id} className="muted">{m.short} <span className="tag">Soon</span></span>))}
        </nav>
        <nav className="f-col" aria-label="Official resources">
          <h4>Official resources</h4>
          {OFFICIAL_LINKS.map((l) => <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>)}
        </nav>
      </div>
      <div className="footer-bottom">
        <div className="footer-inner bottom-row">
          <span>© {year} <a href={ORG.url} rel="noopener">{ORG.domain}</a> · Kubestronaut Academy</span>
          <span className="muted">Not affiliated with the Linux Foundation or CNCF. Kubernetes is a registered trademark of The Linux Foundation.</span>
          <span className="f-links"><Link href="/settings/">Your data</Link><a href="/sitemap.xml">Sitemap</a></span>
        </div>
      </div>
    </footer>
  );
}

/** Page frame: header, content, footer pinned to the bottom on short pages. */
export default function Shell({ children, compact, noFooter }) {
  return (
    <div className="app-frame">
      <Topbar compact={compact} />
      <div className="app-content">{children}</div>
      {!noFooter && <Footer />}
    </div>
  );
}
