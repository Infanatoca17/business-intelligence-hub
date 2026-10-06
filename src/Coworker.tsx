import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { COWORKER_VIEWS, DEFAULT_SCENARIO, coworkerFacts, scenario, evidence, guidedAnswer, briefMarkdown, dollars, selectScope } from './coworker-engine.mjs';
import { exportWorkbook } from './exports';
import './coworker.css';

type RecordData = Record<string, any>;
type Parameters = { fundingCut: number; capacityCut: number; probabilityUplift: number };
type Props = { view: string; data: RecordData; filters: Record<string, string>; sample: string; setSample: (s: string) => void; navigate: (v: any) => void; openProject: (r: RecordData) => void };
const pct = (n: number) => `${n.toFixed(1)}%`;
const prompts = ['Draft the quarterly brief', 'What blocks review?', 'Which threats need follow-up?', 'What changes in this scenario?'];

function EvidenceDialog({ source, close, openProject }: { source: RecordData; close: () => void; openProject: Props['openProject'] }) {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => { dialog.close(); document.body.style.overflow = overflow; if (opener?.isConnected) opener.focus(); };
  }, []);
  return <dialog ref={ref} className="cw-evidence" aria-label="Evidence source" onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) close(); }}>
    <div className="cw-panel-head"><div><span className="eyebrow">{source.id}</span><h2>{source.title}</h2></div><button className="button subtle" onClick={close} aria-label="Close evidence source">Close</button></div>
    <pre>{typeof source.content === 'string' ? source.content : JSON.stringify(source.content, null, 2)}</pre>
    {source.projectId?.startsWith('ATL-P') && source.projectId !== 'ATL-P999' && <button className="button primary" onClick={() => { close(); openProject({ id: source.projectId }); }}>Open Project 360</button>}
  </dialog>;
}

function FactCards({ facts, simulation }: { facts: RecordData; simulation: RecordData }) {
  return <div className="cw-facts">
    <div><span>Delivery progress</span><strong data-testid="cw-progress">{pct(facts.actual)}</strong><small>{pct(facts.expected)} expected · tolerance ±7 points</small></div>
    <div><span>Spending</span><strong data-testid="cw-spending">{dollars(facts.spent)}</strong><small>{dollars(facts.budget)} approved budget</small></div>
    <div><span>Exposure index</span><strong>{facts.exposure.toFixed(1)} / 100</strong><small>Mean of project exposure indices</small></div>
    <div><span>Baseline expected consequences</span><strong data-testid="cw-baseline-loss">{dollars(simulation.baselineExpectedLoss)}</strong><small>Non-closed risks and issues · USD</small></div>
  </div>;
}

