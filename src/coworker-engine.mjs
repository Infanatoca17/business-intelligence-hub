import { portfolioMetrics, projectProgress, projectExposure, progressExpected, scheduleStatus, mean, round } from './metrics.mjs';

export const DEFAULT_SCENARIO = { fundingCut: 0, capacityCut: 0, probabilityUplift: 0 };
export const COWORKER_VIEWS = ['Coworker', 'Data Quality', 'Risk Scenarios', 'Executive Brief', 'Methodology'];
const clone = value => JSON.parse(JSON.stringify(value));
const validNumber = n => typeof n === 'number' && Number.isFinite(n);
const validDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
const currentPeriod = data => data.meta.asOf.slice(0, 7);
export const dollars = n => n == null ? 'Not projected' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export function injectDefects(source) {
  const d = clone(source);
  const latest = id => d.observations.find(o => o.projectId === id && o.period === currentPeriod(d));
  d.observations.push(clone(d.observations[0]));
  d.observations.push({ ...clone(d.observations[1]), id: 'ATL-OBS-ORPHAN', projectId: 'ATL-P999' });
  latest('ATL-P004').spent = -500;
  latest('ATL-P011').progress = 120;
  latest('ATL-P019').reportedAt = '2026-08-15';
  d.projects.find(p => p.id === 'ATL-P021').owner = '';
  d.risks.find(r => r.id === 'ATL-R0007').action = '';
  d.risks.find(r => r.id === 'ATL-R0015').owner = '';
  return d;
}

export function prepareSample(source, sample = 'canonical') {
  if (!['canonical', 'defects'].includes(sample)) throw Error('Unknown sample.');
  const raw = sample === 'defects' ? injectDefects(source) : clone(source);
  const data = clone(raw), findings = [], seen = new Set();
  const projectIds = new Set(data.projects.map(p => p.id));
  const finding = (severity, record, locator, message, action, quarantined = false) => findings.push({
    id: `DQ-${String(findings.length + 1).padStart(3, '0')}`, severity, recordId: record.id,
    projectId: record.projectId || (projectIds.has(record.id) ? record.id : ''), locator, message, action, quarantined,
    source: clone(record),
  });
  data.observations = data.observations.filter((o, i) => {
    const locator = `observations[${i}]`;
    if (!projectIds.has(o.projectId)) { finding('Critical', o, locator, 'Orphan project reference.', 'Link to an existing fictional project.', true); return false; }
    const key = `${o.projectId}/${o.period}`;
    if (seen.has(key)) { finding('Critical', o, locator, 'Duplicate project-period observation.', 'Keep the first observation and reconcile the duplicate.', true); return false; }
    if (!validNumber(o.progress) || o.progress < 0 || o.progress > 100 || !validNumber(o.spent) || o.spent < 0 || !validNumber(o.expected) || o.expected < 0 || o.expected > 100 || !validDate(o.observedAt) || !validDate(o.reportedAt) || !Array.isArray(o.deliverableCompletions) || o.deliverableCompletions.length !== 6 || o.deliverableCompletions.some(x => !validNumber(x.completion) || x.completion < 0 || x.completion > 100) || Math.abs(round(mean(o.deliverableCompletions.map(x => x.completion))) - o.progress) > 0.11) {
      finding('Critical', o, locator, 'Invalid observation values.', 'Correct the synthetic values against deliverable and financial records.', true); return false;
    }
    seen.add(key);
    if (o.period === currentPeriod(data) && Date.parse(data.meta.asOf) - Date.parse(o.reportedAt) > 14 * 86400000) finding('Warning', o, locator, 'Current report is stale.', 'Confirm the latest observation with the fictional owner.');
    return true;
  });
  data.projects.forEach((p, i) => { if (!p.owner.trim()) finding('Warning', p, `projects[${i}]`, 'Project owner is missing.', 'Assign a fictional project owner.'); });
  data.risks.forEach((r, i) => {
    if (!r.action.trim()) finding('Warning', r, `risks[${i}]`, 'Management action is missing.', 'Define a management action.');
    if (!r.owner.trim()) finding('Warning', r, `risks[${i}]`, 'Response owner is missing.', 'Assign a fictional response owner.');
  });
  data.projects = data.projects.map(p => ({ ...p, progress: projectProgress(p.id, data.deliverables), expected: progressExpected(p.startDate, p.endDate, data.meta.asOf), exposure: projectExposure(p.id, data.risks), schedule: scheduleStatus(projectProgress(p.id, data.deliverables), progressExpected(p.startDate, p.endDate, data.meta.asOf)) }));
  data.qualityFindings = findings;
  return { data, raw, findings };
}

