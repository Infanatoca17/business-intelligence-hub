# UI refresh — v1.2.0

Official product: **Atlas Business Intelligence Hub**. Fictional organization: **Atlas Impact Network**. Short product label: **Business Intelligence Hub**. Assistant: **Coworker**. New branch: **atlas_ui_refresh**.

## Interaction choices

| Request | Implementation |
|---|---|
| Fewer, centered navigation tabs | Eight portfolio tabs; optional workspaces disabled and direct routes guarded |
| Highlight Coworker | Dedicated green launcher beside Search, available on every view; opens its existing workspace |
| Leading office / filter order | Hub suffix removed from generated business labels; Program → Project → Leading office → Project status; old office URLs normalized |
| Risks / Risk Scenarios | In-tab Risk register / Risk scenarios toggle, retaining session parameters; old scenario URL maps to the embedded view |
| Risk status label | Risks status / Issues status based on current tab |
| Baseline matrix section | Entire section hidden while preserving source |
| Downloads | Charts offer PNG only; tables retain XLSX and scenarios CSV |
| Footer | Back to Overview after Back to Top, absent on Overview |
| Bar charts | Shared chart renderer uses vertical bars, axes, wrapped labels and keyboard/click drill-down |
| Overview | Six desktop cards; pale straw middle exposure background |
| Projects | Equal-width progress tracker and approved Budget by delivery status chart; stacked approved allocations by program/schedule, clickable |
| Deliverables | Quarterly status ribbon with deterministic synthetic event dates and date/status filters, matching KPIs/tables/exports, explicit simulations |
| Financials | Five desktop cards |
| Coworker | Readiness strip and separate Sources panel removed; inline citations, local connection, toggle and AI handling retained |

Responsive layouts intentionally wrap cards/charts at narrow widths. The ribbon scrolls within its own panel. It is a stacked status ribbon across discrete cuts; visual slopes interpolate counts, while filters use exact quarter ends.

## Retained implementation

`src/portfolio-ui.mjs` holds `OPTIONAL_WORKSPACES_ENABLED = false`. App routing prevents access to Data Quality, Executive Brief, Methodology and the selectable defect fixture. Their view types, React components, sample/review machinery and exports remain in source, and direct component tests exercise them. React still renders compact methodology/provenance in About and inspectable citations; this request hides the separate workspaces, not the data disclosure.

Future reactivation requires enabling the flag and deliberately adding desired optional entries to the navigation list. The flag alone allows routes; it does not automatically enlarge the eight-item navigation. `showScenarioMatrix = false` in Coworker preserves the hidden matrix/register section for future use.

The Python service and AI adapter are byte-identical to v1.1.1. Neither the 8765 application port nor LM Studio's configured 1234 endpoint was changed. After a frontend change, rebuild dist and restart/refresh the Python-served app.

## Data and reproducibility

The original 48 projects and 288 current deliverable records remain the base. New event dates describe a synthetic history and future completion scenario. Original current statuses/completions, budgets, spending, forecast, probabilities, loss/delay formulas and monthly observations are preserved. Office business labels lose their Hub suffix; organization/product identities retain their correct names.

See METHODOLOGY.md for cutoff rules and WALKTHROUGH.md for current and historical reference figures. `npm run data:generate` reproduces the saved bundle. Version is 1.2.0; no dependency was added.

## Update and validation

The UI Update package contains one patch plus repository-relative copies of only changed files. Choose patch application or a reviewed per-file copy/merge; do not combine both. CHANGED_FILES.md and UPDATE_MANIFEST.json in the package list exact paths and old/new hashes. The separate complete ZIP provides the full source checkpoint. See UPDATE_EXISTING_REPOSITORY.md.

59 non-browser tests, type checking, build and static audit passed. The 12 updated browser checks are supplied for the owner/CI; they were not executed in this environment. Real v1.2.0 Qwen inference remains a local evaluation.
