// Reproducible fictional events. Future quarter ends are synthetic simulations.
export const DELIVERY_STATUSES = ['Scheduled', 'In progress', 'Complete', 'Overdue'];
const day = 86400000;
const add = (date, days) => new Date(Date.parse(date + 'T00:00:00Z') + days * day).toISOString().slice(0, 10);
export function deliveryEvents(deliverable, project, snapshot, index) {
  const createdDate = [add(project.startDate, -28), add(snapshot, -45)].sort()[0];
  const complete = deliverable.completion === 100;
  const completionDate = complete
    ? [add(snapshot, -(7 + index % 35)), add(deliverable.dueDate, -(index % 12))].sort()[0]
    : add([deliverable.dueDate, snapshot].sort().at(-1), 21 + index % 40);
  const proposedStart = deliverable.completion === 0 ? add(snapshot, 1 + index % 14)
    : complete ? add(completionDate, -(28 + index % 20)) : add(snapshot, -(21 + Math.round(deliverable.completion * .6)));
  const startedDate = [createdDate, proposedStart].sort().at(-1);
  return { createdDate, startedDate, completionDate, historyProvenance: 'Synthetic event timeline; future completion dates are simulated.' };
}
export function deliveryStatusAt(record, cutoff, snapshot) {
  if (cutoff < record.createdDate) return null;
  if (cutoff === snapshot) return record.status;
  if (record.completionDate <= cutoff) return 'Complete';
  if (record.dueDate < cutoff) return 'Overdue';
  if (record.startedDate <= cutoff) return 'In progress';
  return 'Scheduled';
}
export function deliveryCompletionAt(record, cutoff, snapshot) {
  if (cutoff === snapshot) return record.completion;
  if (cutoff >= record.completionDate) return 100;
  if (cutoff <= record.startedDate) return 0;
  // Anchor the synthetic curve to the saved snapshot, so progress cannot jump
  // backwards when moving across the snapshot date.
  const anchored = record.startedDate < snapshot && snapshot < record.completionDate;
  const from = anchored && cutoff > snapshot ? snapshot : record.startedDate;
  const to = anchored && cutoff < snapshot ? snapshot : record.completionDate;
  const start = anchored && cutoff > snapshot ? record.completion : 0;
  const end = anchored && cutoff < snapshot ? record.completion : 100;
  const fraction = (Date.parse(cutoff) - Date.parse(from)) / (Date.parse(to) - Date.parse(from));
  return Math.min(99, Math.max(1, Math.round(start + fraction * (end - start))));
}
export function quarterCuts(records) {
  if (!records.length) return [];
  const first = new Date(records.map(r => r.createdDate).sort()[0] + 'T00:00:00Z');
  const last = records.map(r => r.completionDate).sort().at(-1);
  const cuts = [];
  let year = first.getUTCFullYear(), quarter = Math.floor(first.getUTCMonth() / 3);
  do {
    const date = new Date(Date.UTC(year, (quarter + 1) * 3, 0)).toISOString().slice(0, 10);
    cuts.push({ date, label: `Q${quarter + 1} ${year}` });
    quarter++;
    if (quarter === 4) { quarter = 0; year++; }
  } while (cuts.at(-1).date < last);
  return cuts;
}
export function deliveryRowsAt(records, cutoff, snapshot) {
  return records.flatMap(r => {
    const status = deliveryStatusAt(r, cutoff, snapshot);
    return status ? [{ ...r, status, completion: deliveryCompletionAt(r, cutoff, snapshot), cutoffDate: cutoff,
      historyMode: cutoff > snapshot ? 'Synthetic simulation' : cutoff === snapshot ? 'Current snapshot' : 'Synthetic history' }] : [];
  });
}
export function quarterlyDelivery(records, snapshot) {
  return quarterCuts(records).map(cut => {
    const counts = Object.fromEntries(DELIVERY_STATUSES.map(s => [s, 0]));
    for (const record of records) { const status = deliveryStatusAt(record, cut.date, snapshot); if (status) counts[status]++; }
    return { ...cut, simulated: cut.date > snapshot, counts, total: Object.values(counts).reduce((s, n) => s + n, 0) };
  });
}
