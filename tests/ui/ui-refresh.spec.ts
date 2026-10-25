import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';
import { deliveryRowsAt } from '../../src/delivery-history.mjs';
import { chooseFilter } from './filter-helpers';
const data = JSON.parse(readFileSync(new URL('../../src/data/atlas-bundle.json', import.meta.url), 'utf8'));
test('Desktop rounded cards, integrated charts and moved filters match the requested layout', async ({page}) => {
  await page.goto('./');
  const nav = page.getByRole('navigation'); await expect(nav.getByRole('button')).toHaveCount(7);
  const bounds = await nav.getByRole('button').evaluateAll(nodes => nodes.map(n => { const r=n.getBoundingClientRect();return {left:r.left,right:r.right}; }));
  expect(Math.abs((bounds[0].left+bounds.at(-1)!.right)/2 - 720)).toBeLessThan(3);
  expect(new Set(await page.locator('.overview-kpis .kpi').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().top))).size).toBe(1);
  expect(await page.locator('.kpi').first().evaluate(n=>parseFloat(getComputedStyle(n).borderRadius))).toBeGreaterThanOrEqual(20);
  await nav.getByRole('button',{name:'Projects',exact:true}).click();
  await expect(page.locator('.filters').getByRole('combobox',{name:'Schedule',exact:true})).toBeVisible();
  const left = await page.getByRole('img',{name:'Project progress tracker'}).boundingBox(), right = await page.getByRole('img',{name:'Budget by delivery status'}).boundingBox();
  expect(Math.abs(left!.width-right!.width)).toBeLessThan(2);
  await nav.getByRole('button',{name:'Financials',exact:true}).click(); await expect(page.locator('.financial-kpis .kpi')).toHaveCount(4);
  await expect(page.locator('.pie-panel').getByRole('img',{name:'Budget by program'})).toBeVisible();
  await page.getByRole('button',{name:'Back to Overview ↗'}).click();
  await page.screenshot({path:'test-results/overview-refreshed.png',fullPage:true});
});
test('Quarter markers, ribbon categories and XLSX export share the selected cutoff and status', async ({page}) => {
  await page.goto('./?view=deliverables');
  const quarters = page.getByRole('button',{name:/^Filter active deliverables at /});
  const labels = await quarters.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label')!));
  for(const label of labels) {
    const date=label.match(/\((\d{4}-\d{2}-\d{2})\)/)![1]; await page.getByRole('button',{name:label,exact:true}).click();
    await expect(page).toHaveURL(new RegExp(`deliverable-cut=${date}`));
    const rows=deliveryRowsAt(data.deliverables,date,data.meta.asOf).filter(r=>r.status==='Active');
    await expect(page.locator('.kpi').filter({has:page.locator('.kpi-label',{hasText:/^Deliverables$/})}).locator('strong')).toHaveText(String(rows.length));
  }
  await page.getByRole('button',{name:'Filter active deliverables at Q2 2026 (2026-06-30)',exact:true}).click();
  await page.getByRole('button',{name:'Filter ribbon Closed'}).focus(); await page.keyboard.press('Enter');
  const rows=deliveryRowsAt(data.deliverables,'2026-06-30',data.meta.asOf).filter(r=>r.status==='Closed');
  const download=page.waitForEvent('download'); await page.getByRole('button',{name:'Export current view',exact:true}).click();
  const zip=unzipSync(readFileSync((await (await download).path())!)), xml=strFromU8(zip['xl/worksheets/sheet1.xml']);
  expect((xml.match(/<row\b/g)||[]).length).toBe(rows.length+1);expect(xml).toContain(`<autoFilter ref="A1:U${rows.length+1}"`);
  await page.reload(); await expect(page.getByLabel('Deliverable status',{exact:true})).toContainText('Closed');
  await page.getByRole('button',{name:/Filter active deliverables at Q4 2026/}).click();await expect(page.getByRole('status')).toContainText('Dummy simulation');
  await page.getByRole('button',{name:'Return to current snapshot ×'}).click();
  await page.setViewportSize({width:390,height:844}); expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  await page.screenshot({path:'test-results/deliverables-mobile.png',fullPage:true});
});
test('Multiselect combines options, survives reload and exports exactly its intersection', async ({page}) => {
  await page.goto('./?view=projects');
  await page.getByRole('combobox',{name:'Program',exact:true}).click();
  await page.getByRole('option',{name:'Health',exact:true}).click(); await page.getByRole('option',{name:'Education',exact:true}).click();
  await page.getByRole('button',{name:'Done',exact:true}).click();
  await chooseFilter(page,'Leading office','Americas'); await chooseFilter(page,'Project status','Closed');
  const expected=data.projects.filter(p=>['Health','Education'].includes(p.program)&&p.office==='Americas'&&p.status==='Closed');
  // Closed projects occupy offices South Asia and East Asia; this intersection is intentionally empty.
  expect(expected).toHaveLength(0); await expect(page.getByText('No records match these filters. Clear a filter to explore the portfolio.')).toBeVisible();
  await page.getByRole('button',{name:'Remove Office: Americas'}).click();
  const remaining=data.projects.filter(p=>['Health','Education'].includes(p.program)&&p.status==='Closed');
  await expect(page.getByRole('table',{name:'Project directory'}).locator('tbody tr')).toHaveCount(remaining.length);
  await page.reload(); await expect(page.getByRole('combobox',{name:'Program',exact:true})).toContainText('2 selected');
  expect(new URL(page.url()).searchParams.getAll('program')).toEqual(['Health','Education']);
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export current view',exact:true}).click();
  const zip=unzipSync(readFileSync((await (await download).path())!));expect((strFromU8(zip['xl/worksheets/sheet1.xml']).match(/<row\b/g)||[])).toHaveLength(remaining.length+1);
  await expect(page.locator('.reset')).toHaveClass(/reset-active/); await page.locator('.reset').click();
  await expect(page.getByLabel('Active filters')).toHaveCount(0); await expect(page.locator('.kpi').filter({has:page.locator('.kpi-label',{hasText:/^Total projects$/})}).locator('strong')).toHaveText('48');
});
test('Dropdowns support keyboard selection and stay inside a narrow viewport',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('./?view=projects');
  const program=page.getByRole('combobox',{name:'Program',exact:true});await program.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('Space');await page.keyboard.press('Escape');
  await expect(program).toBeFocused();await expect(program).toContainText('Sustainability');
  for(const label of ['Program','Project','Leading office','Project status','Schedule']) {
    await page.getByRole('combobox',{name:label,exact:true}).click();const box=await page.locator('.filter-popover').boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(391);await page.keyboard.press('Escape');
  }
});
