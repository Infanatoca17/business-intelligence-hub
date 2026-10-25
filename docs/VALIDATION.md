# Validation record — Atlas UI update, 23 October 2026

Baseline: the supplied `business-intelligence-hub-main 23.10.26.zip`, identified in its ZIP comment as commit `060548f6306a7e82b1c382c87056df7bada4a97b`. The snapshot stays **22 September 2026**, with newly requested closed examples. Technical package version remains 1.2.0.

## Executed checks

| Check | Result |
|---|---|
| Node data, engine and history tests | 23 passed |
| React component tests, jsdom | 32 passed |
| Python service / LM Studio contract tests | 12 passed |
| Chromium browser tests | 14 passed |
| TypeScript | Passed |
| Production build and static output audit | Passed |
| Desktop/mobile visual inspection | All eight portfolio views, Coworker, multiselect popup and narrow layouts reviewed |
| Incremental package integrity | Baseline plus UPDATE_FILES reconstructed and compared byte-for-byte to the complete source; ZIP CRC verified |

**81 automated tests passed.** Build warnings about chunk size are informational; dependencies and bundler configuration were preserved.

Browser checks used Chromium 153 with the existing executable/argument environment overrides. The normal Playwright browser download was unavailable in this environment, so an external QA-only Chromium binary was used without changing the repository's dependencies, lockfile or browser configuration. The suite ran against the built app, including actual XLSX/PNG downloads, desktop/narrow layouts, keyboard controls, multiselect intersection/persistence/reset, register-only Risks/Issues, quarterly status/cutoff reconciliation and mocked local AI/fallback presentation. Browser screenshots were inspected as temporary QA evidence, and are not included in the source deliverables.

Data and component coverage checks Active/Closed examples in all programs, preserved identifiers/relationships/counts, closure/completion/exposure reconciliation, gross versus probability-weighted financial impact, typed spreadsheet cells, white headers and worksheet filters. Retained quality, scenario and review components remain tested through direct component hosts even though standard navigation hides them.

Python checks exercise the real local HTTP boundary and mock model/chat endpoints, schema/citation validation, optional authentication, fallback, scalar/multiselect scope and binary status. They do **not** run Qwen weights. Real model inference must be evaluated on the owner's computer using README / LM_STUDIO_SETUP.md before claiming inference success for this update.

## Preserved configuration

- Package and lockfile, Node version setting, TypeScript/Vite configuration, Pages workflow, deployment base, third-party notices and geography remain unchanged.
- Application/API default remains **8765**; LM Studio remains **http://127.0.0.1:1234/v1**.
- API stays same-origin and localhost-only. This update does not connect public Pages to a user's local service.
- No remote commit, push, PR, merge or deployment was performed.

## Intentional behavior and data changes

- 48 projects: 40 Active, 8 Closed, two closed examples per program. Four future-start projects remain Active at zero progress/spending.
- 288 deliverables: 165 Closed, 123 Active, including 15 overdue Active. Status is binary; completion and due dates remain independent measures.
- Snapshot metrics change because the requested dummy records changed; calculation formulas remain shared and consistent.
- Risk/issue gross financial impact uses `lossUsd`; expected financial impact remains probability × gross loss for non-closed threats.
- Coworker uses the complete current-snapshot portfolio because its filter bar is hidden. Portfolio selections remain intact when returning to another tab.
- Responses appear only after Ask Coworker. Example prompts only populate the textarea. Guided, fallback and local model modes stay visibly distinct.
- Future quarter ends remain explicitly simulated, despite removing the former chart footer.

Run `npm run build`, `npm run test:python` and `npm run test:ui` on the target checkout before merging, particularly if it contains edits newer than the supplied ZIP. Publish through the retained single Pages workflow after main passes validation.
