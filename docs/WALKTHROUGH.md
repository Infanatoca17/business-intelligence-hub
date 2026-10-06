# Atlas Business Intelligence Hub v1.1.1 validation walkthrough

Use the canonical sample and reset global filters before checking the reference figures. The snapshot is **22 September 2026**, period **Q3 2026**, currency **USD**. Current progress comes from deliverables. The public demo uses guided responses; the local Python-served application can use LM Studio.

## 0. Product identity and branch

- Browser title: **Atlas Business Intelligence Hub**.
- Product header and footer: **Business Intelligence Hub**.
- Fictional organization: **Atlas Impact Network**, including the logo and About text.
- Banner: **Independent Demo | All Data is Synthetic | About the Data**; the final label opens the About dialog.
- Workbook About sheet and downloaded chart metadata identify the official product and organization separately.
- Executive Markdown title identifies the official product; organization is a separate line.
- Current branch and the workflow push trigger: **atlas_coworker_integration**.

Check these on desktop and mobile; the banner must remain readable without horizontal page overflow.

## 1. Baseline figures

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

Overview uses compact dollar formatting; Coworker uses whole-dollar formatting. Exported numeric cells retain calculation precision. A formatting difference does not change the underlying values. Expected progress and portfolio means include planned projects unless the global status filter excludes them.

## 2. Delivery and connected scope

1. Open Overview, select **Health**, and compare the figures above.
2. Choose **Review delivery**, or open Projects and filter **Behind schedule**.
3. Open a project and check that its progress equals the arithmetic mean of its six deliverable completion values, rounded to one decimal.
4. Check its exposure and baseline expected financial consequences. Financial consequences use the same threats as the index, with explicit probabilities and USD losses.
5. Close Project 360, open Coworker and confirm Health remains selected.
6. Set the global **Project** dropdown to **Watershed Futures**. This scopes all views to one project; a conflicting program selection legitimately creates an empty scope. Reset filters afterwards.
7. Reload a filtered URL and confirm program, office, status and project scope persist.

Pass: figures and filters agree across views; no NaN/undefined values; empty intersections are explicit.

## 3. Reporting and evidence

1. Open Coworker and ask **Draft the quarterly brief**.
2. Compare progress, spending, deliverable counts, exposure and baseline losses with the cards and the reference table.
3. Open **CALC-PORTFOLIO** and **CALC-SCENARIO** citations. Inspect the exact figures and assumptions.
4. Ask **Which threats need follow-up?** and inspect a threat citation. Open its Project 360 link.
5. Ask **What is the weather?** and confirm a refusal rather than invented data.

Pass: the guided response has the right scope and facts. Local AI, when enabled, must preserve those facts in its narrative and cite supplied sources.

## 4. Quality workflow

1. Reset filters, open Data Quality and click **Load defect sample**.
2. Expect **8 findings: 4 Critical + 4 Warning**, and **46/48** current observations.
3. Inspect a critical source to see the original record and raw locator. Two invalid current observations are quarantined; an orphan and duplicate are also quarantined.
4. Open Overview/Coworker. Current delivery progress and spending stay **56.0% / $20,617,744**, because these use deliverables and financial records, not invalid monthly observations.
5. Open Executive Brief. **Mark scope reviewed** must be disabled.
6. Return to Data Quality and click **Load corrected sample**. Expect zero findings and 48/48 coverage.

The switch replaces a deterministic fixture and applies across the application. It is not an automatic repair of arbitrary imported data. Orphan/global blockers remain visible when filtering so they cannot be hidden accidentally.

## 5. Risk scenarios

1. With all programs and the canonical sample, open Risk Scenarios.
2. At baseline, verify expected loss **$6,703,756.25** and summed project gaps **$5,963,781.25**.
3. Set funding reduction **20%**, capacity reduction **25%**, and risk probability uplift **50%**.
4. Expect available budget **$29,096,000**, expected loss **$7,917,963.125**, summed project gaps **$14,731,954.825**, and added mean delay **61.340625 days**. The UI rounds money to dollars and delay to one decimal.
5. Exposure stays **51.1/100** because the baseline ordinal scale is unchanged.
6. Click a populated matrix cell. Confirm only matching baseline impact/likelihood threats appear in the register; clear the matrix filter.
7. Inspect a project with a large funding gap and open Project 360.
8. Select Project status **Planned**. All four projects have zero progress, so execution cost and project gap show **Not projected**, with **0/4** projection coverage. A zero summed gap over an empty projection cohort does not establish adequate funding.
9. Download CSV and XLSX. CSV has one header plus 48 project rows before filtering; CSV/XLSX include the snapshot, currency, sample, scenario percentages and dummy-data notice. Null projections are empty export cells, not zero-valued projections.

## 6. Executive brief and export checks

1. Reset filters and scenario to baseline. Open Executive Brief.
2. Draft/edit the narrative, inspect evidence and mark the scope reviewed.
3. Download the reviewed Markdown brief. Compare its figures with Coworker and the numeric XLSX export.
4. Edit the narrative, change a global filter or change the scenario: review must reset to Draft.
5. Clear the narrative: review must be disabled.
6. Close/reopen the page: review is not a durable approval record.

Pass: numeric cells retain precision, Markdown uses the displayed rounding, sources/assumptions and the dummy-data notice are included.

## 7. Local LM Studio evaluation

Follow [LM_STUDIO_SETUP.md](LM_STUDIO_SETUP.md). `check` must find the model; `evaluate` must return `mode: local_ai`. Enable Use local AI, ask the same reporting/quality/scenario questions and compare each sentence with evidence. Stop the model server after enabling AI and ask again; expect an explicit guided fallback.

Record hardware, model ID, quantization, context size, response time and factual errors. A valid JSON response or valid source ID is not proof that every narrative claim is supported.

## 8. Browser / publication checks

- Desktop and a narrow mobile viewport: navigation, controls, tables, source dialogs and exports remain usable.
- Keyboard: About/Project 360/evidence dialogs close with Escape and restore focus.
- GitHub Pages: the guided demo works without local services, accounts or model installation.
- Integration branch/PR: one workflow validates without publishing. Main: successful validation precedes Pages deployment.

For executed checks and limitations, see [VALIDATION.md](VALIDATION.md).
