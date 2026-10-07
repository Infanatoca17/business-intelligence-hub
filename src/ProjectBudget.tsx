import { useId } from 'react';
import { ChartTools, money } from './charts';
import { deliveryBudgetSeries, DELIVERY_BANDS, DELIVERY_BAND_COLORS } from './portfolio-ui.mjs';
import type { Project } from './charts';
export function ProjectBudget({ projects, programs, onSelect }: { projects: Project[]; programs: { name: string }[]; onSelect: (program: string, band: string) => void }) {
  const id = `delivery-budget-${useId().replaceAll(':', '')}`;
  const series = deliveryBudgetSeries(projects, programs) as { label: string; segments: { label: string; color: string; value: number }[] }[];
  const max = Math.max(1, ...series.map(s => s.segments.reduce((n, r) => n + r.value, 0)));
  const base = 250, plot = 182, barWidth = 62;
  return <section className="panel chart-panel"><div className="panel-heading"><div><h2>Budget by delivery status</h2><p>Approved budgets by program · select a segment to focus delivery attention</p></div><ChartTools id={id} title="Budget by delivery status" /></div>
    <svg id={id} viewBox="0 0 590 340" role="img" aria-label="Budget by delivery status">
      {[0, .25, .5, .75, 1].map(f => <g key={f}><line x1="62" x2="560" y1={base - plot * f} y2={base - plot * f} stroke="#dce5df" /><text x="53" y={base - plot * f + 4} textAnchor="end" fontSize="11" fill="#536a61">{money(max * f)}</text></g>)}
      {series.map((s, i) => { let running = 0; const x = 96 + i * 124;
        return <g key={s.label}>{s.segments.map(segment => { const y = base - (running + segment.value) / max * plot, h = segment.value / max * plot; running += segment.value;
          return <rect key={segment.label} x={x} y={y} width={barWidth} height={h} fill={segment.color} role={segment.value ? 'button' : undefined} tabIndex={segment.value ? 0 : undefined} aria-label={segment.value ? `Filter ${s.label} ${segment.label}` : undefined} onClick={() => segment.value && onSelect(s.label, segment.label)} onKeyDown={e => { if (segment.value && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect(s.label, segment.label); } }}><title>{s.label} · {segment.label}: {money(segment.value)} approved budget (USD)</title></rect>;
        })}<text x={x + barWidth / 2} y={base - running / max * plot - 8} textAnchor="middle" fontSize="11" fill="#31544c">{money(running)}</text><text x={x + barWidth / 2} y="274" textAnchor="middle" fontSize="11" fill="#536a61">{s.label}</text></g>;
      })}
      {DELIVERY_BANDS.map((label, i) => <g key={label}><rect x={38 + i * 140} y="310" width="8" height="8" rx="2" fill={DELIVERY_BAND_COLORS[i]} /><text x={51 + i * 140} y="318" fontSize="10" fill="#536a61">{label}</text></g>)}
    </svg><div className="chart-caption">Budget allocation by schedule status; these amounts are not estimated financial losses.</div></section>;
}
