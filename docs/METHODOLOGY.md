# Demonstration methodology

All formulas below are implemented in `src/metrics.mjs` or directly calculated from filtered rows in the interface. This is an independent demonstration methodology, not a calibrated organizational risk model. The snapshot date is fixed at **2026-09-22**; changing the computer clock does not change the demo.

## Progress

`Actual project progress = mean(completion percentage of the project's deliverables)`

`Expected project progress = clamp(100 × (snapshot − start) / (end − start), 0, 100)`

Date differences use UTC calendar dates. Projects have strictly positive durations. The generator rounds expected progress to whole percentage points. Portfolio progress uses an equal-weight mean across all projects in scope, including planned projects unless the status filter excludes them.

Schedule status uses a 10-percentage-point tolerance: below expected minus 10 is Behind schedule; above expected plus 10 is Ahead of plan; all other values are On track. A deliverable is Complete at 100%; otherwise it is Overdue if its due date is before the snapshot, In progress if completion is positive, or Scheduled.

## Threat exposure index

`Risk/issue score = impact × likelihood × 4`

Impact and likelihood are integers from 1 to 5. Issues have likelihood 5 because the fictional event has occurred. Closed records have score 0.

`Project exposure = mean(scores for the project's non-closed risks and issues)`

A project with no open items has exposure 0. The portfolio average is the equal-weight mean of project exposure. The index is bounded to 0–100. Bands are Minor (0–20), Moderate (>20–40), Major (>40–70), and Critical (>70–100). This is an index, not a probability of loss. The chart has a fixed 0–100 horizontal scale so filtered and unfiltered views remain comparable.

## Resources

Budgets, expenditures, forecasts and next-year budgets are independent synthetic values in USD. Burn rate is `100 × expenditure / budget` and is 0 for an empty scope. Forecast expenditure is a projected total, not an additional expenditure amount.

Each staff record is a unique fictional person allocated to exactly one demonstration project. FTE sums those allocations. Weekly hours equal FTE × 40. These assumptions avoid double counting in this small demo; a real allocation model would distinguish people from assignments.

## Funding

Requested amount is the sum of the displayed opportunities, including secured opportunities unless a stage filter narrows the view. Weighted pipeline is `sum(requested × probability)`, with stage weights Proposed 25%, Under review 50%, Negotiation 75%, and Secured 100%. These are illustrative scenario weights, not statistically estimated probabilities.

## Filtering and exports

Program, leading office and project status define a set of project IDs. Related records in every view are selected through those IDs. View-specific filters narrow the current view further, including its charts, KPIs and exported rows. The scope counter always reports the project-level global scope. Search intentionally covers the entire synthetic portfolio.

Program and office bars change the global scope. Risk/issue status and severity bars apply the corresponding local filter. Project links use query parameters and survive refresh on static hosting. Global filters and selected project are encoded in URLs; view-specific filters are not currently encoded in the URL.

An empty filter intersection is displayed as an empty state and zero counts. It is not a missing-data record. No missing value is replaced with invented operational information.

> This is an independent portfolio implementation built with synthetic data. It does not contain or reproduce confidential employer code, systems, or datasets.
