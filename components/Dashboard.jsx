'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon, { hasIcon } from './Icon';
import CourseArt from './CourseArt';
import Dropdown from './Dropdown';
import { Bar, Html } from './ui';
import { store, useStore } from '@/lib/store';
import { courseProgress, domainAccuracy, domainOfQuestion, nextItem, resumeTarget } from '@/lib/progress';
import { ago, pct } from '@/lib/util';

export default function Dashboard({ metas, exams }) {
  const ready = useStore();
  const [now, setNow] = useState(null);
  useEffect(() => setNow(new Date()), []);
  const st = ready ? store.state : {};
  const streak = ready ? store.streak() : 0;
  const week = ready ? store.week() : 'MTWTFSS'.split('').map((l, i) => ({ key: i, label: l }));
  const activeDays = week.filter((d) => d.active).length;
  const weekMin = week.reduce((a, d) => a + ((d.data && d.data.min) || 0), 0);
  const totals = Object.values(st.activity || {}).reduce((a, d) => ({ answered: a.answered + (d.answered || 0), correct: a.correct + (d.correct || 0), min: a.min + (d.min || 0) }), { answered: 0, correct: 0, min: 0 });
  const hour = now ? now.getHours() : 12;
  const greet = hour < 5 ? 'Burning the midnight oil' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const goal = ready ? store.goal : 4;

  return (
    <main className="page">
      <section className="dash-hero">
        <div>
          <div className="eyebrow">{now ? now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Kubestronaut Academy'}</div>
          <h1>{now ? greet + ', future Kubestronaut' : 'Become a Kubestronaut'}</h1>
          <p className="lead">{streak ? <>You’re on a <b>{streak}-day streak</b>. Keep it alive with one lesson or a quick quiz today.</> : 'Pick up where you left off. One lesson or a short quiz a day adds up fast.'}</p>
        </div>
        <div className="hero-orbit" aria-hidden="true"><span /><span /><span /></div>
      </section>

      <div className="dash-grid">
        <div className="dash-main">
          <h2 className="sec-title">Continue learning</h2>
          {exams.map((e) => {
            const cp = ready ? courseProgress(e) : { pct: 0, done: 0 };
            const rt = ready ? resumeTarget(e) : { href: `/${e.id}/learn/${e.chapters[0].id}/` };
            const nx = ready ? nextItem(e) : { title: e.chapters[0].title, type: 'Lesson' };
            const active = ready && store.exam(e.id).activeMock;
            return (
              <article key={e.id} className="continue-card">
                <Link className="cc-art" href={`/${e.id}/`} aria-label={e.title}><CourseArt exam={e} w={280} h={220} fs={48} /></Link>
                <div className="cc-body">
                  <div className="eyebrow">Course 1 of 5 · Kubestronaut path</div>
                  <h3><Link href={`/${e.id}/`}>{e.title}</Link></h3>
                  <div className="cc-next"><span className="muted">{cp.done ? 'Up next' : 'Start with'}:</span> <b>{nx.title}</b> <span className="muted">· {nx.type}</span></div>
                  <div className="cc-prog"><Bar value={cp.pct} /><span>{cp.pct}% complete</span></div>
                  <div className="row">
                    <Link className="btn primary" href={rt.href}>{cp.done || (ready && st.lastVisit) ? 'Resume' : 'Start learning'}</Link>
                    <Link className="btn ghost" href={`/${e.id}/`}>Course home</Link>
                    {active && <Link className="btn warn" href={`/${e.id}/mock/${active.key}/`}><Icon name="timer" size={17} />Mock exam in progress</Link>}
                  </div>
                </div>
              </article>
            );
          })}

          <h2 className="sec-title">Your Kubestronaut path</h2>
          <p className="muted sec-sub">Hold all five certifications at the same time to earn the Kubestronaut title.</p>
          <ol className="path">
            {metas.map((m, i) => {
              const e = exams.find((x) => x.id === m.id);
              const cp = e && ready ? courseProgress(e) : { pct: 0 };
              const Card = m.available ? Link : 'div';
              return (
                <li key={m.id} className={'path-step' + (m.available ? ' avail' : '') + (cp.pct === 100 ? ' done' : '')}>
                  <div className="ps-node">{cp.pct === 100 ? <Icon name="check" size={18} strokeWidth={3} /> : i + 1}</div>
                  <Card className="ps-card" {...(m.available ? { href: `/${m.id}/` } : {})}>
                    <div className="ps-thumb"><CourseArt exam={m} k="p" w={184} h={104} fs={30} tag=" " /></div>
                    <div className="ps-info">
                      <b>{m.short}</b><span className="muted small">{m.title}</span>
                      {m.available ? <div className="ps-prog"><Bar value={cp.pct} /><span className="small">{cp.pct}%</span></div> : <span className="tag"><Icon name="lock" size={13} /> Coming soon</span>}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ol>

          <h2 className="sec-title">Recent activity</h2>
          <section className="card">
            {ready && (st.events || []).length ? (
              <ul className="feed">
                {st.events.slice(0, 8).map((ev, i) => (
                  <li key={i}><span className="feed-ic"><Icon name={hasIcon(ev.icon) ? ev.icon : 'circle-dot'} size={17} /></span><Html className="feed-tx" html={ev.text} /><span className="muted small">{ago(ev.t)}</span></li>
                ))}
              </ul>
            ) : <p className="muted" style={{ margin: 0 }}>Your completed lessons, quiz scores and mock results will show up here.</p>}
          </section>
        </div>

        <aside className="dash-side">
          <section className="card side-card">
            <div className="card-head"><h3>Weekly goal</h3>
              <Dropdown value={goal} align="end" label="Study days per week" onChange={(v) => (store.goal = v)}
                options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: n, label: n + (n === 1 ? ' day' : ' days') + ' / week' }))} />
            </div>
            <div className="week">
              {week.map((d) => (
                <div key={d.key} className={'wday' + (d.active ? ' on' : '') + (d.today ? ' today' : '') + (d.future ? ' future' : '')}>
                  <span className="wcircle">{d.active && <Icon name="check" size={16} strokeWidth={3} />}</span><span className="wlbl">{d.label}</span>
                </div>
              ))}
            </div>
            <p className="goal-txt">{activeDays >= goal ? <><Icon name="party-popper" size={16} /> Goal reached: <b>{activeDays}</b> study days this week.</> : <><b>{activeDays}</b> of <b>{goal}</b> study days this week. {streak ? `${streak}-day streak.` : 'Study today to start a streak.'}</>}</p>
          </section>

          <section className="card side-card">
            <h3>Your learning</h3>
            <div className="stat-grid">
              <div><b>{weekMin}m</b><span>studied this week</span></div>
              <div><b>{Math.round(totals.min / 6) / 10}h</b><span>studied in total</span></div>
              <div><b>{totals.answered}</b><span>questions answered</span></div>
              <div><b>{totals.answered ? pct(totals.correct, totals.answered) + '%' : '–'}</b><span>answer accuracy</span></div>
            </div>
          </section>

          {exams.map((e) => {
            const acc = ready ? domainAccuracy(e, domainOfQuestion(e)) : {};
            return (
              <section key={e.id} className="card side-card">
                <div className="card-head"><h3>{e.short} readiness</h3><Link className="small link-arrow" href={`/${e.id}/grades/`}>Grades <Icon name="arrow-right" size={15} /></Link></div>
                {e.domains.map((d) => {
                  const a = acc[d.id] || { seen: 0, correct: 0 }, p = pct(a.correct, a.seen);
                  return <div key={d.id} className="ready-row"><div className="row-between small"><span>{d.name}</span><b>{a.seen ? p + '%' : '–'}</b></div><Bar value={a.seen ? p : 0} tone={a.seen ? (p >= e.mock.pass ? 'ok' : 'warn') : ''} /></div>;
                })}
                <p className="muted small">Accuracy per exam domain across every question you have answered. Aim for 85%+ in each.</p>
              </section>
            );
          })}
        </aside>
      </div>
    </main>
  );
}