export function selectScope(data, filters = {}) {
  const projects = data.projects.filter(p => (!filters.program || filters.program === 'All programs' || p.program === filters.program) && (!filters.office || filters.office === 'All offices' || p.office === filters.office) && (!filters.status || filters.status === 'All statuses' || p.status === filters.status) && (!filters.project || p.id === filters.project));
  const ids = new Set(projects.map(p => p.id));
  const d = { ...data, projects };
  for (const key of ['deliverables', 'plans', 'risks', 'staff', 'financials', 'funding', 'observations']) d[key] = data[key].filter(r => ids.has(r.projectId));
  d.qualityFindings = (data.qualityFindings || []).filter(f => ids.has(f.projectId) || !data.projects.some(p => p.id === f.projectId));
  return d;
}

export function coworkerFacts(data) {
  const m = portfolioMetrics(data.projects, data);
  const observed = new Set(data.observations.filter(o => o.period === currentPeriod(data)).map(o => o.projectId)).size;
  return { ...m, observed, coverage: m.projects ? observed / m.projects * 100 : 0,
    onTrack: data.projects.filter(p => p.schedule === 'On track').length,
    behind: data.projects.filter(p => p.schedule === 'Behind schedule').length,
    critical: (data.qualityFindings || []).filter(f => f.severity === 'Critical').length,
    warnings: (data.qualityFindings || []).filter(f => f.severity === 'Warning').length };
}

export function scenario(data, parameters = DEFAULT_SCENARIO) {
  if (!parameters || Array.isArray(parameters) || typeof parameters !== 'object' || Object.keys(parameters).some(k => !Object.hasOwn(DEFAULT_SCENARIO, k))) throw Error('Unknown scenario parameter.');
  const params = { ...DEFAULT_SCENARIO, ...parameters };
  for (const [k, v] of Object.entries(params)) if (!validNumber(v) || v < 0 || v > (k === 'probabilityUplift' ? 1 : .5)) throw Error('Scenario parameter outside supported range.');
  const riskRows = data.risks.filter(r => r.status !== 'Closed').map(r => ({ ...r,
    scenarioProbability: r.kind === 'Issue' ? 1 : Math.min(1, r.probability * (1 + params.probabilityUplift)),
    baselineExpectedLoss: r.probability * r.lossUsd,
    expectedLoss: (r.kind === 'Issue' ? 1 : Math.min(1, r.probability * (1 + params.probabilityUplift))) * r.lossUsd,
  }));
  const rows = data.projects.map(p => {
    const f = data.financials.find(f => f.projectId === p.id);
    const threats = riskRows.filter(r => r.projectId === p.id);
    const loss = threats.reduce((s, r) => s + r.expectedLoss, 0);
    const baselineLoss = threats.reduce((s, r) => s + r.baselineExpectedLoss, 0);
    const availableBudget = f.budget * (1 - params.fundingCut);
    const baselineExecution = p.progress > 0 ? f.spent / (p.progress / 100) : null;
    const execution = baselineExecution == null ? null : f.spent + Math.max(0, baselineExecution - f.spent) * (1 + data.assumptions.capacityCostFactor * params.capacityCut);
    const days = Math.max(0, (Date.parse(p.endDate) - Date.parse(data.meta.asOf)) / 86400000);
    const delay = days * (1 / (1 - params.capacityCut) - 1) + threats.reduce((s, r) => s + r.scenarioProbability * r.delayDays, 0);
    const baselineDelay = threats.reduce((s, r) => s + r.probability * r.delayDays, 0);
    return { id: p.id, projectId: p.id, name: p.name, program: p.program, exposure: p.exposure, progress: p.progress,
      budget: f.budget, spent: f.spent, availableBudget, baselineExpectedLoss: baselineLoss, expectedLoss: loss,
      baselineExecution, execution, costWithRisk: execution == null ? null : execution + loss,
      fundingGap: execution == null ? null : Math.max(0, execution + loss - availableBudget),
      baselineFundingGap: baselineExecution == null ? null : Math.max(0, baselineExecution + baselineLoss - f.budget),
      delay, baselineDelay };
  });
  const eligible = rows.filter(r => r.execution != null);
  return { parameters: params, rows, riskRows, eligible: eligible.length, projects: rows.length,
    availableBudget: rows.reduce((s, r) => s + r.availableBudget, 0), expectedLoss: rows.reduce((s, r) => s + r.expectedLoss, 0),
    baselineExpectedLoss: rows.reduce((s, r) => s + r.baselineExpectedLoss, 0),
    execution: eligible.reduce((s, r) => s + r.execution, 0), fundingGap: eligible.reduce((s, r) => s + r.fundingGap, 0),
    baselineFundingGap: eligible.reduce((s, r) => s + r.baselineFundingGap, 0),
    projectsWithGap: eligible.filter(r => r.fundingGap > 0).length,
    addedDelay: mean(rows.map(r => r.delay - r.baselineDelay)), exposure: coworkerFacts(data).exposure };
}

