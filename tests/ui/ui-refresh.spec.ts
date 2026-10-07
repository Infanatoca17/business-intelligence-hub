import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';
import { deliveryRowsAt } from '../../src/delivery-history.mjs';
const data=JSON.parse(readFileSync(new URL('../../src/data/atlas-bundle.json',import.meta.url),'utf8'));
test('Desktop KPI rows, centered navigation, two project charts, toggle and footer match the refreshed layout',async({page})=>{
  await page.goto('./');
  const nav=page.getByRole('navigation');await expect(nav.getByRole('button')).toHaveCount(8);
  const bounds=await nav.getByRole('button').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{left:r.left,right:r.right};}));
  const center=(bounds[0].left+bounds.at(-1)!.right)/2;expect(Math.abs(center-720)).toBeLessThan(3);
  const top=await page.locator('.overview-kpis .kpi').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().top));expect(new Set(top).size).toBe(1);expect(top).toHaveLength(6);
  await expect(page.locator('.filters select')).toHaveCount(4);
  await expect(page.getByRole('button',{name:'Back to Overview ↗'})).toHaveCount(0);
  await nav.getByRole('button',{name:'Projects',exact:true}).click();
  const left=await page.getByRole('img',{name:'Project progress tracker'}).boundingBox(),right=await page.getByRole('img',{name:'Budget by delivery status'}).boundingBox();expect(Math.abs(left!.width-right!.width)).toBeLessThan(2);expect(Math.abs(left!.y-right!.y)).toBeLessThan(45);
  await nav.getByRole('button',{name:'Financials',exact:true}).click();
  const financeTop=await page.locator('.financial-kpis .kpi').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().top));expect(new Set(financeTop).size).toBe(1);expect(financeTop).toHaveLength(5);
  await nav.getByRole('button',{name:'Risks',exact:true}).click();await expect(page.getByLabel('Risks status')).toBeVisible();
  await page.getByRole('button',{name:'Risk scenarios',exact:true}).click();await expect(page.getByRole('slider',{name:'Funding reduction'})).toBeVisible();await expect(page.getByRole('table',{name:'Threat matrix'})).toHaveCount(0);
  await page.getByRole('button',{name:'Back to Overview ↗'}).click();await expect(page.getByRole('heading',{level:1})).toHaveText('The bigger picture.');
  await page.screenshot({path:'test-results/overview-v1.2.0.png',fullPage:true});
});
test('Quarterly ribbon selections persist, label simulations and export exactly the selected historical rows',async({page})=>{
  await page.goto('./?view=deliverables');
  const statusChart=await page.getByRole('heading',{name:'Deliverables by status'}).locator('xpath=ancestor::section').boundingBox();
  const programChart=await page.getByRole('heading',{name:'Deliverables by program'}).locator('xpath=ancestor::section').boundingBox();
  const ribbonPanel=page.locator('.delivery-ribbon-panel');
  const ribbonBounds=await ribbonPanel.boundingBox();
  const tableBounds=await page.getByRole('table',{name:'Deliverable register'}).boundingBox();
  const kpiBottom=await page.locator('.kpi').evaluateAll(nodes=>Math.max(...nodes.map(n=>n.getBoundingClientRect().bottom)));
  expect(kpiBottom).toBeLessThan(statusChart!.y);
  expect(ribbonBounds!.y).toBeGreaterThanOrEqual(Math.max(statusChart!.y+statusChart!.height,programChart!.y+programChart!.height));
  expect(ribbonBounds!.y+ribbonBounds!.height).toBeLessThan(tableBounds!.y);
  expect(ribbonBounds!.width).toBeGreaterThan(statusChart!.width*1.9);
  expect(ribbonBounds!.height).toBeLessThan(540);
  await expect(page.getByRole('img',{name:'Quarterly deliverable evolution'})).toHaveAttribute('viewBox',/ 260$/);
  await expect(ribbonPanel.locator('.chart-caption')).toHaveCount(0);
  // Exercise real pointer clicks on every date label, including labels above
  // dense ribbons and simulated cuts. No forced click or extended timeout.
  const quarters = page.getByRole('button', {name:/^Filter all deliverables at /});
  const labels = await quarters.evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label')!));
  for (const label of labels) {
    const date = label.match(/\((\d{4}-\d{2}-\d{2})\)/)![1];
    await page.getByRole('button', {name:label,exact:true}).click();
    await expect(page).toHaveURL(new RegExp(`deliverable-cut=${date}`));
    await expect(page.getByLabel('Deliverable status', {exact:true})).toHaveValue('All');
    await expect(page.locator('.kpi').filter({has:page.locator('.kpi-label',{hasText:/^Deliverables$/})}).locator('strong')).toHaveText(String(deliveryRowsAt(data.deliverables,date,data.meta.asOf).length));
  }
  await page.getByRole('button',{name:'Filter all deliverables at Q2 2026 (2026-06-30)',exact:true}).click();
  await page.getByRole('button',{name:'Filter ribbon Complete'}).focus();await page.keyboard.press('Enter');
  const rows=deliveryRowsAt(data.deliverables,'2026-06-30',data.meta.asOf).filter(r=>r.status==='Complete');
  await expect(page.locator('.kpi').filter({has:page.locator('.kpi-label',{hasText:/^Deliverables$/})}).locator('strong')).toHaveText(String(rows.length));
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export current view',exact:true}).click();
  const file=await download,zip=unzipSync(readFileSync((await file.path())!)),xml=strFromU8(zip['xl/worksheets/sheet1.xml']);expect((xml.match(/<row\b/g)||[]).length).toBe(rows.length+1);expect(Object.values(zip).map(strFromU8).join('')).toContain('2026-06-30');
  expect(xml).toContain(`<autoFilter ref="A1:U${rows.length+1}"`);
  expect(strFromU8(zip['xl/styles.xml']).toUpperCase()).toContain('RGB="FFFFFFFF"');
  await page.reload();await expect(page.getByRole('status')).toContainText('30 Jun 2026');
  await page.getByRole('button',{name:/Filter all deliverables at Q4 2026/}).click();await expect(page.getByRole('status')).toContainText('Synthetic simulation');
  await page.getByRole('button',{name:'Return to current snapshot ×'}).click();await expect(page.getByRole('status')).toContainText(/22 Sep(?:t)? 2026/);
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  await page.getByRole('button',{name:'Filter all deliverables at Q2 2026 (2026-06-30)',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('30 Jun 2026');
  await page.screenshot({path:'test-results/deliverables-v1.2.0-mobile.png',fullPage:true});
});
