const chooseFilter = (label: string, option: string) => { fireEvent.click(screen.getByRole("combobox", { name: label, exact: true })); fireEvent.click(screen.getByRole("option", { name: option, exact: true })); fireEvent.click(screen.getByRole("button", { name: "Done", exact: true })); };
import React, { useState } from 'react';
import { CoworkerWorkspace } from '../src/Coworker';
import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, within, cleanup, waitFor } from '@testing-library/react';
import { App } from '../src/main';
import raw from '../src/data/atlas-bundle.json';
import { prepareSample, selectScope, coworkerFacts, dollars, scenario } from '../src/coworker-engine.mjs';
import { createWorkbookSheets } from '../src/exports';
import { basePath } from '../deployment-base.mjs';
import writeExcelFile from 'write-excel-file/node';
import { unzipSync, strFromU8 } from 'fflate';
const nav = (name: string) => { if (name === 'Coworker') fireEvent.click(screen.getByRole('button', { name: 'Open Coworker' })); else if (['Data Quality', 'Risk Scenarios', 'Executive Brief', 'Methodology'].includes(name)) fireEvent.click(screen.getByRole('button', { name: `Inspect ${name}` })); else fireEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name, exact: true })); };
function RetainedWorkspaces() { const [view, setView] = useState('Data Quality'); const [sample, setSample] = useState('canonical'); const prepared = prepareSample(raw, sample); return <>{['Data Quality', 'Risk Scenarios', 'Executive Brief', 'Methodology'].map(v => <button key={v} onClick={() => setView(v)}>Inspect {v}</button>)}<CoworkerWorkspace view={view} data={prepared.data} filters={{}} sample={sample} setSample={setSample} navigate={setView} openProject={() => {}} /></>; }
beforeEach(() => {
  window.history.replaceState(null, '', basePath);
  HTMLDialogElement.prototype.showModal = function() { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function() { this.removeAttribute('open'); };
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Static demo')));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
test('Coworker uses the full portfolio while hidden filters remain available in other tabs', () => {
  render(<App />); chooseFilter('Program', 'Health'); nav('Coworker');
  const m = coworkerFacts(prepareSample(raw).data);
  expect(screen.getByTestId('cw-progress').textContent).toBe(`${m.actual.toFixed(1)}%`);
  expect(screen.queryByRole('combobox', { name: 'Program' })).toBeNull();
  expect(screen.queryByRole('heading', { name: 'Portfolio assessment' })).toBeNull();
  nav('Projects'); expect(screen.getByText('12 projects in scope')).toBeTruthy();
});
test('Quality sample applies globally and blocks brief review until corrected', () => {
  render(<RetainedWorkspaces />); nav('Data Quality');
  fireEvent.click(screen.getByRole('button', { name: 'Load defect sample' }));
  expect(screen.getByRole('table', { name: 'Quality findings' }).querySelectorAll('tbody tr')).toHaveLength(8);
  nav('Executive Brief');
  expect((screen.getByRole('button', { name: 'Mark scope reviewed' }) as HTMLButtonElement).disabled).toBe(true);
  nav('Data Quality'); fireEvent.click(screen.getByRole('button', { name: 'Load corrected sample' }));
  nav('Executive Brief');
  const review = screen.getByRole('button', { name: 'Mark scope reviewed' });
  expect((review as HTMLButtonElement).disabled).toBe(false); fireEvent.click(review);
  expect(screen.getByRole('button', { name: 'Download reviewed brief' })).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Executive narrative'), { target: { value: 'A human-reviewed narrative.' } });
  expect(screen.getByRole('button', { name: 'Download draft brief' })).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Executive narrative'), { target: { value: '' } });
  expect((screen.getByRole('button', { name: 'Mark scope reviewed' }) as HTMLButtonElement).disabled).toBe(true);
});
test('Scenario controls update results without a matrix and project links open Project 360', () => {
  render(<RetainedWorkspaces />); nav('Risk Scenarios');
  const original = screen.getByTestId('cw-gap').textContent;
  fireEvent.change(screen.getByRole('slider', { name: 'Funding reduction' }), { target: { value: 20 } });
  expect(screen.getByTestId('cw-gap').textContent).not.toBe(original);
  expect(screen.queryByRole('table', { name: 'Threat matrix' })).toBeNull();
  fireEvent.click(within(screen.getByRole('table', { name: 'Project scenario results' })).getAllByRole('button')[0]);
  expect(screen.getByRole('table', { name: 'Project scenario results' }).textContent).toContain('Watershed Futures');
});
test('Coworker starts unanswered, sample prompts only populate the field and unsupported questions are refused', async () => {
  render(<App />); nav('Coworker');
  expect(screen.queryByRole('heading', { name: 'Portfolio assessment' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Which threats need follow-up?' }));
  expect((screen.getByLabelText('Ask Coworker') as HTMLTextAreaElement).value).toBe('Which threats need follow-up?');
  expect(screen.queryByRole('heading', { name: 'Portfolio assessment' })).toBeNull();
  fireEvent.change(screen.getByLabelText('Ask Coworker'), { target: { value: 'What is the weather?' } });
  fireEvent.click(screen.getByRole('button', { name: 'Ask Coworker', exact: true }));
  await waitFor(() => expect(screen.getByText(/I do not have evidence for that topic/)).toBeTruthy());
  expect(screen.queryByRole('button', { name: 'CALC-PORTFOLIO' })).toBeNull();
});
test('A late model response cannot overwrite an edited question', async () => {
  let finish: (value: any) => void = () => {};
  vi.stubGlobal('fetch', vi.fn((url: string) => url.endsWith('api/status') ? Promise.resolve({ ok: true, json: async () => ({ local_server: true, provider: 'LM Studio', reachable: true, model_available: true }) }) : new Promise(resolve => { finish = resolve; })));
  render(<App />); nav('Coworker');
  await waitFor(() => expect((screen.getByLabelText('Use local AI') as HTMLInputElement).disabled).toBe(false));
  fireEvent.click(screen.getByLabelText('Use local AI')); fireEvent.click(screen.getByRole('button', { name: 'Ask Coworker', exact: true }));
  fireEvent.change(screen.getByLabelText('Ask Coworker'), { target: { value: 'A new question' } });
  finish({ ok: true, json: async () => ({ summary: 'STALE MODEL RESPONSE', actions: [], sources: [], mode: 'local_ai' }) });
  await waitFor(() => expect(screen.queryByText('STALE MODEL RESPONSE')).toBeNull());
  expect((screen.getByLabelText('Ask Coworker') as HTMLTextAreaElement).value).toBe('A new question');
});
test('XLSX scenario numeric cells preserve the same shared calculations and empty projections', async () => {
  const d = selectScope(prepareSample(raw).data, { program: 'Health' });
  const s = scenario(d, { fundingCut: .2, capacityCut: .25, probabilityUplift: .5 });
  const bytes = await writeExcelFile(createWorkbookSheets(s.rows, 'Risk Scenarios'), { fontFamily: 'Calibri' }).toBuffer();
  const xml = strFromU8(unzipSync(bytes)['xl/worksheets/sheet1.xml']);
  expect(xml).toContain(`<v>${s.rows[0].expectedLoss}</v>`);
  expect(xml).toContain(`<v>${s.rows[0].fundingGap}</v>`);
  expect(xml).not.toContain('>null<');
  expect((xml.match(/<row\b/g) || []).length).toBe(13);
});