export function evidence(data, simulation = scenario(data)) {
  const facts = coworkerFacts(data);
  const records = [{ id: 'CALC-PORTFOLIO', title: 'Verified scope figures', content: facts }, { id: 'CALC-SCENARIO', title: 'Scenario assumptions and calculations', content: simulation }];
  data.documents.forEach(d => records.push({ id: d.id, title: d.title, content: d.text }));
  (data.qualityFindings || []).forEach(f => records.push({ id: f.id, title: f.message, projectId: f.projectId, content: f }));
  for (const key of ['projects', 'risks', 'deliverables', 'financials', 'observations']) data[key].forEach(r => records.push({ id: r.id, title: r.name || r.id, projectId: r.projectId || r.id, content: r }));
  return records;
}

export function guidedAnswer(data, question, parameters = DEFAULT_SCENARIO) {
  const facts = coworkerFacts(data), sim = scenario(data, parameters);
  const q = question.toLowerCase();
  const intent = /quality|missing|invalid|block|ready|review|duplicate|calidad|revis|falt|errores/.test(q) ? 'quality' : /scenario|capacity|funding cut|what changes|what if|escenario|capacidad|reducci/.test(q) ? 'scenario' : /risk|threat|issue|exposure|riesgo|amenaza/.test(q) ? 'risk' : /report|brief|summary|summari|portfolio|progress|budget|spend|reporte|resumen|portafolio|presupuesto|avance/.test(q) ? 'report' : 'unsupported';
  let summary, actions, ids = ['CALC-PORTFOLIO', 'DOC-METHOD'];
  if (!facts.projects) { summary = 'No projects match the current scope. Clear a filter before preparing a report.'; actions = ['Adjust the global filters.']; }
  else if (intent === 'quality') {
    summary = `Review is ${facts.critical || facts.observed < facts.projects ? 'blocked' : 'ready for a human decision'}. There are ${facts.critical} critical findings, ${facts.warnings} warnings and ${facts.projects - facts.observed} projects without a valid current monthly observation. Delivery progress still comes from deliverables; observations provide historical evidence.`;
    actions = (data.qualityFindings || []).slice(0, 4).map(f => `${f.recordId}: ${f.action}`);
    if (!actions.length) actions = ['Review narrative accuracy and scenario assumptions.'];
    ids.push('DOC-QUALITY', 'DOC-REVIEW', ...(data.qualityFindings || []).slice(0, 4).map(f => f.id));
  } else if (intent === 'scenario') {
    summary = `Available budget is ${dollars(sim.availableBudget)}. Illustrative expected loss is ${dollars(sim.expectedLoss)}, compared with ${dollars(sim.baselineExpectedLoss)} at baseline. Summed project funding gaps are ${dollars(sim.fundingGap)} across ${sim.eligible} projects with positive delivery progress. Portfolio exposure remains ${facts.exposure.toFixed(1)} / 100; it uses the baseline ordinal scale.`;
    actions = ['Inspect the largest project gaps and their sources.', 'Review capacity, probability and loss assumptions with fictional owners.', 'Keep exposure, baseline forecasts and scenario cost projections separately labelled.'];
    ids.push('CALC-SCENARIO', 'DOC-RISK', 'DOC-FINANCE', 'DOC-PROBABILITY');
  } else if (intent === 'risk') {
    const ranked = [...scenario(data).riskRows].sort((a, b) => b.expectedLoss - a.expectedLoss).slice(0, 3);
    summary = `The scope contains ${facts.riskCount} non-closed risks and ${facts.issueCount} non-closed issues. Mean exposure is ${facts.exposure.toFixed(1)} / 100. Baseline expected financial consequences total ${dollars(sim.baselineExpectedLoss)}; issues use probability one. These measures use the same threat records and different units.`;
    actions = ranked.map(r => `${r.id} · ${r.name}: ${r.action || 'Define a management action.'}`);
    ids.push('CALC-SCENARIO', 'DOC-RISK', 'DOC-PROBABILITY', ...ranked.map(r => r.id));
  } else if (intent === 'report') {
    summary = `Across ${facts.projects} projects (${facts.active} active), deliverable-derived progress is ${facts.actual.toFixed(1)}% versus ${facts.expected.toFixed(1)}% expected. Spending is ${dollars(facts.spent)} against ${dollars(facts.budget)} budget. ${facts.completed} of ${facts.deliverables} deliverables are complete and ${facts.overdue} are overdue. Exposure averages ${facts.exposure.toFixed(1)} / 100; baseline expected consequences are ${dollars(sim.baselineExpectedLoss)}. Current historical evidence covers ${facts.observed}/${facts.projects} projects.`;
    actions = ['Follow up on overdue deliverables and projects more than seven points behind plan.', 'Resolve critical findings and acknowledge warnings before review.', 'Validate the narrative against the verified figures and evidence.'];
    ids.push('CALC-SCENARIO', 'DOC-RISK', 'DOC-REVIEW');
  } else {
    summary = 'I do not have evidence for that topic. Ask about portfolio delivery, spending, quality findings, risks or the current scenario.';
    actions = ['Try: Draft the quarterly brief.', 'Try: What blocks review?', 'Try: What changes in this scenario?'];
  }
  const sources = evidence(data, sim).filter(s => ids.includes(s.id));
  return { mode: 'guided', intent, summary, actions, source_ids: sources.map(s => s.id), sources, facts, scenario: sim, note: 'Guided mode uses deterministic calculations and templates; no language model generated this text.' };
}

