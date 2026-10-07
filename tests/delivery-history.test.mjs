import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deliveryStatusAt, deliveryCompletionAt, deliveryRowsAt, quarterCuts, quarterlyDelivery } from '../src/delivery-history.mjs';
import { deliveryBudgetSeries } from '../src/portfolio-ui.mjs';
const data = JSON.parse(readFileSync(new URL('../src/data/atlas-bundle.json', import.meta.url)));
test('Fictional event chronology is valid and the current snapshot reproduces all original statuses and completions', () => {
  for (const record of data.deliverables) {
    assert.ok(record.createdDate <= record.startedDate, record.id);
    assert.ok(record.startedDate < record.completionDate, record.id);
    assert.ok(record.createdDate <= data.meta.asOf, record.id);
    assert.ok(deliveryCompletionAt(record, '2026-09-21', data.meta.asOf) <= record.completion, record.id);
    assert.ok(deliveryCompletionAt(record, '2026-09-23', data.meta.asOf) >= record.completion, record.id);
  }
  const rows = deliveryRowsAt(data.deliverables, data.meta.asOf, data.meta.asOf);
  assert.equal(rows.length, 288);
  assert.equal(rows.filter(r => r.status === 'Complete').length, 139);
  assert.equal(rows.filter(r => r.status === 'Overdue').length, 20);
  assert.deepEqual(rows.map(r => [r.id,r.status,r.completion]),data.deliverables.map(r => [r.id,r.status,r.completion]));
});
test('Quarter ends are UTC calendar cuts, exactly four per complete year, spanning first creation and final completion', () => {
  const cuts = quarterCuts(data.deliverables);
  for (const cut of cuts) assert.match(cut.date, /^\d{4}-(03-31|06-30|09-30|12-31)$/);
  for (const year of [...new Set(cuts.map(c => c.date.slice(0,4)))].slice(1,-1)) assert.equal(cuts.filter(c => c.date.startsWith(year)).length,4);
  assert.ok(cuts[0].date >= data.deliverables.map(d => d.createdDate).sort()[0]);
  assert.ok(cuts.at(-1).date >= data.deliverables.map(d => d.completionDate).sort().at(-1));
});
test('A hand-defined deliverable moves through scheduled, in progress, overdue and completed states at the right boundaries', () => {
  const r = { createdDate: '2025-01-01', startedDate: '2025-04-01', dueDate: '2025-06-30', completionDate: '2025-08-01' };
  assert.equal(deliveryStatusAt(r,'2024-12-31','2026-09-22'),null);
  assert.equal(deliveryStatusAt(r,'2025-03-31','2026-09-22'),'Scheduled');
  assert.equal(deliveryStatusAt(r,'2025-06-30','2026-09-22'),'In progress');
  assert.equal(deliveryStatusAt(r,'2025-07-01','2026-09-22'),'Overdue');
  assert.equal(deliveryStatusAt(r,'2025-09-30','2026-09-22'),'Complete');
});
test('Every ribbon cut reconciles with table and export rows, with explicit simulations and no double counting', () => {
  for (const program of [null,...data.programs.map(p=>p.name)]) {
    const records = data.deliverables.filter(d=>!program || d.program===program);
    for (const cut of quarterlyDelivery(records,data.meta.asOf)) {
      const rows = deliveryRowsAt(records,cut.date,data.meta.asOf);
      assert.equal(cut.total,rows.length);
      assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
      for (const [status,count] of Object.entries(cut.counts)) assert.equal(count,rows.filter(r=>r.status===status).length);
      assert.ok(rows.every(r=>r.cutoffDate===cut.date && Number.isFinite(r.completion)));
      assert.ok(rows.every(r=>r.historyMode===(cut.simulated?'Synthetic simulation':'Synthetic history')));
    }
  }
});
test('Budget chart segments reconcile with every program budget and correctly separate planned projects', () => {
  const series=deliveryBudgetSeries(data.projects,data.programs);
  assert.equal(series.reduce((s,p)=>s+p.segments.reduce((n,r)=>n+r.value,0),0),36370000);
  for (const entry of series) assert.equal(entry.segments.reduce((n,r)=>n+r.value,0),data.projects.filter(p=>p.program===entry.label).reduce((n,p)=>n+p.budget,0));
  assert.equal(series.reduce((n,p)=>n+p.segments.find(s=>s.label==='Planned').value,0),data.projects.filter(p=>p.status==='Planned').reduce((n,p)=>n+p.budget,0));
});
test('Empty delivery and budget scopes have explicit empty results', () => {
  assert.deepEqual(quarterCuts([]),[]); assert.deepEqual(quarterlyDelivery([],data.meta.asOf),[]); assert.deepEqual(deliveryRowsAt([],'2026-06-30',data.meta.asOf),[]);
  assert.ok(deliveryBudgetSeries([],data.programs).every(p=>p.segments.every(s=>s.value===0)));
});
