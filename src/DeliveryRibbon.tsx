import { useId } from 'react';
import { quarterlyDelivery, DELIVERY_STATUSES } from './delivery-history.mjs';
import { ChartTools } from './charts';
const colors: Record<string, string> = { Scheduled: '#9baba3', 'In progress': '#d8b65a', Complete: '#267567', Overdue: '#b54c58' };
type Delivery = { createdDate: string; startedDate: string; completionDate: string; dueDate: string; completion: number; status: string; [key: string]: unknown };
export function DeliveryRibbon({ records, snapshot, selectedDate, selectedStatus, onSelect }: {
  records: Delivery[]; snapshot: string; selectedDate: string; selectedStatus: string;
  onSelect: (date: string, status: string) => void;
}) {
  const id = `delivery-ribbon-${useId().replaceAll(':', '')}`;
  const cuts = quarterlyDelivery(records, snapshot);
  const width = Math.max(760, cuts.length * 78 + 95), left = 58, right = width - 35, top = 20, base = 175;
  const max = Math.max(1, ...cuts.map(c => c.total));
  const x = (i: number) => cuts.length <= 1 ? (left + right) / 2 : left + i * (right - left) / (cuts.length - 1);
  const y = (value: number) => base - value / max * (base - top);
  const levels = cuts.map(c => { let total = 0; return DELIVERY_STATUSES.map(status => { const bottom = total; total += c.counts[status]; return { bottom, top: total }; }); });
  const defaultCut = cuts.filter(c => c.date <= snapshot).at(-1)?.date || cuts[0]?.date || '';
  return <section className="panel chart-panel delivery-ribbon-panel">
    <div className="panel-heading"><div><h2>Quarterly deliverable evolution</h2><p>Select a quarter for all its deliverables, or a ribbon for that quarter and status.</p></div><ChartTools id={id} title="Quarterly deliverable evolution" /></div>
    <div className="ribbon-legend" aria-label="Deliverable ribbon legend">{DELIVERY_STATUSES.map(status => <button key={status} aria-pressed={selectedStatus === status} onClick={() => onSelect(selectedDate || defaultCut, status)}><i style={{ background: colors[status] }} />{status === 'In progress' ? 'In Progress' : status}</button>)}</div>
    <div className="ribbon-scroll"><svg id={id} viewBox={`0 0 ${width} 260`} role="img" aria-label="Quarterly deliverable evolution" style={{ minWidth: width }}>
      {[0, .25, .5, .75, 1].map(f => <g key={f}><line x1={left} x2={right} y1={y(max * f)} y2={y(max * f)} stroke="#dce5df" /><text x={left - 10} y={y(max * f) + 4} textAnchor="end" fontSize="11" fill="#536a61">{Math.round(max * f)}</text></g>)}
      {DELIVERY_STATUSES.map((status, si) => {
        if (!cuts.length) return null;
        const points = [...cuts.map((_, i) => `${x(i)},${y(levels[i][si].top)}`), ...cuts.map((_, i) => `${x(i)},${y(levels[i][si].bottom)}`).reverse()];
        const choose = (event: React.MouseEvent<SVGPolygonElement>) => {
          const box = event.currentTarget.ownerSVGElement!.getBoundingClientRect();
          const local = (event.clientX - box.left) / box.width * width;
          const index = cuts.length <= 1 ? 0 : Math.max(0, Math.min(cuts.length - 1, Math.round((local - left) / (right - left) * (cuts.length - 1))));
          onSelect(cuts[index].date, status);
        };
        return <polygon key={status} points={points.join(' ')} fill={colors[status]} fillOpacity={selectedStatus === 'All' || selectedStatus === status ? .88 : .35} stroke="#fffdf8" strokeWidth="1" role="button" tabIndex={0} aria-label={`Filter ribbon ${status}`} onClick={choose} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(selectedDate || defaultCut, status); } }}><title>{status}: select a point along the ribbon to filter at its quarter end.</title></polygon>;
      })}
      {/* Guide lines are decoration, outside the quarter buttons. Otherwise a
          button's bounding box spans the ribbons and its center hits a ribbon. */}
      <g aria-hidden="true" pointerEvents="none">{cuts.map((cut, i) => <line key={cut.date} x1={x(i)} x2={x(i)} y1={top} y2={base} stroke={selectedDate === cut.date ? '#173d36' : '#fff'} strokeDasharray="3 5" opacity={selectedDate === cut.date ? 1 : .4} />)}</g>
      {cuts.map((cut, i) => <g key={cut.date} className="quarter-cut" role="button" tabIndex={0} aria-pressed={selectedDate === cut.date && selectedStatus === 'All'} aria-label={`Filter all deliverables at ${cut.label} (${cut.date})${cut.simulated ? ' — synthetic simulation' : ''}`} onClick={() => onSelect(cut.date, 'All')} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(cut.date, 'All'); } }}>
        <rect x={x(i) - 35} y="187" width="70" height="44" rx="5" pointerEvents="all" fill={selectedDate === cut.date ? '#e2ecd8' : 'transparent'} />
        <text x={x(i)} y="205" textAnchor="middle" fontSize="11" fill="#31544c">{cut.label}</text><text x={x(i)} y="221" textAnchor="middle" fontSize="9" fill="#647468">{cut.date.slice(5)}{cut.simulated ? ' *' : ''}</text>
        <title>{cut.total} deliverables · {DELIVERY_STATUSES.map(s => `${s}: ${cut.counts[s]}`).join(' · ')}</title>
      </g>)}
      {!cuts.length && <text x={width / 2} y="105" textAnchor="middle" fill="#647468">No deliverables in this scope.</text>}
      <text x={width / 2} y="249" textAnchor="middle" fontSize="11" fill="#536a61">Quarter-end cuts · * Synthetic simulation after the {snapshot} snapshot</text>
    </svg></div>
  </section>;
}