export function briefMarkdown(data, parameters, narrative, reviewed = false, mode = 'guided') {
  const m = coworkerFacts(data), s = scenario(data, parameters);
  return `# ${data.meta.product} — Executive Brief\n\nOrganization: ${data.meta.name}\n\n${data.meta.period} | Snapshot ${data.meta.asOf} | ${m.projects} projects in scope\n\nStatus: ${reviewed ? 'Reviewed in current browser session' : 'Draft — review pending'}\nNarrative: ${mode === 'local_ai' ? 'LM Studio local model' : 'Guided template / human edit'}\n\n## Verified figures\n\n- Active / total projects: ${m.active} / ${m.projects}\n- Delivery progress: ${m.actual.toFixed(1)}%; expected: ${m.expected.toFixed(1)}%\n- Spending: ${dollars(m.spent)}; approved budget: ${dollars(m.budget)}\n- Completed / total deliverables: ${m.completed} / ${m.deliverables}; overdue: ${m.overdue}\n- Non-closed risks / issues: ${m.riskCount} / ${m.issueCount}\n- Exposure index: ${m.exposure.toFixed(1)} / 100\n- Baseline expected consequences: ${dollars(s.baselineExpectedLoss)}\n- Current observation coverage: ${m.observed}/${m.projects}\n- Critical findings / warnings: ${m.critical} / ${m.warnings}\n\n## Narrative\n\n${narrative}\n\n## Scenario\n\nFunding reduction ${parameters.fundingCut * 100}%; capacity reduction ${parameters.capacityCut * 100}%; probability uplift ${parameters.probabilityUplift * 100}%.\nExpected loss ${dollars(s.expectedLoss)}; summed project gaps ${dollars(s.fundingGap)}. Cost projections cover ${s.eligible}/${s.projects} projects. Exposure is not a monetary amount.\n\n## Evidence and limitations\n\nCALC-PORTFOLIO; CALC-SCENARIO; DOC-METHOD; DOC-RISK; DOC-PROBABILITY; DOC-FINANCE; DOC-REVIEW. Scenario assumptions are synthetic, uncalibrated and additive. Citation IDs do not prove narrative accuracy. Review is session-only.\n\n${data.meta.disclaimer}\n`;
}
