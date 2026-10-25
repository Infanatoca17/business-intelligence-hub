import { useEffect, useId, useRef, useState } from 'react';

type Option = { value: string; label: string };
export const matchesFilter = (value: string, selected: string[]) => !selected.length || selected.includes(value);
export function readFilter(query: URLSearchParams, key: string, allowed: string[], normalize = (v: string) => v) {
  return [...new Set(query.getAll(key).map(normalize).filter(v => allowed.includes(v)))];
}
export function useMultiFilter(initial: string[]) {
  const [value, setValue] = useState(initial);
  // Chart clicks select one value; dropdowns supply a complete selection.
  const update = (next: string | string[]) => setValue(Array.isArray(next) ? next : !next || /^All(?:\s|$)/.test(next) ? [] : [next]);
  return [value, update] as const;
}
export function MultiFilter({ label, value, options, allLabel, onChange }: {
  label: string; value: string[]; options: Option[]; allLabel: string; onChange: (value: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    root.current?.querySelector<HTMLButtonElement>('[role="option"][aria-selected="true"]')?.focus();
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const close = () => { setOpen(false); trigger.current?.focus(); };
  const summary = !value.length ? allLabel : value.length === 1 ? options.find(o => o.value === value[0])?.label : `${value.length} selected`;
  return <div ref={root} className={`filter multi-filter ${value.length ? 'filter-active' : ''}`} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false); }} onKeyDown={e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
  }}>
    <span id={`${id}-label`}>{label}</span>
    <button ref={trigger} type="button" role="combobox" aria-label={label} aria-expanded={open} aria-controls={`${id}-options`} aria-haspopup="listbox" className="filter-trigger" onClick={() => setOpen(!open)} onKeyDown={e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); }
    }}><span>{summary}</span>{value.length > 0 && <i className="filter-dot" aria-label="Filter active" />}<span aria-hidden="true" className="filter-chevron">⌄</span></button>
    {open && <div className="filter-popover"><div className="filter-options" id={`${id}-options`} role="listbox" aria-labelledby={`${id}-label`} aria-multiselectable="true" onKeyDown={e => {
      const nodes = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]')];
      const index = nodes.indexOf(document.activeElement as HTMLButtonElement);
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
        e.preventDefault(); nodes[e.key === 'Home' ? 0 : e.key === 'End' ? nodes.length - 1 : (index + (e.key === 'ArrowDown' ? 1 : -1) + nodes.length) % nodes.length]?.focus();
      }
    }}>
      <button type="button" role="option" aria-selected={!value.length} onClick={() => onChange([])}><span className="option-check" aria-hidden="true">{!value.length ? '✓' : ''}</span>{allLabel}</button>
      {options.map(o => <button key={o.value} type="button" role="option" aria-selected={value.includes(o.value)} onClick={() => onChange(value.includes(o.value) ? value.filter(v => v !== o.value) : [...value, o.value])}><span className="option-check" aria-hidden="true">{value.includes(o.value) ? '✓' : ''}</span>{o.label}</button>)}
    </div><button type="button" className="filter-done" onClick={close}>Done</button></div>}
  </div>;
}