export function CoworkerWorkspace({ view, data, filters, sample, setSample, navigate, openProject }: Props) {
  const [parameters, setParameters] = useState<Parameters>({ ...DEFAULT_SCENARIO });
  const [question, setQuestion] = useState(prompts[0]);
  const [answer, setAnswer] = useState<RecordData | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<RecordData | null>(null);
  const [localAI, setLocalAI] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [severity, setSeverity] = useState('All');
  const [heatFilter, setHeatFilter] = useState('');
  const [draft, setDraft] = useState<string | null>(null);
  const [draftMode, setDraftMode] = useState('guided');
  const [reviewKey, setReviewKey] = useState('');
  const [ackKey, setAckKey] = useState('');
  const [error, setError] = useState('');
  const revision = useRef(0);
  const activeRequest = useRef(0);
  const facts = useMemo(() => coworkerFacts(data), [data]);
  const simulation = useMemo(() => scenario(data, parameters), [data, parameters]);
  const sources = useMemo(() => evidence(data, simulation), [data, simulation]);
  const guided = useMemo(() => guidedAnswer(data, question, parameters), [data, question, parameters]);
  const response = answer || guided;
  const contextKey = JSON.stringify({ filters, sample, parameters });
  const narrative = draft ?? guidedAnswer(data, prompts[0], parameters).summary;
  const currentReviewKey = JSON.stringify({ contextKey, narrative, draftMode });
  const reviewed = reviewKey === currentReviewKey;
  const ready = facts.projects > 0 && facts.critical === 0 && facts.observed === facts.projects && (facts.warnings === 0 || ackKey === contextKey);
  useEffect(() => { revision.current++; activeRequest.current++; setBusy(false); setAnswer(null); setDraft(null); setDraftMode('guided'); setSourceId(''); setReviewKey(''); setAckKey(''); setHeatFilter(''); setError(''); }, [contextKey]);
  useEffect(() => () => { activeRequest.current++; }, []);
  async function checkStatus() {
    try { const r = await fetch(`${import.meta.env.BASE_URL}api/status`); if (!r.ok) throw Error(); setStatus(await r.json()); }
    catch { setStatus(null); setLocalAI(false); }
  }
  useEffect(() => { void checkStatus(); }, []);
  async function ask(q: string, useForBrief = false) {
    if (!q.trim() || busy) return;
    setQuestion(q); setBusy(true); setError('');
    const token = ++activeRequest.current, version = revision.current;
    let result: RecordData = guidedAnswer(data, q, parameters);
    if (localAI && status?.local_server) {
      try {
        const r = await fetch(`${import.meta.env.BASE_URL}api/assistant`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, filters, sample, parameters, mode: 'local_ai' }) });
        if (!r.ok) throw Error();
        result = await r.json();
      } catch { result = { ...result, fallback: true, note: 'The local service was unavailable. This is a guided fallback, not a model-generated answer.' }; }
    }
    if (version !== revision.current || token !== activeRequest.current) return;
    setAnswer(result); setBusy(false);
    if (useForBrief) { setDraft(result.summary); setDraftMode(result.mode); setReviewKey(''); }
  }
  const download = (text: string, name: string, mime: string) => {
    const url = URL.createObjectURL(new Blob([text], { type: mime })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 3000);
  };
  const scenarioExportRows = simulation.rows.map((r: RecordData) => ({ ...r, snapshot: data.meta.asOf, currency: 'USD', sample, fundingReductionPct: parameters.fundingCut * 100, capacityReductionPct: parameters.capacityCut * 100, probabilityUpliftPct: parameters.probabilityUplift * 100, disclaimer: data.meta.disclaimer }));
  const exportRows: RecordData[] = view === 'Data Quality' ? data.qualityFindings.map((f: RecordData) => ({ id: f.id, severity: f.severity, recordId: f.recordId, projectId: f.projectId, locator: f.locator, message: f.message, action: f.action, quarantined: f.quarantined })) : view === 'Risk Scenarios' ? scenarioExportRows : [{ ...facts, expectedLoss: simulation.expectedLoss, baselineExpectedLoss: simulation.baselineExpectedLoss, fundingGap: simulation.fundingGap, sample }];
  const exportView = async () => { try { await exportWorkbook(exportRows, view); } catch { setError('The workbook could not be created. Try again.'); } };
  const sourceButton = (id: string, label = id) => <button className="cw-source-button" key={id} onClick={() => setSourceId(id)}>{label}</button>;
  if (!COWORKER_VIEWS.includes(view)) return null;
  const source = sources.find((s: RecordData) => s.id === sourceId);
  const findings = data.qualityFindings.filter((f: RecordData) => severity === 'All' || f.severity === severity);
  const threats = simulation.riskRows.filter((r: RecordData) => !heatFilter || `${r.impact}/${r.likelihood}` === heatFilter);
  const behind = simulation.rows.filter((r: RecordData) => data.projects.find((p: RecordData) => p.id === r.id)?.schedule === 'Behind schedule');
  return <section className="coworker-workspace" aria-label={`${view} workspace`}>
    <div className="cw-toolbar"><span className="cw-pill">{sample === 'canonical' ? 'Canonical synthetic sample' : 'Synthetic defect sample'}</span><span>{facts.observed}/{facts.projects} current observations</span><button className="button subtle" onClick={exportView}>Export current view</button></div>
    {error && <p role="alert">{error}</p>}
    <FactCards facts={facts} simulation={simulation} />
    {view === 'Coworker' && <>
      <div className={`cw-readiness ${ready ? 'ready' : ''}`}><div><strong>{facts.critical || facts.observed < facts.projects ? 'Resolve evidence gaps before review' : 'Data checks passed; human review remains'}</strong><p>{facts.critical} critical findings · {facts.warnings} warnings · {facts.observed}/{facts.projects} observation coverage</p></div><button className="button subtle" onClick={() => navigate('Data Quality')}>Review data quality</button></div>
      <div className="cw-layout"><section className="cw-panel"><div className="cw-panel-head"><div><span className="eyebrow">EVIDENCE ASSISTANT</span><h2>Work with Atlas Coworker</h2></div><span className="cw-pill">{response.mode === 'local_ai' ? 'Local AI · LM Studio' : 'Guided demo'}</span></div>
        <div className="cw-prompts">{prompts.map(p => <button key={p} onClick={() => void ask(p)} disabled={busy}>{p}</button>)}</div>
        <form onSubmit={e => { e.preventDefault(); void ask(question); }}><label htmlFor="cw-question">Question for Coworker</label><textarea id="cw-question" maxLength={1500} rows={3} value={question} onChange={e => { setQuestion(e.target.value); setAnswer(null); }} /><div className="cw-form-actions"><label><input type="checkbox" checked={localAI} disabled={!status?.local_server || !status?.model_available} onChange={e => setLocalAI(e.target.checked)} />Use local AI</label><button className="button primary" disabled={busy || !question.trim()}>{busy ? 'Preparing answer…' : 'Ask Coworker'}</button></div></form>
        <div className="cw-answer" aria-live="polite"><h3>Portfolio assessment</h3><p>{response.summary}</p><h3>Suggested follow-up</h3><ol>{response.actions.map((a: string, i: number) => <li key={i}>{a}</li>)}</ol><p className="cw-note">{response.note}</p></div>
      </section><aside className="cw-panel"><h2>Sources you can inspect</h2><p>Verified calculations, synthetic policies and related records.</p><div className="cw-source-list">{response.sources.map((s: RecordData) => sourceButton(s.id, `${s.id} · ${s.title}`))}</div><h3>Local model connection</h3><p>{status ? `${status.provider}: ${status.reachable ? 'server reachable' : 'server unavailable'} · ${status.model_available ? 'configured model listed' : 'model not available'}` : 'Public / static demo. Run the Python service locally to enable LM Studio.'}</p>{status?.model && <code>{status.model}</code>}<button className="button subtle" onClick={() => void checkStatus()}>Check connection</button><p className="cw-note">A successful response labelled Local AI confirms inference. Model listing alone does not.</p></aside></div>
    </>}
    {view === 'Data Quality' && <section className="cw-panel"><div className="cw-panel-head"><div><h2>Quality findings</h2><p>{facts.critical} critical · {facts.warnings} warnings · {facts.projects - facts.observed} missing current observations</p></div><button className="button primary" onClick={() => setSample(sample === 'canonical' ? 'defects' : 'canonical')}>{sample === 'canonical' ? 'Load defect sample' : 'Load corrected sample'}</button></div><p>The sample switch applies across the hub. Invalid observations are quarantined; delivery progress remains derived from deliverables. Loading the corrected sample replaces this fictional fixture.</p><label>Finding severity <select value={severity} onChange={e => setSeverity(e.target.value)}><option>All</option><option>Critical</option><option>Warning</option></select></label>
      {findings.length ? <div className="cw-table-wrap"><table aria-label="Quality findings"><thead><tr><th>Severity</th><th>Source record</th><th>Finding</th><th>Suggested correction</th></tr></thead><tbody>{findings.map((f: RecordData) => <tr key={f.id}><td><span className={`cw-pill ${f.severity === 'Critical' ? 'critical' : 'warning'}`}>{f.severity}</span></td><td>{sourceButton(f.id, f.recordId)}</td><td>{f.message}<small>{f.locator}</small></td><td>{f.action}</td></tr>)}</tbody></table></div> : <p className="cw-empty">No quality findings in this scope.</p>}{sourceButton('DOC-QUALITY', 'Inspect the quality policy')}</section>}
    {view === 'Risk Scenarios' && <>
      <div className="cw-layout"><section className="cw-panel"><h2>Explore explicit assumptions</h2>{([['fundingCut', 'Funding reduction', 50], ['capacityCut', 'Capacity reduction', 50], ['probabilityUplift', 'Risk probability uplift', 100]] as const).map(([key, label, max]) => <label className="cw-slider" key={key}>{label}<strong>{Math.round(parameters[key] * 100)}%</strong><input type="range" min={0} max={max} step={5} aria-label={label} value={Math.round(parameters[key] * 100)} onChange={e => setParameters({ ...parameters, [key]: Number(e.target.value) / 100 })} /></label>)}<button className="button subtle" onClick={() => setParameters({ ...DEFAULT_SCENARIO })}>Reset scenario</button><p className="cw-note">Issues remain at probability one. Closed threats are excluded. Capacity, costs and delays are illustrative assumptions.</p>{sourceButton('DOC-FINANCE', 'Inspect scenario assumptions')}</section><section className="cw-panel"><h2>Scenario compared with baseline</h2><dl className="cw-results"><dt>Available budget</dt><dd>{dollars(simulation.availableBudget)}</dd><dt>Expected financial consequences</dt><dd>{dollars(simulation.expectedLoss)}<small>{dollars(simulation.baselineExpectedLoss)} baseline</small></dd><dt>Summed project funding gaps</dt><dd data-testid="cw-gap">{dollars(simulation.fundingGap)}<small>{dollars(simulation.baselineFundingGap)} baseline</small></dd><dt>Added mean delay vs baseline</dt><dd>{simulation.addedDelay.toFixed(1)} days</dd></dl><p>{simulation.eligible}/{simulation.projects} projects have a cost projection. Zero-progress projects retain an explicit empty projection.</p></section></div>
      <section className="cw-panel"><div className="cw-panel-head"><h2>Project exposure and funding gaps</h2><button className="button subtle" onClick={() => { const keys = ['id', 'name', 'exposure', 'progress', 'baselineExpectedLoss', 'expectedLoss', 'availableBudget', 'execution', 'fundingGap', 'snapshot', 'currency', 'sample', 'fundingReductionPct', 'capacityReductionPct', 'probabilityUpliftPct', 'disclaimer']; const csv = [keys, ...scenarioExportRows.map((r: RecordData) => keys.map(k => r[k] == null ? '' : r[k]))].map(row => row.map((v: any) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n'); download(csv, 'Atlas_Risk_Scenarios.csv', 'text/csv;charset=utf-8'); }}>Download scenario CSV</button></div><div className="cw-table-wrap"><table aria-label="Project scenario results"><thead><tr><th>Project</th><th>Exposure / 100</th><th>Expected loss</th><th>Available budget</th><th>Execution projection</th><th>Funding gap</th></tr></thead><tbody>{[...simulation.rows].sort((a: RecordData, b: RecordData) => (b.fundingGap || 0) - (a.fundingGap || 0)).map((r: RecordData) => <tr key={r.id}><td><button className="cw-source-button" onClick={() => openProject(r)}>{r.name}</button></td><td>{r.exposure.toFixed(1)}</td><td>{dollars(r.expectedLoss)}</td><td>{dollars(r.availableBudget)}</td><td>{dollars(r.execution)}</td><td>{dollars(r.fundingGap)}</td></tr>)}</tbody></table></div></section>
      <section className="cw-panel"><div className="cw-panel-head"><h2>Baseline impact × likelihood</h2><button className="button subtle" onClick={() => setHeatFilter('')}>Clear matrix filter</button></div><div className="cw-table-wrap"><table className="cw-matrix" aria-label="Threat matrix"><thead><tr><th>Impact / likelihood</th>{[1, 2, 3, 4, 5].map(l => <th key={l}>{l}</th>)}</tr></thead><tbody>{[5, 4, 3, 2, 1].map(i => <tr key={i}><th>{i}</th>{[1, 2, 3, 4, 5].map(l => { const count = simulation.riskRows.filter((r: RecordData) => r.impact === i && r.likelihood === l).length; return <td key={l}><button className={heatFilter === `${i}/${l}` ? 'selected' : ''} disabled={!count} aria-label={`Impact ${i}, likelihood ${l}: ${count} threats`} onClick={() => setHeatFilter(`${i}/${l}`)}>{count}</button></td>; })}</tr>)}</tbody></table></div><p>{threats.length} non-closed threats in the register{heatFilter ? ' after the matrix filter' : ''}. Probability uplift changes scenario dollars; the matrix retains baseline ordinal likelihood.</p><div className="cw-table-wrap"><table aria-label="Scenario threat register"><thead><tr><th>Threat / evidence</th><th>Type</th><th>Exposure</th><th>Baseline probability</th><th>Scenario probability</th><th>Expected loss</th></tr></thead><tbody>{threats.map((r: RecordData) => <tr key={r.id}><td>{sourceButton(r.id, r.name)}</td><td>{r.kind}</td><td>{r.score}</td><td>{pct(r.probability * 100)}</td><td>{pct(r.scenarioProbability * 100)}</td><td>{dollars(r.expectedLoss)}</td></tr>)}</tbody></table></div></section>
    </>}
    {view === 'Executive Brief' && <div className="cw-layout"><section className="cw-panel cw-paper"><div className="cw-panel-head"><div><span className="eyebrow">{data.meta.productLabel} · {data.meta.period}</span><h2>Executive Portfolio Brief</h2></div><span className="cw-pill">{reviewed ? 'Reviewed in this session' : 'Draft'}</span></div><label htmlFor="cw-narrative">Executive narrative</label><textarea id="cw-narrative" rows={7} value={narrative} onChange={e => { setDraft(e.target.value); setDraftMode('human_edit'); }} /><div className="cw-form-actions"><span>{draftMode === 'local_ai' ? 'LM Studio narrative · human review required' : 'Guided template / human edit'}</span><button className="button subtle" onClick={() => void ask(prompts[0], true)} disabled={busy}>{busy ? 'Preparing draft…' : 'Draft with Coworker'}</button></div><h3>Program performance</h3><div className="cw-table-wrap"><table aria-label="Brief program performance"><thead><tr><th>Program</th><th>Projects</th><th>Progress</th><th>Expected</th><th>Spending</th><th>Coverage</th></tr></thead><tbody>{data.programs.map((p: RecordData) => { const m = coworkerFacts(selectScope(data, { program: p.name })); return <tr key={p.id}><td>{p.name}</td><td>{m.projects}</td><td>{pct(m.actual)}</td><td>{pct(m.expected)}</td><td>{dollars(m.spent)}</td><td>{m.observed}/{m.projects}</td></tr>; })}</tbody></table></div><h3>Delivery attention</h3><p>{behind.length} projects are more than seven points behind expected progress.</p><div className="cw-prompts">{behind.slice(0, 5).map((p: RecordData) => <button key={p.id} onClick={() => openProject(p)}>{p.name}</button>)}</div><h3>Risk and scenario context</h3><p>Exposure: {facts.exposure.toFixed(1)} / 100. Baseline expected consequences: {dollars(simulation.baselineExpectedLoss)}. Scenario expected consequences: {dollars(simulation.expectedLoss)}. Modeled funding gaps: {dollars(simulation.fundingGap)}.</p><p>Current scenario: {parameters.fundingCut * 100}% funding reduction, {parameters.capacityCut * 100}% capacity reduction, {parameters.probabilityUplift * 100}% probability uplift.</p>{sourceButton('CALC-PORTFOLIO', 'Inspect verified figures')} {sourceButton('CALC-SCENARIO', 'Inspect current scenario')}</section><aside className="cw-panel"><h2>Human review</h2><ul className="cw-review"><li>{facts.critical === 0 ? '✓' : '!'} Critical findings: {facts.critical}</li><li>{facts.observed === facts.projects ? '✓' : '!'} Current coverage: {facts.observed}/{facts.projects}</li><li>{facts.warnings === 0 ? '✓' : '!'} Warnings: {facts.warnings}</li></ul>{facts.warnings > 0 && <label><input type="checkbox" checked={ackKey === contextKey} onChange={e => setAckKey(e.target.checked ? contextKey : '')} />I reviewed the warnings in this scope.</label>}<button className="button primary" disabled={!ready || !narrative.trim()} onClick={() => setReviewKey(currentReviewKey)}>{reviewed ? 'Reviewed' : 'Mark scope reviewed'}</button><button className="button subtle" onClick={() => download(briefMarkdown(data, parameters, narrative, reviewed, draftMode), 'Atlas_Executive_Brief.md', 'text/markdown;charset=utf-8')}>Download {reviewed ? 'reviewed' : 'draft'} brief</button><p className="cw-note">Review is session-only. Scope, sample, assumptions or narrative changes reset it. Review the generated text against the calculations; citation IDs alone do not establish accuracy.</p></aside></div>}
    {view === 'Methodology' && <section className="cw-panel"><h2>One calculation contract across the hub</h2><p>Dashboard, Coworker and exports use the same JavaScript engine. The Python service invokes that engine before requesting a local narrative.</p><h3>Explicit synthetic probabilities</h3><div className="cw-table-wrap"><table aria-label="Probability assumptions"><thead><tr><th>Risk likelihood level</th><th>Probability</th></tr></thead><tbody>{Object.entries(data.assumptions.likelihoodProbabilities).map(([l, p]) => <tr key={l}><td>{l}</td><td>{pct(Number(p) * 100)}</td></tr>)}</tbody></table></div><p>Issues use probability 100%. Closed records contribute zero. These probabilities are illustrative assumptions, distinct from the ordinal exposure index.</p><div className="cw-policy-grid">{data.documents.map((d: RecordData) => <article key={d.id}><h3>{d.title}</h3><p>{d.text}</p>{sourceButton(d.id, 'Inspect source')}</article>)}</div><h3>Operating modes</h3><p>GitHub Pages runs the guided demo. Generative inference requires the local Python service and a loaded LM Studio model. Verified calculations remain unchanged by model narrative generation.</p><p className="cw-note">Synthetic cost and delay scenarios are exploratory, not trained forecasts. Monthly observations are generated historical snapshots; no employer data or services are connected.</p></section>}
    {source && <EvidenceDialog source={source} close={() => setSourceId('')} openProject={openProject} />}
  </section>;
}
