'use client';
/* shadcn-style select: trigger + popover listbox, keyboard and outside-click aware. */
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

export default function Dropdown({ value, options, onChange, label, align = 'start' }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null), btn = useRef(null), items = useRef([]);
  const cur = options.find((o) => o.value === value);
  useEffect(() => {
    if (!open) return;
    const sel = options.findIndex((o) => o.value === value);
    (items.current[sel] || items.current[0])?.focus();
    const outside = (e) => { if (!wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const onKey = (e) => {
    if (e.key === 'Escape') { setOpen(false); btn.current.focus(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return setOpen(true);
      const list = items.current, i = list.indexOf(document.activeElement), n = options.length;
      list[(i + (e.key === 'ArrowDown' ? 1 : n - 1)) % n]?.focus();
    }
  };
  return (
    <div className={'dd' + (open ? ' open' : '') + (align === 'end' ? ' end' : '')} ref={wrap} onKeyDown={onKey}>
      <button ref={btn} type="button" className="dd-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>{cur ? cur.label : ''}</span><Icon name="chevrons-up-down" size={15} className="dd-chev" />
      </button>
      <div className="dd-menu" role="listbox">
        {label && <div className="dd-label">{label}</div>}
        {options.map((o, i) => (
          <button key={o.value} ref={(el) => (items.current[i] = el)} type="button" role="option" aria-selected={o.value === value} className={'dd-item' + (o.value === value ? ' on' : '')}
            onClick={() => { setOpen(false); btn.current.focus(); onChange(o.value); }}>
            <span className="dd-check">{o.value === value && <Icon name="check" size={15} />}</span><span>{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
