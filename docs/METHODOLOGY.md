# Demonstration methodology — Atlas Business Intelligence Hub v1.2.0

The shared engines are `src/metrics.mjs` and `src/coworker-engine.mjs`. React, guided responses, scenario exports and the Python service use these same calculations. Python invokes the Node engine; it does not maintain a second set of formulas. The snapshot is fixed at **2026-09-22**, reporting period **Q3 2026**, currency **USD**.

## Delivery and monthly evidence

`Actual project progress = mean(completion percentage of the project's six deliverables)`

`Expected project progress = clamp(100 × (snapshot − start) / (end − start), 0, 100)`

UTC calendar dates and strictly positive project durations are used. Expected project progress is rounded to whole percentage points; actual project progress to one decimal. Portfolio progress is an equal-weight mean across projects in scope, including planned projects unless filtered out.

A gap below **−7 percentage points** is Behind schedule; above **+7** is Ahead of plan; both boundaries and the intervening range are On track. A deliverable is Complete at 100%; otherwise Overdue if its deadline precedes the snapshot, In progress if completion is positive, or Scheduled.

The generator creates 12 monthly observations per project, October 2025–September 2026. Historical completion and spending interpolate deterministically from planned elapsed time and the current synthetic records. September is a partial-month observation at the snapshot date, not a forecast month-end. Current observations reconcile with current deliverables and spending. Historical completion is derived from its six saved deliverable completion values. These records are synthetic histories, not collected reports or independently estimated trajectories.

Monthly evidence supports coverage and historical inspection. Current dashboard progress and spending use deliverables and financial records; an invalid monthly observation is quarantined rather than substituted into current KPIs.

## Quarterly deliverable ribbon

The baseline bundle did not contain creation/start/completion events. `src/delivery-history.mjs` adds an explicitly fictional, deterministic event history to each deliverable. It is separate from the monthly observation interpolation; neither is measured history. Current snapshot values remain authoritative.

- Creation is the earlier of project start minus 28 days and snapshot minus 45 days. This allows planning deliverables to exist before a project starts.
- Complete records receive a completion before/on the snapshot and their due date; other records receive a simulated completion 21–60 days after the later of due date and snapshot.
- Synthetic start precedes completion and is never before creation. All zero-progress records start after the snapshot; some can already be Overdue because their due date has passed.
- At a cutoff before creation, exclude the record. At the exact snapshot, use its saved current status/completion. Otherwise apply: completed by cutoff → Complete; deadline before cutoff → Overdue; started by cutoff → In progress; otherwise Scheduled. Due on the cutoff is not overdue.
- Estimated completion interpolates between event dates and anchors to the saved snapshot percentage. It is bounded 0–100. The event model intentionally represents single start/completion dates rather than repeated reopenings.

Cuts occur at UTC quarter ends: March 31, June 30, September 30 and December 31. The timeline spans the quarter containing first creation through the quarter containing last simulated completion. Thus partial first/final years have only the applicable quarters. Ribbons interpolate counts between the discrete cuts for display; filter values use the exact cutoff counts, not an interpolated point.

Clicking a quarter includes all existing deliverables at that cut; clicking a ribbon selects its status at the nearest quarter. Keyboard/legend selection uses the selected cut or latest past quarter. Date/status filters drive the Deliverables KPIs, vertical charts, table and XLSX from the same rows. Other portfolio views and Coworker retain the fixed current snapshot; the ribbon does not retime project financial assumptions.

Any quarter end after **2026-09-22**, including Q3 2026 on September 30, is labelled **Synthetic simulation**. Earlier quarters are **Synthetic history**. Neither should be presented as reported operational results.

## Budget by delivery status

The Projects chart sums **approved budget (USD)** by program and schedule band, with Planned projects separated. Its segments reconcile to the visible project directory and its total approved budget. Clicking a segment selects the program and schedule (or Planned project status). This is a delivery attention/allocation view, not expected financial loss, spending or a risk provision.

## Ordinal exposure and monetary consequences

`Threat score = impact × likelihood × 4`, except closed records have score 0.

Impact and likelihood are integers 1–5. An occurred issue uses likelihood 5. Project exposure is the mean score of non-closed threats; no open threats gives 0. Portfolio exposure is the equal-weight project mean. Bands are Minor (0–20), Moderate (>20–40), Major (>40–70), Critical (>70–100). The chart scale is fixed at 0–100.

| Likelihood level | Synthetic risk probability |
|---:|---:|
| 1 | 10% |
| 2 | 25% |
| 3 | 45% |
| 4 | 65% |
| 5 | 85% |
| Occurred issue | 100% |

These are explicit uncalibrated scenario assumptions. Ordinal likelihood 5 is not automatically probability one for a risk. Probability one applies to an issue because the fictional event has occurred.

