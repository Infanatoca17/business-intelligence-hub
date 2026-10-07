export const OPTIONAL_WORKSPACES_ENABLED = false;
export const NAVIGATION_VIEWS = ['Overview', 'Projects', 'Deliverables', 'Staff', 'Financials', 'Funding Pipeline', 'Risks', 'Issues'];
export const OPTIONAL_VIEWS = ['Data Quality', 'Executive Brief', 'Methodology'];
export const DELIVERY_BANDS = ['Behind schedule', 'On track', 'Ahead of plan', 'Planned'];
export const DELIVERY_BAND_COLORS = ['#b54c58', '#267567', '#4279b0', '#9baba3'];
export function deliveryBudgetSeries(projects, programs) {
  return programs.map(program => ({ label: program.name,
    segments: DELIVERY_BANDS.map((label, i) => ({ label, color: DELIVERY_BAND_COLORS[i],
      value: projects.filter(p => p.program === program.name && (p.status === 'Planned' ? 'Planned' : p.schedule) === label).reduce((sum, p) => sum + p.budget, 0) })) }));
}
