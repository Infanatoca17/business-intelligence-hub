# Atlas UI validation walkthrough — 25 October 2026

Snapshot: **22 September 2026**, period **Q3 2026**, currency **USD**. Use Reset filters and the current snapshot for reference figures.

## Navigation, appearance and filters

- Banner: **Independent Demo | All Data is Dummy Data | About the Data**.
- Seven main views (Issues removed); Coworker opens from the header. Rounded KPI cards, borderless soft chart surfaces and rounded multiselect controls.
- Global filters: **Program → Project → Leading office → Project status**. Schedule, Deliverable status or Opportunity stage follows in the main filter bar where applicable.
- Select Health and Education together, then select an office and status. Options within a criterion combine with OR; criteria combine with AND. Check matching cards, charts, rows and workbook.
- The former project-count label is absent; filters and reset have equal left/right insets inside the rounded frame.
- Active controls show a colored dot and tint. Remove an individual active-filter chip; use the prominent Reset filters to clear all criteria.
- Reload: all selected criteria and the quarter cutoff persist. Old single-value URLs and office names ending in Hub still work.
- At 390 px, open each dropdown, navigate by keyboard, select values and close with Escape. Controls and popup must remain inside the viewport; tables/ribbon scroll within their panels. At 1440 px, Overview has six KPI cards, Financials four, Staff and Funding three.

## Reference figures

| Measure | All programs | Health |
|---|---:|---:|
| Total / active / closed projects | 48 / 40 / 8 | 12 / 10 / 2 |
| Deliverable-derived progress | 63.8% | 65.8% |
| Expected progress | 64% | 64% |
| Approved budget | $36,370,000.00 | $8,955,000.00 |
| Spending | $23,373,194.00 | $5,718,190.00 |
| Closed / total deliverables | 165 / 288 | 42 / 72 |
| Overdue active deliverables | 15 | 4 |
| Active risks / issues | 71 / 36 | 18 / 9 |
| Exposure index | 43.1 / 100 | 42.4 / 100 |
| Expected financial impact | $5,650,105.00 | $1,494,812.50 |

Coworker always uses All programs; Health figures apply to portfolio tabs. Eight closed projects have 100% complete deliverables and closed threats. Four future-start Active projects retain zero progress/spending. Record counts, IDs and formulas are preserved; the new examples intentionally change results.

1. Select Health, scroll to Review delivery and click it. Projects must open at scroll position zero with Health and Behind schedule selected. Schedule remains in the Projects filter bar.
   Overview uses Mean of Project Exposure to Threats, Risk financial impact and Based on current estimates · USD.
2. Open Project 360 and reconcile actual progress to its six deliverables.
3. Check Total projects and the simplified Project directory; removed exposure/consequence columns are absent.
4. Inspect pie charts in Deliverables, Staff, Financials, Funding and Risks. Staff by Program counts people; financial/funding pies sum USD.
5. Select Closed projects and check all four programs have two examples each.

## Quarterly deliverables

| Cut | Existing | Active | Closed | Mode |
|---|---:|---:|---:|---|
| Q4 2025 — 2025-12-31 | 120 | 120 | 0 | Dummy history |
| Q1 2026 — 2026-03-31 | 264 | 244 | 20 | Dummy history |
| Q2 2026 — 2026-06-30 | 264 | 169 | 95 | Dummy history |
| Q3 2026 — 2026-09-30 | 288 | 123 | 165 | Dummy simulation |
| Q4 2026 — 2026-12-31 | 288 | 84 | 204 | Dummy simulation |
| Q1 2027 — 2027-03-31 | 288 | 36 | 252 | Dummy simulation |
| Q2 2027 — 2027-06-30 | 288 | 13 | 275 | Dummy simulation |
| Q3 2027 — 2027-09-30 | 288 | 4 | 284 | Dummy simulation |
| Q4 2027 — 2027-12-31 | 288 | 0 | 288 | Dummy simulation |

- Quarter marker: select Active records existing at that cutoff. A ribbon/legend selects Active or Closed. All statuses (or both options) includes both categories.
- Q2 2026 should have 169 Active and 95 Closed deliverables, 264 total. Click its marker, then its Closed ribbon; inspect table/KPIs and download both register and current-view XLSX.
- Each historical export carries cutoffDate and historyMode. Reload preserves the cutoff and selected categories.
- Return to current snapshot clears date/status selection: 288 total, 165 Closed, 15 overdue Active.
- Future markers say Simulated; the cutoff summary and exported historyMode identify Dummy simulation. The removed chart footer stays absent.

## Coworker

1. Open Coworker at 1366 × 768 and 1280 × 720, 100% zoom. All four fact cards, the input and all four example prompts must appear before scrolling. No filter bar, sample toolbar, current-view export or current-observation count. The connection panel ends after Check connection and any configured model ID.
2. The question is preloaded; Portfolio assessment and Suggested follow-up are absent.
3. Click a sample question beneath the prompt: only the input changes. Press Ask Coworker to display the response.
4. Guided demo, Guided fallback and Local AI remain distinguished. The removed deterministic-mode sentence and inline reference pills stay absent.
5. The bottom label links to the README local-AI section. Local model connection and Use local AI remain functional.
6. Compare all narrative figures with verified cards. Portfolio register exports remain available in their own tabs. Ask about weather: expect an unsupported-topic refusal.
7. Follow LM_STUDIO_SETUP.md for a real inference check on 8765; test browser responses use mocks and do not establish real model inference.

## Registers, downloads and publication

- Register instruction: Select an entry to open detailed view.
- Risks exposes its register. The Issues tab is absent; legacy Issues/scenario URLs resolve to Risks register. Issue records remain in Project 360 and all shared calculations.
- Probability is the explicit scenario input. Financial impact if a risk/issue materializes displays gross lossUsd; probability-weighted expected loss remains a distinct calculation.
- XLSX exports retain typed numeric cells, white headers, filters, About sheet and dummy-data disclaimer. Chart download stays PNG.
- Build, Python tests and browser tests must pass before merging. The existing workflow validates PRs and deploys successful main only.
- Public Pages stays guided; the local service uses 8765 and LM Studio uses 1234.