Each threat has a generated USD consequence: `round(project budget × (0.02 + impact × 0.025))`. Its delay assumption is `impact × 6 + (threat record index modulo 5) × 3` days. Closed threats contribute zero.

`Baseline expected consequences = sum(probability × lossUsd)`

Exposure and expected consequences reference the same threats but measure different things: an ordinal index vs USD. One is not converted into the other. Additive expected losses do not imply independent events, but this demo does not model dependence, overlapping consequences, contingencies or probability distributions. Its loss estimate is not an approved risk provision.

## Financial scenarios

Budgets, spending, register forecasts and next-year budgets are synthetic USD values. Register forecast is a separate supplied demonstration field. Burn rate is `100 × spent / budget`, or 0 for an empty scope.

| Parameter | Range / effect |
|---|---|
| Funding reduction | 0–50%; available budget = approved budget × (1 − reduction) |
| Capacity reduction | 0–50%; remaining execution cost increases by 0.30 × reduction |
| Probability uplift | 0–100%; risk probability = min(1, baseline probability × (1 + uplift)); issue probability stays 1 |

For a project with positive deliverable progress:

`Baseline execution projection = spent / (progress / 100)`

`Scenario execution = spent + max(0, baseline execution − spent) × (1 + 0.30 × capacity reduction)`

`Scenario cost with risk = execution + sum(scenario probability × lossUsd)`

`Project funding gap = max(0, scenario cost with risk − available budget)`

Portfolio gap sums individual gaps. A surplus in one project is not transferred to another. Expected loss covers every scoped non-closed threat; the execution/gap aggregate covers only projects with positive progress. Zero-progress projects have **null / Not projected** execution, cost-with-risk and gap. The UI reports coverage (44/48 at baseline). An empty projection cohort has a sum of 0 and does not establish adequate funding.

`Delay = remaining planned days × (1 / (1 − capacity reduction) − 1) + sum(scenario probability × delayDays)`

Added delay is the equal-weight mean of each project's scenario delay minus baseline delay. It is an illustrative additive sensitivity, not a critical-path schedule model. Scenario changes leave the baseline ordinal exposure unchanged. The retained matrix code uses baseline impact and likelihood; that section is hidden in the v1.2.0 UI.

## People and funding

Each of 96 fictional people is allocated to one project. FTE sums assignments; weekly hours = FTE × 40. A real staffing system would distinguish people and multiple allocations.

Funding requested amount includes all scoped opportunities unless the stage filter narrows it. Weighted pipeline = sum(requested × stage probability): Proposed 25%, Under review 50%, Negotiation 75%, Secured 100%. These funding-stage weights differ from the threat likelihood scale and are also synthetic.

## Quality and review

Data Quality and Executive Brief are disabled in the standard v1.2.0 UI. The following quality/review engine and components are retained and covered by component tests for future reactivation.


The canonical bundle has no findings. The selectable defect fixture contains one duplicate observation, one orphan observation, negative spending, progress above 100%, a stale current report, a missing project owner, missing threat action and missing response owner. Four critical observations are quarantined; four warnings remain inspectable. Raw records and locators are preserved. Restoring the canonical sample replaces this deterministic fixture; it is not a general data-cleaning tool.

Review requires a nonempty scope and narrative, zero critical findings, valid current observations for every scoped project, and acknowledgement of any warnings. Orphan/global findings remain visible under filters. Scope/sample/scenario/narrative changes reset review. Review is session-only and does not establish durable authorization or an audit trail.

## Scope, evidence and exports

Program, office, project status and optional project ID select a set of project IDs. Related datasets and Coworker use that same set. View-specific filters narrow their table/chart/export further. Search covers the entire synthetic portfolio. Global filters, project scope, the Risks subview and the selected deliverable cutoff are encoded in URLs. A ribbon status selection is session state; reload retains the date but resets the status filter. Optional defect samples are disabled in the standard UI. Other table filters and review are not URL state.

Empty scopes show zero counts and explicit empty states. Null execution projections export as empty cells, not zeros. Scenario XLSX/CSV rows include the snapshot, currency, sample, scenario percentages and dummy-data notice. Numeric XLSX/CSV cells preserve calculation precision; UI and Markdown round money to dollars, progress/exposure to one decimal. Compact dashboard formatting can differ from Coworker formatting without changing the underlying value.

Evidence comprises generated policy documents and source records plus `CALC-PORTFOLIO` and `CALC-SCENARIO`, calculated from the current scope. Guided responses select sources by reporting intent. LM Studio receives the selected evidence and verified calculations, rather than an unrestricted data connection. It drafts JSON-structured narrative/actions and existing source IDs. Schema/citation checks cannot prove each sentence; human review is still required. Invalid/unavailable model output falls back to clearly labelled guided mode.

> This is a demo with dummy data. It does not contain or reproduce copyrighted, confidential or protected code, systems, or datasets.
