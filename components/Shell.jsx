'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import Icon from './Icon';
import { store, toggleTheme, useStore } from '@/lib/store';

export function Topbar({ compact }) {
  const ready = useStore();
  const path = usePathname() || '/';
  const streak = ready ? store.streak() : 0;
  const nav = path === '/' ? 'home' : /\/guide\/?$/.test(path) ? 'guide' : path.startsWith('/kcna') ? 'kcna' : '';
  return (
    <header className={'topbar' + (compact ? ' compact' : '')}>
      <Link className="brand" href="/" aria-label="Kubestronaut Academy home"><Logo /><span className="wordmark">Kubestronaut<b>Academy</b></span></Link>
      <nav className="topnav" aria-label="Main">
        <Link href="/" className={nav === 'home' ? 'on' : ''}>Home</Link>
        <Link href="/kcna/" className={nav === 'kcna' ? 'on' : ''}>KCNA course</Link>
        <Link href="/kcna/guide/" className={nav === 'guide' ? 'on' : ''}>Exam guide</Link>
      </nav>
      <div className="spacer" />
      <span className={'streak-pill' + (streak ? ' on' : '')} title={streak ? `${streak}-day streak` : 'Study today to start a streak'}><Icon name="flame" size={16} /><b>{streak}</b></span>
      <button className="icon-btn" title="Light / dark" aria-label="Toggle theme" onClick={toggleTheme}><Icon name="moon" /></button>
      <Link className="icon-btn" title="Progress & backup" aria-label="Progress and backup" href="/settings/"><Icon name="settings" /></Link>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="foot-brand"><Logo size={22} /> <b>Kubestronaut Academy</b><span className="muted">Personal prep for KCNA, KCSA, CKAD, CKA and CKS</span></div>
      <div className="muted">Progress, notes and streaks are saved in this browser. <Link href="/settings/">Backup / restore</Link></div>
    </footer>
  );
}

export default function Shell({ children, compact, noFooter }) {
  return (<><Topbar compact={compact} />{children}{!noFooter && <Footer />}</>);
}
