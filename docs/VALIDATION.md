# Validation record — Atlas Business Intelligence Hub v1.2.0

Prepared **6 October 2026** from the previously delivered v1.1.1 Coworker source checkpoint. The business snapshot remains **22 September 2026**. The user's remote checkout was not accessed; the patch is tested against the captured source baseline, not claimed to match subsequent personal edits.

## Executed checks

| Check | Result |
|---|---|
| Node data/engine/history tests | **22 passed** |
| React component tests, jsdom | **26 passed** |
| Python service and LM Studio contract tests | **11 passed** |
| TypeScript | `tsc --noEmit` passed |
| Production build | Vite build passed |
| Static output audit | Passed; correct Pages base and product identities |
| Browser suite discovery | **12 tests listed**; browser execution not performed here |
| Baseline semantics | Current progress, financials, risk/probability assumptions, staff, funding, monthly evidence and current deliverable statuses/completions unchanged |
| Local service preservation | All four `atlas_coworker/` source files byte-identical to v1.1.1; default application/API port remains 8765 |
| Incremental patch and archive | Fresh baseline application, complete source comparison and ZIP CRC verification performed before delivery |

**59 automated tests were executed successfully.** Browser test discovery is not counted as a passed test. Node 24.19.0 and Python 3.12 were used. Dependencies were retained; only package version metadata changed.

Data tests cover current snapshot reproduction, valid synthetic event chronology, completion anchored to the snapshot, quarter boundaries, status transitions at due/start/completion dates, filtered ribbon/table/export reconciliation, empty scopes and approved-budget stack totals. Component tests cover hidden routes, retained quality/review code, eight navigation entries and header launcher, office labels/order/legacy URLs, embedded scenarios and retained settings, ribbon filters/reset/typed workbook cells, PNG-only controls and footer navigation. Existing common calculation and local response race checks remain.

Python tests use mock LM Studio model/chat endpoints, JSON-schema/citation validation, authentication, fallback and the service's actual HTTP boundary. They do not run Qwen weights. The user confirmed real local inference in the preceding v1.1.1 installation; that does not establish real inference for this changed bundle. Evaluate v1.2.0 using LM_STUDIO_SETUP.md.

## Browser and publication checks remaining

A supported browser-preview runtime was unavailable in this execution environment. No browser was installed or substituted, no visual screenshot was produced for the new version, and **the 12 Playwright tests were not executed here**. Layout correctness beyond component assertions remains subject to local/CI browser validation.

Run:

```powershell
npx.cmd playwright install chromium
npm.cmd run test:ui
```

The supplied suite checks 1440-pixel KPI rows/nav alignment, equal Projects chart widths, 390-pixel body overflow, keyboard ribbon selection, quarter persistence/simulation labels, CSV/XLSX numeric contents, PNG signatures/dimensions and mock AI presentation. It uses Vite preview on 4173 during tests; this does not alter Python's 8765 port. Follow WALKTHROUGH.md for the manual visual and real-model checks.

The single Pages workflow still validates branches and PRs, then publishes only a successful main build. No remote GitHub action, commit, push, PR, merge or deployment was performed. Public Pages runs guided mode; the local model remains on the owner's machine.

## Interpretation limits

The ribbon history was generated because the original bundle lacked creation/start/completion dates. Cuts after the snapshot are explicitly synthetic simulations, including September 30, 2026. Completion uses a deterministic event curve rather than measured reports. Historical Deliverables selection does not change other views' fixed current-snapshot metrics. Ordinal exposure and USD consequences retain their distinct units and original formulas.

The complete ZIP is a source checkpoint, not a Git history archive. Builds, dependencies and weights are intentionally excluded and reproducible using the supplied configuration. A patch context mismatch on a personally edited checkout requires a reviewed per-file merge rather than forced application.
