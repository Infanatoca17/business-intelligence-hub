# Atlas Business Intelligence Hub v1.2.0 validation walkthrough

Use the canonical data, reset global filters and return Deliverables to the current snapshot before checking portfolio figures. Snapshot: **22 September 2026**, period **Q3 2026**, currency **USD**. Use the Python-served **8765** URL for local AI. A historical Deliverables cut affects that view only; Overview, financial assumptions and Coworker retain the current snapshot.

## 1. Identity, navigation and responsive layout

- Browser title: **Atlas Business Intelligence Hub**; organization: **Atlas Impact Network**; product label: **Business Intelligence Hub**.
- Banner: **Independent Demo | All Data is Synthetic | About the Data**.
- Eight centered navigation entries: Overview, Projects, Deliverables, Staff, Financials, Funding Pipeline, Risks and Issues.
- Coworker opens from its green header launcher beside Search, on desktop and mobile.
- Data Quality, Executive Brief, Methodology and a separate Risk Scenarios entry are absent. Direct optional-workspace URLs return to Overview. Their implementation remains in source.
- Global filters appear in order **Program → Project → Leading office → Project status**. Office labels are Americas, Europe, Africa, South Asia, East Asia and Oceania.
- Overview has six cards in one row and Financials five at desktop widths above 1050 px. Narrow widths wrap for readability.
- All bar charts are vertical. The middle exposure band is pale straw yellow.
- Scroll to the footer: Back to Overview appears immediately after Back to Top in all workspaces except Overview and preserves global scope.

At 390 px, check readable controls, table scrolling inside its panel and no horizontal body overflow. The long ribbon may scroll inside its own panel. At 1440 px, check centered navigation, card rows and the two equal-width Projects charts.

## 2. Reference figures at the current snapshot

| Measure | All programs | Health |
|---|---:|---:|
| Total / active projects | 48 / 44 | 12 / 11 |
| Deliverable-derived progress | 56.0% | 58.5% |
| Expected progress | 57.2% | 57.2% |
| Approved budget | $36,370,000 | $8,955,000 |
| Spending | $20,617,744 | $5,097,830 |
| Completed / total deliverables | 139 / 288 | 36 / 72 |
| Overdue deliverables | 20 | 5 |
| Non-closed risks / issues | 85 / 43 | 22 / 11 |
| Exposure index | 51.1 / 100 | 49.6 / 100 |
| Baseline expected consequences | $6,703,756.25 | $1,732,500.00 |
| Current observation coverage | 48 / 48 | 12 / 12 |
| Cost projection coverage | 44 / 48 | 11 / 12 |

Compact chart/card formatting differs from whole-dollar Coworker formatting. Numeric workbook cells retain precision. Planned projects remain in equal-weight progress averages unless filtered out.

1. Choose Health on Overview and compare the table above.
2. Choose Review delivery or open Projects and filter Behind schedule.
3. Open Project 360; progress must equal the mean completion of its six deliverables.
4. Check the progress tracker and **Budget by delivery status** occupy equal halves. The second chart allocates approved budgets, not losses. Select a visible segment: program/schedule filters and directory must agree.
5. Reset filters; select **Watershed Futures** in Project. Check the common one-project scope in each view and Coworker. Reset afterwards.
6. Reload a filtered URL and check program, office, status and project selection persist. An incompatible intersection should show an explicit empty scope.

## 3. Quarterly deliverable history

Reset global filters, open Deliverables and inspect the ribbon. It spans Q4 2025 through Q4 2027 for all records, covering first creation through last simulated completion. Complete years use four quarter-end cuts.

| Cut | Existing deliverables | Scheduled | In progress | Complete | Overdue | Mode |
|---|---:|---:|---:|---:|---:|---|
| Q4 2025 — Dec 31 | 120 | 120 | 0 | 0 | 0 | Synthetic history |
| Q1 2026 — Mar 31 | 264 | 221 | 27 | 16 | 0 | Synthetic history |
| Q2 2026 — Jun 30 | 264 | 159 | 25 | 79 | 1 | Synthetic history |
| Q3 2026 — Sep 30 | 288 | 38 | 89 | 139 | 22 | Synthetic simulation |
| Q4 2026 — Dec 31 | 288 | 0 | 72 | 189 | 27 | Synthetic simulation |
| Current snapshot — Sep 22 | 288 | 100 | 29 | 139 | 20 | Authoritative current snapshot |

