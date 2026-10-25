import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { prepareSample, coworkerFacts, dollars, guidedAnswer } from '../../src/coworker-engine.mjs';
import { chooseFilter } from './filter-helpers';
const raw = JSON.parse(readFileSync(new URL('../../src/data/atlas-bundle.json', import.meta.url), 'utf8'));
const nav = async (page: any, name: string) => name === 'Coworker' ? page.getByRole('button', { name: 'Open Coworker' }).click() : page.getByRole('navigation').getByRole('button', { name, exact: true }).click();
test('Coworker waits for Ask, uses the whole portfolio and presents matching verified figures', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./'); await chooseFilter(page, 'Program', 'Health'); await nav(page, 'Coworker');
  const m = coworkerFacts(prepareSample(raw).data);
  await expect(page.locator('.filters')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Portfolio assessment' })).toHaveCount(0);
  await expect(page.getByLabel('Ask Coworker', { exact: true })).toHaveValue('Draft the quarterly brief');
  await expect(page.getByTestId('cw-progress')).toHaveText(`${m.actual.toFixed(1)}%`);
  await expect(page.getByTestId('cw-spending')).toHaveText(dollars(m.spent));
  await page.getByRole('button', { name: 'Which threats need follow-up?', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Portfolio assessment' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Ask Coworker', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Portfolio assessment' })).toBeVisible();
  await expect(page.getByText('Guided demo', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'CALC-PORTFOLIO', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Export current view', exact: true })).toHaveCount(0);
  await expect(page.getByText('Canonical dummy sample', { exact: true })).toHaveCount(0);
  await page.screenshot({ path: 'test-results/coworker-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});
test('Project filters persist in portfolio views while Coworker remains unfiltered', async ({ page }) => {
  await page.goto('./?view=data-quality'); await chooseFilter(page, 'Project', 'Watershed Futures');
  await nav(page, 'Coworker'); await expect(page.getByText('1 projects in scope')).toHaveCount(0);
  await nav(page, 'Projects'); await expect(page.getByRole('table', { name: 'Project directory' }).locator('tbody tr')).toHaveCount(1);
  await page.reload(); await expect(page.getByRole('combobox', { name: 'Project', exact: true })).toContainText('Watershed Futures');
});
test('Risks exposes only the register and gross financial impact with binary status', async ({ page }) => {
  await page.goto('./?view=risk-scenarios');
  await expect(page.getByRole('table', { name: 'Risks register' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Risk scenarios', exact: true })).toHaveCount(0);
  await chooseFilter(page, 'Risks status', 'Closed');
  const table = page.getByRole('table', { name: 'Risks register' });
  await expect(table.getByRole('columnheader', { name: /Financial impact if risk materializes/ })).toBeVisible();
  await expect(table.locator('tbody tr').first()).toContainText('Closed');
  await expect(page.getByRole('navigation').getByRole('button', { name: 'Issues', exact: true })).toHaveCount(0);
  await page.goto('./?view=issues'); await expect(page.getByRole('heading', { name: 'Risks', level: 1 })).toBeVisible();
});
test('LM Studio mode and fallback remain explicit', async ({ page }) => {
  await page.route('**/api/status', route => route.fulfill({ json: { local_server: true, provider: 'LM Studio', reachable: true, model_available: true, model: 'mock-browser-model' } }));
  const answer = guidedAnswer(prepareSample(raw).data, 'Draft the quarterly brief');
  await page.route('**/api/assistant', route => route.fulfill({ json: { ...answer, mode: 'local_ai', summary: 'A mocked local model narrative for integration testing.', note: 'Mock inference; human review required.' } }));
  await page.goto('./?view=coworker'); await page.getByLabel('Use local AI').check(); await page.getByRole('button', { name: 'Ask Coworker', exact: true }).click();
  await expect(page.getByText('Local AI · LM Studio', { exact: true })).toBeVisible();
  await expect(page.getByText('A mocked local model narrative for integration testing.')).toBeVisible();
  await page.route('**/api/assistant', route => route.fulfill({ json: { ...answer, fallback: true, note: 'The local model was unavailable; guided fallback.' } }));
  await page.getByRole('button', { name: 'Ask Coworker', exact: true }).click();
  await expect(page.getByText('Guided fallback', { exact: true })).toBeVisible();
});
test('Mobile Coworker and portfolio views fit the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('./');
  for (const name of ['Coworker', 'Risks', 'Deliverables', 'Staff', 'Financials', 'Funding Pipeline']) {
    await nav(page, name); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), name).toBe(true);
  }
  await nav(page, 'Coworker'); await page.screenshot({ path: 'test-results/coworker-mobile.png', fullPage: true });
});
