import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';
const raw = JSON.parse(readFileSync(new URL('../../src/data/atlas-bundle.json', import.meta.url), 'utf8'));
import { prepareSample, selectScope, coworkerFacts, dollars, guidedAnswer, scenario } from '../../src/coworker-engine.mjs';
const nav = async (page: any, name: string) => { if (name === 'Coworker') await page.getByRole('button', { name: 'Open Coworker' }).click(); else if (name === 'Risk Scenarios') { await page.getByRole('navigation').getByRole('button', { name: 'Risks', exact: true }).click(); await page.getByRole('button', { name: 'Risk scenarios', exact: true }).click(); } else await page.getByRole('navigation').getByRole('button', { name, exact: true }).click(); };

test('Coworker reporting, citations and XLSX exports reconcile with the dashboard', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await page.getByLabel('Program', { exact: true }).selectOption('Health');
  const data = selectScope(prepareSample(raw).data, { program: 'Health' });
  const m = coworkerFacts(data);
  await nav(page, 'Coworker');
  await expect(page.getByTestId('cw-progress')).toHaveText(`${m.actual.toFixed(1)}%`);
  await expect(page.getByTestId('cw-spending')).toHaveText(dollars(m.spent));
  await page.screenshot({ path: 'test-results/coworker-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'CALC-PORTFOLIO', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Evidence source' })).toContainText('"projects": 12');
  await page.keyboard.press('Escape');
  const workbookPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export current view', exact: true }).click();
  const workbookFile = await workbookPromise;
  const zip = unzipSync(readFileSync((await workbookFile.path())!));
  const xml = strFromU8(zip['xl/worksheets/sheet1.xml']);
  expect(xml).toContain(`<v>${m.spent}</v>`);
  expect(xml).toContain(`<v>${m.actual}</v>`);
  expect(errors).toEqual([]);
});

test('Hidden workspace routes and common project scope behave consistently', async ({ page }) => {
  await page.goto('./?view=data-quality');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The bigger picture.');
  await page.getByLabel('Project', { exact: true }).selectOption('ATL-P001');
  await nav(page, 'Coworker');
  await expect(page.getByText('1 projects in scope')).toBeVisible();
  const m = coworkerFacts(selectScope(prepareSample(raw).data, { project: 'ATL-P001' }));
  await expect(page.getByTestId('cw-progress')).toHaveText(`${m.actual.toFixed(1)}%`);
  await nav(page, 'Projects');
  await expect(page.getByRole('table', { name: 'Project directory' }).locator('tbody tr')).toHaveCount(1);
  await page.reload(); await expect(page.getByLabel('Project', { exact: true })).toHaveValue('ATL-P001');
});

test('Embedded scenario sliders, CSV and zero-progress projection limits work', async ({ page }) => {
  await page.goto('./'); await nav(page, 'Risk Scenarios');
  const baseline = await page.getByTestId('cw-gap').textContent();
  for (const [name, steps] of [['Funding reduction', 4], ['Capacity reduction', 5], ['Risk probability uplift', 10]] as const) {
    const slider = page.getByRole('slider', { name }); await slider.focus(); await slider.press('Home');
    for (let i = 0; i < steps; i++) await slider.press('ArrowRight');
  }
  await expect(page.getByTestId('cw-gap')).not.toHaveText(baseline!);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download scenario CSV' }).click();
  const file = await downloadPromise;
  const lines = readFileSync((await file.path())!, 'utf8').split('\n');
  expect(lines).toHaveLength(49);
  const parse = (line: string) => Array.from(line.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g), match => match[1].replaceAll('""', '"'));
  const keys = parse(lines[0]);
  const rows = lines.slice(1).map(line => Object.fromEntries(parse(line).map((value, index) => [keys[index], value])));
  const sim = scenario(prepareSample(raw).data, { fundingCut: .2, capacityCut: .25, probabilityUplift: .5 });
  expect(rows.reduce((sum, row) => sum + Number(row.fundingGap), 0)).toBeCloseTo(sim.fundingGap, 6);
  expect(Number(rows[0].expectedLoss)).toBe(sim.rows[0].expectedLoss);
  expect(rows[0]).toMatchObject({ fundingReductionPct: '20', capacityReductionPct: '25', probabilityUpliftPct: '50', currency: 'USD', snapshot: raw.meta.asOf, disclaimer: raw.meta.disclaimer });
  expect(rows.filter(row => row.execution === '')).toHaveLength(4);
  await expect(page.getByTestId('cw-gap')).toHaveText(`${dollars(sim.fundingGap)}${dollars(sim.baselineFundingGap)} baseline`);
  const workbookPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export current view', exact: true }).click();
  const workbook = await workbookPromise;
  const workbookFiles = unzipSync(readFileSync((await workbook.path())!));
  const xml = strFromU8(workbookFiles['xl/worksheets/sheet1.xml']);
  expect(xml).toContain(`<v>${sim.rows[0].expectedLoss}</v>`);
  expect(xml).toContain(`<v>${sim.rows[0].fundingGap}</v>`);
  expect(strFromU8(workbookFiles['xl/sharedStrings.xml'])).toContain('fundingReductionPct');
  await expect(page.getByRole('table', { name: 'Threat matrix' })).toHaveCount(0);
  await page.getByLabel('Project status', { exact: true }).selectOption('Planned');
  await expect(page.getByText('0/4 projects have a cost projection.', { exact: false })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Project scenario results' })).toContainText('Not projected');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/coworker-scenario.png', fullPage: true });
});

test('LM Studio mode is explicit and its narrative reaches Coworker', async ({ page }) => {
  await page.route('**/api/status', route => route.fulfill({ json: { local_server: true, provider: 'LM Studio', reachable: true, model_available: true, model: 'mock-browser-model' } }));
  const answer = guidedAnswer(prepareSample(raw).data, 'Draft the quarterly brief');
  await page.route('**/api/assistant', route => route.fulfill({ json: { ...answer, mode: 'local_ai', summary: 'A mocked local model narrative for integration testing.', note: 'Mock inference; human review required.' } }));
  await page.goto('./'); await nav(page, 'Coworker');
  await page.getByLabel('Use local AI').check();
  await page.getByRole('button', { name: 'Ask Coworker', exact: true }).click();
  await expect(page.getByText('Local AI · LM Studio', { exact: true })).toBeVisible();
  await expect(page.getByText('A mocked local model narrative for integration testing.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Local model connection' })).toBeVisible();
});

test('Mobile Coworker screens remain readable without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('./');
  for (const name of ['Coworker', 'Risk Scenarios', 'Deliverables']) {
    await nav(page, name);
    await expect(page.getByRole('heading', { level: 1, name: name === 'Risk Scenarios' ? 'Risks' : name, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
  await nav(page, 'Coworker'); await page.screenshot({ path: 'test-results/coworker-mobile.png', fullPage: true });
});
