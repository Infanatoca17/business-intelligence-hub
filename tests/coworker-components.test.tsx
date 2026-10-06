import React from 'react';
import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, within, cleanup, waitFor } from '@testing-library/react';
import { App } from '../src/main';
import raw from '../src/data/atlas-bundle.json';
import { prepareSample, selectScope, coworkerFacts, dollars, scenario } from '../src/coworker-engine.mjs';
import { createWorkbookSheets } from '../src/exports';
import { basePath } from '../deployment-base.mjs';
import writeExcelFile from 'write-excel-file/node';
import { unzipSync, strFromU8 } from 'fflate';
const nav = (name: string) => fireEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name, exact: true }));
beforeEach(() => {
  window.history.replaceState(null, '', basePath);
  HTMLDialogElement.prototype.showModal = function() { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function() { this.removeAttribute('open'); };
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Static demo')));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
test('All Coworker screens are React views and preserve global program scope', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Program', { exact: true }), { target: { value: 'Health' } });
  const m = coworkerFacts(selectScope(prepareSample(raw).data, { program: 'Health' }));
  for (const name of ['Coworker', 'Data Quality', 'Risk Scenarios', 'Executive Brief', 'Methodology']) {
    nav(name);
    expect(screen.getByRole('heading', { name, exact: true, level: 1 })).toBeTruthy();
    expect(screen.getByTestId('cw-progress').textContent).toBe(`${m.actual.toFixed(1)}%`);
    expect(screen.getByTestId('cw-spending').textContent).toBe(dollars(m.spent));
    expect(screen.getByText('12 projects in scope')).toBeTruthy();
  }
});
test('Quality sample applies globally and blocks brief review until corrected', () => {
  render(<App />); nav('Data Quality');
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
test('Scenario controls update results, matrix filters threats and project links open Project 360', () => {
  render(<App />); nav('Risk Scenarios');
  const original = screen.getByTestId('cw-gap').textContent;
  fireEvent.change(screen.getByRole('slider', { name: 'Funding reduction' }), { target: { value: 20 } });
  expect(screen.getByTestId('cw-gap').textContent).not.toBe(original);
  const cell = within(screen.getByRole('table', { name: 'Threat matrix' })).getAllByRole('button').find(b => !(b as HTMLButtonElement).disabled)!;
  fireEvent.click(cell);
  const count = Number(cell.textContent);
  expect(screen.getByRole('table', { name: 'Scenario threat register' }).querySelectorAll('tbody tr')).toHaveLength(count);
  fireEvent.click(within(screen.getByRole('table', { name: 'Project scenario results' })).getAllByRole('button')[0]);
  expect(screen.getByRole('dialog', { name: 'Project 360' })).toBeTruthy();
});
test('Evidence is inspectable and unsupported questions are explicitly refused', async () => {
  render(<App />); nav('Coworker');
  fireEvent.click(screen.getByRole('button', { name: 'CALC-PORTFOLIO · Verified scope figures' }));
  expect(screen.getByRole('dialog', { name: 'Evidence source' }).textContent).toContain('"projects": 48');
  fireEvent.click(screen.getByRole('button', { name: 'Close evidence source' }));
  fireEvent.change(screen.getByLabelText('Question for Coworker'), { target: { value: 'What is the weather?' } });
  fireEvent.click(screen.getByRole('button', { name: 'Ask Coworker', exact: true }));
  await waitFor(() => expect(screen.getByText(/I do not have evidence for that topic/)).toBeTruthy());
});
test('A late model response cannot overwrite a new filtered scope', async () => {
  let finish: (value: any) => void = () => {};
  vi.stubGlobal('fetch', vi.fn((url: string) => url.endsWith('api/status') ? Promise.resolve({ ok: true, json: async () => ({ local_server: true, provider: 'LM Studio', reachable: true, model_available: true }) }) : new Promise(resolve => { finish = resolve; })));
  render(<App />); nav('Coworker');
  await waitFor(() => expect((screen.getByLabelText('Use local AI') as HTMLInputElement).disabled).toBe(false));
  fireEvent.click(screen.getByLabelText('Use local AI')); fireEvent.click(screen.getByRole('button', { name: 'Ask Coworker', exact: true }));
  fireEvent.change(screen.getByLabelText('Program', { exact: true }), { target: { value: 'Health' } });
  finish({ ok: true, json: async () => ({ summary: 'STALE MODEL RESPONSE', actions: [], sources: [], mode: 'local_ai' }) });
  await waitFor(() => expect(screen.queryByText('STALE MODEL RESPONSE')).toBeNull());
  expect(screen.getByText('12 projects in scope')).toBeTruthy();
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
