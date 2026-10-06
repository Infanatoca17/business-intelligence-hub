# Synthetic data contract — Atlas Business Intelligence Hub v1.1.1

`scripts/generate-data.mjs` deterministically generates `src/data/atlas-bundle.json`. It does not ingest reference archives or organizational reports. Business identifiers use `ATL-` prefixes; people, emails, sites and donors are fictional. The canonical bundle has populated business fields. The defect sample intentionally includes invalid/missing fields at runtime for the quality walkthrough. Scenario nulls explicitly mean a projection is unavailable.

| Dataset | Rows | Key | Relationships and contents |
|---|---:|---|---|
| programs | 4 | id | Program name, color, description and three teams |
| projects | 48 | id | programId, locationId, planId; owner, dates, objectives, status, deliverable-derived progress, expected progress, exposure, expectedLossUsd |
| deliverables | 288 | id | projectId; six per project; completion 0–100%, status, assignee, due date, budget |
| plans | 48 | id | projectId; response approach, owner, review dates, status |
| risks | 144 | id | projectId, planId; 96 risks + 48 issues; kind, impact, likelihood, probability, lossUsd, expectedLossUsd, delayDays, score, owner, response action, deadline |
| staff | 96 | id | projectId; unique fictional person, role, .example email, FTE, weekly hours |
| financials | 48 | id | projectId; budget, spent, forecast, expectedLossUsd, next-year budget, USD |
| funding | 24 | id | projectId; fictional donor, stage, stage probability, requested amount, decision date |
| locations | 24 | id | Fictional site name/office, illustrative coordinates, public country names |
| observations | 576 | id | projectId + period unique; month YYYY-MM, observedAt, reportedAt, six deliverableCompletions, derived progress, expected, cumulative spent |
| documents | 6 | id | title and synthetic policy/evidence text |
| assumptions | object | — | scheduleTolerance 7, likelihoodProbabilities, capacityCostFactor 0.30, currency, probability basis |
| meta | object | — | Official product, short productLabel, fictional organization name, version 1.1.1, asOf 2026-09-22, Q3 2026, dummy-data disclaimer |

Every canonical downstream project reference resolves. A project has six deliverables, three threats, two staff, one financial record, one response plan and twelve observations. Funding exists for half the projects; an empty funding table means no additional opportunity. Planned projects have zero current progress/spending and are excluded from execution projections.

## Threat and scenario fields

- `likelihood`: ordinal 1–5; issue = 5. `probability`: risk mapping 10/25/45/65/85%; issue = 1.
- `lossUsd`: generated conditional consequence; `expectedLossUsd`: probability × lossUsd, or zero when closed.
- `delayDays`: generated conditional delay assumption. All monetary fields use USD, not index points.
- Project/financial `expectedLossUsd`: sum of its non-closed threats, not the separate `forecast` field.
- Calculated scenario rows include `availableBudget`, `baselineExpectedLoss`, `expectedLoss`, `baselineExecution`, `execution`, `costWithRisk`, `fundingGap`, `baselineFundingGap`, `delay`, `baselineDelay`.
- `baselineExecution`, `execution`, `costWithRisk` and gap fields can be null for zero progress. CSV/XLSX emit empty cells; the UI says Not projected.

## Monthly observations and documents

Observations cover October 2025–September 2026. `deliverableCompletions` contains six `{id, completion}` records, whose mean yields historical progress. Spending is cumulative, never a monthly delta. September's `observedAt` is the snapshot date. The generator's interpolation is synthetic and must not be described as measured history.

| Document ID | Contents |
|---|---|
| DOC-METHOD | Common progress and schedule rules |
| DOC-QUALITY | Validation, quarantine and historical evidence |
| DOC-RISK | Ordinal exposure and expected monetary consequences |
| DOC-PROBABILITY | Explicit uncalibrated likelihood probability scale |
| DOC-FINANCE | Funding, capacity, projection and delay assumptions |
| DOC-REVIEW | Human review and session-only review state |

These documents are records inside the bundle, not actual signed evidence. The evidence dialog also exposes project, threat, deliverable, financial and observation records. `CALC-PORTFOLIO` and `CALC-SCENARIO` are generated calculations, not stored measurements.

## Runtime quality and scope

`prepareSample` returns prepared data, raw data and `qualityFindings`. A finding has ID, severity, record ID, project ID, raw array locator, message, suggested action, quarantined flag and original source. The eight-defect fixture adds two records and quarantines four, leaving 574 valid observations and 46/48 current coverage.

Global program/office/status/project filters select project IDs and related rows. Orphan/global quality blockers remain visible. AI requests send filter/sample/scenario values to Python; the service independently obtains the same prepared dataset through the shared Node engine.

Geographic boundaries use public `world-atlas` / Natural Earth data. Fictional sites are placed near representative regional coordinates, not operational locations. See [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). Extend the generator and tests to create new demo scenarios rather than loading employer data.

> This is a demo with dummy data. It does not contain or reproduce copyrighted, confidential or protected code, systems, or datasets.
