const chooseFilter = (label: string, option: string) => { fireEvent.click(screen.getByRole("combobox", { name: label, exact: true })); fireEvent.click(screen.getByRole("option", { name: option, exact: true })); fireEvent.click(screen.getByRole("button", { name: "Done", exact: true })); };
import React from 'react';
import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import { render, screen, within, fireEvent, cleanup } from '@testing-library/react';
import { App } from '../src/main';
import data from '../src/data/atlas-bundle.json';
import { deliveryRowsAt } from '../src/delivery-history.mjs';
import { createWorkbookSheets, createWorkbookOptions } from '../src/exports';
import writeExcelFile from 'write-excel-file/node';
import { unzipSync, strFromU8 } from 'fflate';
beforeEach(() => {
  window.history.replaceState(null,'','/business-intelligence-hub/');
  HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('Static demo')));
  vi.stubGlobal('scrollTo',vi.fn());
});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
const nav=(name:string)=>fireEvent.click(within(screen.getByRole('navigation')).getByRole('button',{name,exact:true}));
test('Navigation is compact, optional routes are hidden, and Coworker has a dedicated header entry',()=>{
  render(<App/>);
  expect(within(screen.getByRole('navigation')).getAllByRole('button').map(b=>b.textContent?.trim())).toEqual(['Overview','Projects','Deliverables','Staff','Financials','Funding Pipeline','Risks','Issues']);
  fireEvent.click(screen.getByRole('button',{name:'Open Coworker'}));
  expect(screen.getByRole('heading',{name:'Coworker',level:1})).toBeTruthy();
  expect(screen.queryByText('Data checks passed; human review remains')).toBeNull();
  expect(screen.queryByText('Sources you can inspect')).toBeNull();
  expect(screen.getByRole('heading',{name:'Local model connection'})).toBeTruthy();
  expect(screen.getByLabelText('Use local AI')).toBeTruthy();
  for(const route of ['data-quality','executive-brief','methodology']){
    cleanup();window.history.replaceState(null,'',`?view=${route}&sample=defects`);render(<App/>);
    expect(screen.getByRole('heading',{level:1}).textContent).toBe('The bigger picture.');
  }
});
test('Global filters have the requested order and office labels, including compatible old URLs',()=>{
  window.history.replaceState(null,'','?office=Europe%20Hub');render(<App/>);
  expect(screen.getByLabelText('Leading office').textContent).toContain('Europe');
  const filters=document.querySelector('.filters')!;
  expect(within(filters as HTMLElement).getAllByRole('combobox').map(s=>s.getAttribute('aria-label'))).toEqual(['Program','Project','Leading office','Project status']);
  fireEvent.click(screen.getByLabelText('Leading office')); expect(screen.getAllByRole('option').map(o=>o.textContent?.replace('✓',''))).toEqual(['All offices','Americas','Europe','Africa','South Asia','East Asia','Oceania']);
});
test('Risks and Issues show only the register, including compatible old scenario URLs',()=>{
  window.history.replaceState(null,'','?view=risk-scenarios');render(<App/>);
  expect(screen.getByRole('table',{name:'Risks register'})).toBeTruthy();
  expect(screen.queryByRole('button',{name:'Risk scenarios',exact:true})).toBeNull();
  expect(screen.queryByRole('slider',{name:'Funding reduction'})).toBeNull();
  nav('Issues');expect(screen.getByLabelText('Issues status')).toBeTruthy();
});
test('Quarter labels and ribbon keyboard selection scope the register, KPIs and typed exports to the same date',()=>{
  render(<App/>);nav('Deliverables');
  fireEvent.click(screen.getByRole('button',{name:'Filter active deliverables at Q2 2026 (2026-06-30)',exact:true}));
  const rows=deliveryRowsAt(data.deliverables,'2026-06-30',data.meta.asOf);
  expect(screen.getByText('Deliverables',{exact:true,selector:'.kpi-label'}).closest('button')!.querySelector('strong')!.textContent).toBe(String(rows.filter(r=>r.status==='Active').length));
  fireEvent.keyDown(screen.getByRole('button',{name:'Filter ribbon Closed'}),{key:'Enter'});
  const complete=rows.filter(r=>r.status==='Closed');
  expect(screen.getByLabelText('Deliverable status').textContent).toContain('Closed');
  expect(screen.getByText('Deliverables',{exact:true,selector:'.kpi-label'}).closest('button')!.querySelector('strong')!.textContent).toBe(String(complete.length));
  expect(new URL(window.location.href).searchParams.get('deliverable-cut')).toBe('2026-06-30');
  const workbook=createWorkbookSheets(complete,'Deliverables as of 2026-06-30');
  expect(workbook[0].data.length).toBe(complete.length+1);
  const keys=Object.keys(complete[0]);expect(workbook[0].data[1][keys.indexOf('cutoffDate')]).toBe('2026-06-30');
  fireEvent.click(screen.getByRole('button',{name:'Return to current snapshot ×'}));
  expect(screen.getByText('Deliverables',{exact:true,selector:'.kpi-label'}).closest('button')!.querySelector('strong')!.textContent).toBe('288');
});
test('Deliverables starts with KPIs, then paired charts, the compact ribbon, and the register',()=>{
  render(<App/>);nav('Deliverables');
  const kpis=document.querySelector('.kpi-grid')!;
  const controls=screen.getByLabelText('Deliverable status');
  const status=screen.getByRole('heading',{name:'Deliverables by status'}).closest('.chart-grid')!;
  const program=screen.getByRole('heading',{name:'Deliverables by program'}).closest('.chart-grid')!;
  const ribbon=screen.getByRole('img',{name:'Quarterly deliverable evolution'});
  const panel=ribbon.closest('section')!;
  const table=screen.getByRole('table',{name:'Deliverable register'});
  const before=(a:Element,b:Element)=>expect(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  before(controls,kpis);before(kpis,status);before(status,panel);before(panel,table);
  expect(status).toBe(program);expect(panel.parentElement).toBe(status.parentElement);
  expect(ribbon.getAttribute('viewBox')?.split(' ')[3]).toBe('260');
  expect(screen.queryByText('Quarterly deliverable status ribbon')).toBeNull();
  expect(panel.querySelector('.chart-caption')).toBeNull();
  expect(panel.textContent).not.toContain('Quarter-end cuts');
  expect(panel.textContent).toContain('Simulated');
});
const readXml=(zip:Record<string,Uint8Array>,path:string)=>new DOMParser().parseFromString(strFromU8(zip[path]),'application/xml');
const cellText=(zip:Record<string,Uint8Array>,cell:Element)=>{
  const value=cell.querySelector('v')?.textContent || '';
  return cell.getAttribute('t')==='s' ? readXml(zip,'xl/sharedStrings.xml').querySelectorAll('si')[Number(value)].textContent : value;
};
async function savedWorkbook(rows:Record<string,unknown>[],name='Validation'){
  const sheets=createWorkbookSheets(rows,name);
  return unzipSync(await writeExcelFile(sheets,createWorkbookOptions(sheets)).toBuffer());
}
function checkHeader(zip:Record<string,Uint8Array>,ref:string){
  const sheet=readXml(zip,'xl/worksheets/sheet1.xml');
  const styles=readXml(zip,'xl/styles.xml');
  expect(sheet.getElementsByTagName('parsererror').length).toBe(0);
  expect(sheet.querySelector('autoFilter')?.getAttribute('ref')).toBe(ref);
  expect(sheet.querySelectorAll('autoFilter').length).toBe(1);
  expect(readXml(zip,'xl/worksheets/sheet2.xml').querySelector('autoFilter')).toBeNull();
  expect(sheet.querySelector('pane')?.getAttribute('ySplit')).toBe('1');
  expect(sheet.querySelector('sheetData')!.compareDocumentPosition(sheet.querySelector('autoFilter')!)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  for(const cell of Array.from(sheet.querySelector('row[r="1"]')!.children)){
    const style=styles.querySelector('cellXfs')!.children[Number(cell.getAttribute('s'))];
    const font=styles.querySelector('fonts')!.children[Number(style.getAttribute('fontId'))];
    const fill=styles.querySelector('fills')!.children[Number(style.getAttribute('fillId'))];
    expect(font.querySelector('color')?.getAttribute('rgb')?.toUpperCase()).toBe('FFFFFFFF');
    expect(font.querySelector('b')).toBeTruthy();
    expect(fill.querySelector('fgColor')?.getAttribute('rgb')?.toUpperCase()).toBe('FF173D36');
  }
  return sheet;
}
test('Saved XLSX has white headers and filters over every selected historical record without changing numbers',async()=>{
  const rows=deliveryRowsAt(data.deliverables,'2026-06-30',data.meta.asOf).filter(r=>r.status==='Closed');
  const zip=await savedWorkbook(rows,'Deliverables as of 2026-06-30');
  // Historical export has 21 columns; extent follows the selected rows.
  const sheet=checkHeader(zip,`A1:U${rows.length+1}`);
  expect(sheet.querySelectorAll('sheetData > row').length).toBe(rows.length+1);
  const keys=Object.keys(rows[0]);
  expect(Array.from(sheet.querySelector('row[r="1"]')!.children).map(cell=>cellText(zip,cell))).toEqual(keys);
  for(const [i,row] of rows.entries()){
    const cells=Array.from(sheet.querySelector(`row[r="${i+2}"]`)!.children);
    for(const [j,key] of keys.entries()) if(typeof row[key]==='number'){
      expect(cells[j].getAttribute('t')).not.toBe('s');
      expect(Number(cells[j].querySelector('v')!.textContent)).toBe(row[key]);
    }
  }
  const about=readXml(zip,'xl/worksheets/sheet2.xml');
  expect(cellText(zip,about.querySelector('c[r="B7"]')!)).toBe('2026-06-30');
});
test('Saved XLSX filters cover columns after Z, financial precision, and the empty-result message',async()=>{
  const wide=Object.fromEntries(Array.from({length:28},(_,i)=>[`Field ${i+1}`,i===0?0:i===1?6703756.25:i===2?-7:i]));
  const wideSheet=checkHeader(await savedWorkbook([wide]),'A1:AB2');
  expect(Number(wideSheet.querySelector('c[r="B2"] v')!.textContent)).toBe(6703756.25);
  expect(Number(wideSheet.querySelector('c[r="A2"] v')!.textContent)).toBe(0);
  expect(Number(wideSheet.querySelector('c[r="C2"] v')!.textContent)).toBe(-7);
  const emptyZip=await savedWorkbook([]);
  const empty=checkHeader(emptyZip,'A1:A2');
  expect(empty.querySelectorAll('sheetData > row').length).toBe(2);
  expect(cellText(emptyZip,empty.querySelector('c[r="A2"]')!)).toBe('No records match the current filters.');
});
test('Chart exports are PNG only, project budgets are a second chart, and footer returns to Overview',()=>{
  render(<App/>);expect(screen.queryByRole('button',{name:/as SVG/})).toBeNull();
  expect(screen.queryByRole('button',{name:'Back to Overview ↗'})).toBeNull();
  nav('Projects');expect(screen.getByRole('img',{name:'Project progress tracker'})).toBeTruthy();expect(screen.getByRole('img',{name:'Budget by delivery status'})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Filter Health Behind schedule'}));
  expect(screen.getByLabelText('Program',{exact:true}).textContent).toContain('Health');expect(screen.getByLabelText('Schedule').textContent).toContain('Behind schedule');
  fireEvent.click(screen.getByRole('button',{name:'Back to Overview ↗'}));expect(screen.getByRole('heading',{level:1}).textContent).toBe('The bigger picture.');
});

test('Multiple programs and offices combine, persist in the URL, remove individually and reset',()=>{
  render(<App/>); nav('Projects');
  fireEvent.click(screen.getByRole('combobox',{name:'Program',exact:true}));
  fireEvent.click(screen.getByRole('option',{name:'Health',exact:true}));
  fireEvent.click(screen.getByRole('option',{name:'Education',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'Done',exact:true}));
  chooseFilter('Leading office','Americas'); chooseFilter('Project status','Active');
  const expected=data.projects.filter(p=>['Health','Education'].includes(p.program)&&p.office==='Americas'&&p.status==='Active');
  expect(screen.getByText(`${expected.length} projects in scope`)).toBeTruthy();
  expect(new URL(window.location.href).searchParams.getAll('program')).toEqual(['Health','Education']);
  fireEvent.click(screen.getByRole('button',{name:'Remove Program: Health'}));
  expect(screen.getByText('2 projects in scope')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:/Reset filters/}));
  expect(screen.queryByLabelText('Active filters')).toBeNull();expect(screen.getByText('48 projects in scope')).toBeTruthy();
});
test('Requested program and status charts are pies and the simplified columns are absent',()=>{
  render(<App/>);
  for(const [view,title] of [['Deliverables','Deliverables by program'],['Staff','Staff by Program'],['Financials','Budget by program'],['Funding Pipeline','Requested amount by program'],['Risks','Risks by status'],['Issues','Issues by status']]){
    nav(view);expect(screen.getByRole('img',{name:title}).closest('.pie-panel')).toBeTruthy();
  }
  nav('Projects');const projects=screen.getByRole('table',{name:'Project directory'});
  expect(within(projects).queryByRole('columnheader',{name:/Exposure|Expected consequences/})).toBeNull();
  nav('Staff');const staff=screen.getByRole('table',{name:'Staff allocations'});
  expect(within(staff).queryByRole('columnheader',{name:/FTE|Hours/})).toBeNull();
});
test('Risk financial impact displays gross loss and exports contain only dummy terminology',async()=>{
  render(<App/>);nav('Risks');
  const risk=data.risks.find(r=>r.kind==='Risk')!;
  const row=screen.getByRole('table',{name:'Risks register'}).querySelector('tbody tr')!;
  expect(row.textContent).toContain(new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(risk.lossUsd));
  const sheets=createWorkbookSheets(data.risks,'Risks');
  const zip=unzipSync(await writeExcelFile(sheets,createWorkbookOptions(sheets)).toBuffer());
  expect(Object.values(zip).map(strFromU8).join('')).not.toMatch(/synthetic/i);
});
