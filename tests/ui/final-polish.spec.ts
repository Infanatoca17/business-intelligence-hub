import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { chooseFilter } from './filter-helpers';
const data = JSON.parse(readFileSync(new URL('../../src/data/atlas-bundle.json', import.meta.url), 'utf8'));

test('Filters have equal insets in every tab and Review delivery opens the filtered directory at the top', async ({ page }) => {
  await page.goto('./');
  for (const name of ['Overview', 'Projects', 'Deliverables', 'Staff', 'Financials', 'Funding Pipeline', 'Risks']) {
    await page.getByRole('navigation').getByRole('button', { name, exact: true }).click();
    await expect(page.locator('.scope-count')).toHaveCount(0);
    const layout = await page.locator('.filters').evaluate(bar => {
      const frame = bar.getBoundingClientRect(), first = bar.firstElementChild!.getBoundingClientRect(), last = bar.lastElementChild!.getBoundingClientRect();
      return { left: first.left - frame.left, right: frame.right - last.right, top: first.top - frame.top, bottom: frame.bottom - first.bottom };
    });
    expect(layout.left).toBeGreaterThan(15); expect(Math.abs(layout.left - layout.right), name).toBeLessThan(1);
    expect(Math.abs(layout.top - layout.bottom), name).toBeLessThan(1);
  }
  await page.getByRole('navigation').getByRole('button', { name: 'Overview', exact: true }).click();
  await expect(page.getByText('Mean of Project Exposure to Threats', { exact: true })).toBeVisible();
  await expect(page.getByText('Risk financial impact', { exact: true })).toBeVisible();
  await expect(page.getByText('Based on current estimates · USD', { exact: true })).toBeVisible();
  await chooseFilter(page, 'Program', 'Health');
  const button = page.getByRole('button', { name: 'Review delivery', exact: false });
  await button.scrollIntoViewIfNeeded(); expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  await button.click();
  await expect(page.getByRole('heading', { name: 'Projects', level: 1 })).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByRole('combobox', { name: 'Program', exact: true })).toContainText('Health');
  await expect(page.getByRole('combobox', { name: 'Schedule', exact: true })).toContainText('Behind schedule');
  const expected = data.projects.filter(p => p.program === 'Health' && p.schedule === 'Behind schedule').length;
  await expect(page.locator('.kpi').filter({ has: page.locator('.kpi-label', { hasText: /^Total projects$/ }) }).locator('strong')).toHaveText(String(expected));
});

for (const size of [{ width: 1366, height: 768 }, { width: 1280, height: 720 }, { width: 1366, height: 640 }]) {
  test(`Coworker figures and all example prompts fit the initial ${size.width}x${size.height} view`, async ({ page }) => {
    await page.setViewportSize(size); await page.goto('./?view=coworker');
    await expect(page.locator('.cw-toolbar')).toHaveCount(0);
    await expect(page.getByText('A successful response labelled Local AI confirms inference. Model listing alone does not.', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Export current view', exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    for (const element of [...await page.locator('.cw-facts > div').all(), page.getByLabel('Ask Coworker', { exact: true }), ...await page.locator('.cw-prompts button').all()]) {
      const box = await element.boundingBox(); expect(box!.y).toBeGreaterThanOrEqual(0); expect(box!.y + box!.height).toBeLessThanOrEqual(size.height);
    }
    await expect(page.locator('.cw-prompts button')).toHaveCount(4);
    await expect(page.getByRole('heading', { name: 'Portfolio assessment' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Draft the quarterly brief', exact: true }).click();
    await page.getByRole('button', { name: 'Ask Coworker', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Portfolio assessment' })).toBeVisible();
    // The answer may extend the page; scrolling remains available for generated text.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
