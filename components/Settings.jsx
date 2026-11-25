'use client';
import { useRef, useState } from 'react';
import Icon from './Icon';
import { store, useStore } from '@/lib/store';

export default function Settings() {
  const ready = useStore();
  const file = useRef(null);
  const [msg, setMsg] = useState('');
  const st = ready ? store.state : {};
  let size = 0; try { size = ready ? (localStorage.getItem('kubestronaut.v1') || '').length : 0; } catch (_) { /* ignore */ }
  const download = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([store.exportJSON()], { type: 'application/json' })); a.download = 'kubestronaut-progress.json'; a.click(); };
  const restore = (ev) => { const f = ev.target.files[0]; if (!f) return; f.text().then((t) => { try { store.importJSON(t); setMsg('Progress restored.'); } catch (_) { setMsg('Could not read that file.'); } }); };
  return (
    <main className="page narrow">
      <h1>Progress &amp; backup</h1>
      <p className="muted">Everything (lesson progress, quiz grades, mock attempts, notes, streaks and your weekly goal) is stored in this browser’s <b>local storage</b>. Nothing is sent anywhere. Download a backup to move it to another device or browser.</p>
      <div className="kv">
        <div><b>{Object.keys(st.activity || {}).length}</b><span>study days logged</span></div>
        <div><b>{ready ? store.streak() : 0}</b><span>current streak</span></div>
        <div><b>{(size / 1024).toFixed(1)} KB</b><span>stored locally</span></div>
      </div>
      <div className="row" style={{ margin: '18px 0' }}>
        <button className="btn primary" onClick={download} disabled={!ready}><Icon name="download" size={17} />Download backup</button>
        <button className="btn" onClick={() => file.current.click()}><Icon name="upload" size={17} />Restore from file</button>
        <input ref={file} type="file" accept="application/json" style={{ display: 'none' }} onChange={restore} />
        <button className="btn danger" onClick={() => { if (confirm('Erase ALL progress, notes and streaks in this browser?')) { store.reset(); setMsg('Progress reset.'); } }}>Reset everything</button>
      </div>
      {msg && <p className="tag ok">{msg}</p>}
      {ready && <details><summary>Raw data</summary><textarea className="note-ta mono" rows={10} readOnly value={store.exportJSON()} /></details>}
    </main>
  );
}