1. Select Q2 2026. Expect 264 rows in the register/count (only ten shown per page) and 79 completed deliverables.
2. Select the Complete ribbon near Q2, or click Complete in the legend after selecting that quarter. Expect 79 rows, all Complete, completion 100%, zero Overdue.
3. Export current view and Export XLSX from the register. Both must contain exactly the same filtered deliverables, plus `cutoffDate=2026-06-30` and `historyMode=Synthetic history`. The About sheet identifies the cutoff for nonempty rows.
4. Select Q3 2026. Expect **Synthetic simulation**: September 30 is later than the fixed September 22 snapshot. Do not label that point an actual quarter-end report.
5. Select Q4 2026, then click its Overdue ribbon near that quarter. Expect 27 rows. The nearest discrete quarter is used, not an arbitrary daily cutoff.
6. Select Health and repeat a cut. Ribbon counts, cards, vertical charts, table and workbook must reconcile within the selected program.
7. Reload a cut URL: date persists; the status filter resets to All. Use **Return to current snapshot ×** to restore 288 / 139 / 20 under all programs.
8. Use Tab and Enter/Space on quarter labels and ribbon areas. Keyboard status selection uses the currently selected quarter or latest past quarter.
9. Download a Deliverables status/program PNG and check the footer labels the selected cutoff and history/simulation mode. Download the ribbon PNG and check all quarters are included.

The synthetic event history is documented in METHODOLOGY.md; it is not reconstructed measured reporting and does not retime Coworker or financial forecasts.

## 4. Coworker and evidence

1. Open Coworker beside Search. Confirm the readiness strip and Sources you can inspect panel are absent; **Local model connection** remains.
2. Ask **Draft the quarterly brief** in guided mode. Compare its verified cards, narrative numbers and workbook to the current-snapshot reference figures.
3. Open inline **CALC-PORTFOLIO** / **CALC-SCENARIO** citations; inspect the exact calculated facts. A source button remains in the response without recreating a separate Sources section.
4. Select Health and repeat; scope must remain shared.
5. Follow LM_STUDIO_SETUP.md on port 8765. Check connection, enable Use local AI, ask again and expect **Local AI · LM Studio**. Compare every model-written number with verified facts.
6. Ask an unsupported question such as weather: expect a guided refusal. Stop LM Studio and ask with local AI enabled: expect a clearly labelled fallback.

A model listing check is not an inference check. Component/Python tests use mock responses. Real Qwen evaluation remains on the owner's computer.

## 5. Embedded Risks scenarios

1. Open Risks. The filter must say **Risks status**; open Issues and check **Issues status**.
2. Return to Risks and select **Risk scenarios** in the toggle. The main Risks tab remains selected; the entire Baseline impact × likelihood section is absent.
3. At baseline with all programs, expected loss is **$6,703,756.25** and summed project funding gaps **$5,963,781.25**.
4. Set funding reduction 20%, capacity reduction 25% and risk probability uplift 50%. Expect available budget **$29,096,000**, loss **$7,917,963.125**, summed gaps **$14,731,954.825** and added mean delay **61.340625 days** (UI rounds).
5. Switch to **Risk register**, then back to Risk scenarios. Parameters and calculations should remain in the current session. Exposure remains **51.1/100**.
6. Export scenario CSV/XLSX. Under all programs, CSV has one header plus 48 project rows. Summed row funding gaps match the calculated figure; four zero-progress projects have blank/null projections.
7. Select Planned project status. Expect 0/4 projection coverage and Not projected, not zero execution cost.
8. Open Coworker and ask about the scenario; it uses the same session parameters and project scope. Scenario values are baseline again after a full reload, because parameters are session state.

## 6. Exports and publication

- Every chart offers PNG only; no SVG download control.
- XLSX workbooks contain the exact filtered rows, numeric cells, official product/organization and dummy-data notice.
- Risk scenario CSV/XLSX retain scenario parameters, currency and snapshot.
- Run build, Python and the 12 browser tests before merging. The browser suite checks downloaded PNG bytes/dimensions and workbook contents.
- Push atlas_ui_refresh, review its PR and merge only after validation passes. One workflow deploys main to Pages.
- On Pages, check the new UI and guided Coworker. Use localhost 8765 separately for real AI.

The optional quality/review components remain covered through direct component hosts. They are intentionally outside this end-user walkthrough because they are disabled in the standard release.
