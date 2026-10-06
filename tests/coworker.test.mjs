import test from 'node:test';
import assert from 'node:assert/strict';
import { generateBundle } from '../scripts/generate-data.mjs';
import { scheduleStatus, portfolioMetrics } from '../src/metrics.mjs';
import { prepareSample, selectScope, coworkerFacts, scenario, guidedAnswer, briefMarkdown } from '../src/coworker-engine.mjs';
const source = generateBundle();
const clean = prepareSample(source).data;

test('Seven-point schedule tolerance includes both boundaries', () => {
  assert.equal(scheduleStatus(53, 60), 'On track');
  assert.equal(scheduleStatus(52.9, 60), 'Behind schedule');
  assert.equal(scheduleStatus(67, 60), 'On track');
  assert.equal(scheduleStatus(67.1, 60), 'Ahead of plan');
});
test('Monthly evidence covers all 48 projects and preserves current deliverable and finance figures', () => {
  assert.equal(source.observations.length, 576);
  for (const p of source.projects) {
    const current = source.observations.find(o => o.projectId === p.id && o.period === '2026-09');
    const delivered = source.deliverables.filter(d => d.projectId === p.id);
    assert.equal(current.progress, Math.round(delivered.reduce((n, d) => n + d.completion, 0) / delivered.length * 10) / 10);
    assert.equal(current.spent, source.financials.find(f => f.projectId === p.id).spent);
    assert.deepEqual(current.deliverableCompletions, delivered.map(d => ({ id: d.id, completion: d.completion })));
  }
});
test('Quality findings preserve raw evidence and quarantines without changing current delivery or finances', () => {
  const sample = prepareSample(source, 'defects');
  assert.equal(sample.findings.length, 8);
  assert.equal(sample.findings.filter(f => f.severity === 'Critical').length, 4);
  assert.equal(sample.findings.filter(f => f.severity === 'Warning').length, 4);
  assert.equal(coworkerFacts(sample.data).observed, 46);
  assert.equal(coworkerFacts(clean).observed, 48);
  assert.equal(sample.data.observations.length, 574);
  assert.ok(sample.findings.every(f => f.source.id === f.recordId && f.locator));
  assert.equal(coworkerFacts(sample.data).actual, coworkerFacts(clean).actual);
  assert.equal(coworkerFacts(sample.data).spent, coworkerFacts(clean).spent);
  assert.deepEqual(source, generateBundle());
});
test('Dashboard and assistant figures reconcile across program, office, status and individual project scopes', () => {
  const scopes = [{}, ...source.programs.map(p => ({ program: p.name })), ...[...new Set(source.projects.map(p => p.office))].map(office => ({ office })), { status: 'Active' }, { status: 'Planned' }, { project: 'ATL-P001' }, { program: 'Health', office: 'Europe Hub', status: 'Active' }];
  for (const filters of scopes) {
    const d = selectScope(clean, filters);
    const m = portfolioMetrics(d.projects, d);
    const answer = guidedAnswer(d, 'Draft the quarterly brief');
    for (const key of Object.keys(m)) assert.equal(answer.facts[key], m[key], `${JSON.stringify(filters)} ${key}`);
    const ids = new Set(d.projects.map(p => p.id));
    assert.ok(d.risks.every(r => ids.has(r.projectId)));
    assert.ok(d.financials.every(r => ids.has(r.projectId)));
  }
});
test('Probabilities are explicit synthetic assumptions and closed threats are excluded', () => {
  assert.deepEqual(source.assumptions.likelihoodProbabilities, { 1: .1, 2: .25, 3: .45, 4: .65, 5: .85 });
  const baseline = scenario(clean);
  const loss = source.risks.filter(r => r.status !== 'Closed').reduce((n, r) => n + (r.kind === 'Issue' ? 1 : source.assumptions.likelihoodProbabilities[r.likelihood]) * r.lossUsd, 0);
  assert.ok(Math.abs(baseline.expectedLoss - loss) < 1e-6);
  const uplift = scenario(clean, { fundingCut: .2, capacityCut: .25, probabilityUplift: 1 });
  assert.ok(uplift.riskRows.every(r => r.scenarioProbability <= 1));
  assert.ok(uplift.riskRows.filter(r => r.kind === 'Issue').every(r => r.scenarioProbability === 1));
  assert.equal(baseline.exposure, uplift.exposure);
  assert.ok(uplift.expectedLoss >= baseline.expectedLoss);
  assert.ok(uplift.fundingGap >= baseline.fundingGap);
});
test('A hand-calculated project cost and expected loss agree with the scenario', () => {
  const d = selectScope(clean, { project: 'ATL-P001' });
  const p = d.projects[0], f = d.financials[0];
  const params = { fundingCut: .2, capacityCut: .25, probabilityUplift: .5 };
  const r = scenario(d, params).rows[0];
  const baseline = f.spent / (p.progress / 100);
  const execution = f.spent + Math.max(0, baseline - f.spent) * 1.075;
  const loss = d.risks.filter(t => t.status !== 'Closed').reduce((n, t) => n + (t.kind === 'Issue' ? 1 : Math.min(1, t.probability * 1.5)) * t.lossUsd, 0);
  assert.ok(Math.abs(r.execution - execution) < 1e-7);
  assert.ok(Math.abs(r.expectedLoss - loss) < 1e-7);
  assert.ok(Math.abs(r.fundingGap - Math.max(0, execution + loss - f.budget * .8)) < 1e-7);
});
test('Planned projects and an empty scope keep projection gaps explicit', () => {
  const planned = scenario(selectScope(clean, { status: 'Planned' }));
  assert.equal(planned.projects, 4);
  assert.equal(planned.eligible, 0);
  assert.ok(planned.rows.every(r => r.execution === null && r.fundingGap === null));
  const empty = selectScope(clean, { program: 'does-not-exist' });
  assert.equal(scenario(empty).fundingGap, 0);
  assert.equal(coworkerFacts(empty).projects, 0);
  assert.match(guidedAnswer(empty, 'Report').summary, /No projects/);
});
test('Exported narrative uses the same verified figures and labels every scenario assumption', () => {
  const d = selectScope(clean, { program: 'Health' });
  const params = { fundingCut: .2, capacityCut: .25, probabilityUplift: .5 };
  const answer = guidedAnswer(d, 'Report', params);
  const text = briefMarkdown(d, params, answer.summary, true);
  assert.match(text, new RegExp(`${answer.facts.actual.toFixed(1).replace('.', '\\.') }%`));
  assert.ok(text.includes(answer.summary));
  assert.ok(text.includes('Reviewed in current browser session'));
  assert.ok(text.includes('Funding reduction 20%; capacity reduction 25%; probability uplift 50%'));
  assert.ok(text.includes(source.meta.disclaimer));
});
test('Invalid scenarios are rejected and unsupported questions have no invented answer', () => {
  for (const p of [{ fundingCut: .51 }, { capacityCut: 1 }, { probabilityUplift: 1.01 }, { fundingCut: true }, { capacityCut: NaN }, { unknown: 0 }]) assert.throws(() => scenario(clean, p));
  assert.equal(guidedAnswer(clean, 'What is the weather?').intent, 'unsupported');
  assert.match(guidedAnswer(clean, 'What is the weather?').summary, /do not have evidence/);
});
