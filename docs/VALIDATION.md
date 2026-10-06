# Validation record — Atlas Business Intelligence Hub v1.1.1 Coworker

Prepared 5 October 2026 against the supplied branch ZIP baseline. The business snapshot remains 22 September 2026. This record separates executed checks from validation that remains on the owner's machine or GitHub.

## Executed successfully

| Check | Result |
|---|---|
| Deterministic data and shared calculations | 16 Node tests passed |
| React component interactions | 21 Vitest/jsdom tests passed |
| Python service and LM Studio contract | 11 unittest tests passed |
| Browser interactions and downloaded artifacts | 10 Playwright tests passed in Chromium 153 |
| TypeScript | `tsc --noEmit` passed |
| Production build | Vite build passed |
| Static release audit | Correct Pages base; no source maps or reference-project branding/endpoints |
| Patch/ZIP integrity | Update applies to the captured branch baseline; packaged source reconciles with working files |

**58 automated tests passed.** Current branch: `atlas_coworker_integration`. Product: Atlas Business Intelligence Hub; fictional organization: Atlas Impact Network. Node 24.19.0 and Python 3.12.14 were used here. The workflow uses Node 22 and Python 3.13; that GitHub-hosted combination is supplied for validation, not claimed as executed here. Existing pinned dependencies were retained.

Data/engine checks cover reproducibility, the 48-project base, relationships, deliverable-derived progress, ±7 boundaries, monthly observation coverage, explicit probabilities, closed threats, common scope, the defect fixture, baseline/scenario totals, zero-progress null projections, guided responses and Markdown figures.

React tests cover original Atlas interactions and dialog focus restoration, Coworker sources, review gates/resets and local-mode presentation. Browser checks exercise the compiled frontend, global filters/project scope, sample correction, native dialogs, navigation/search, scenario sliders/matrix, mobile layout, real CSV/XLSX/Markdown/SVG/PNG downloads and matching numeric values. Downloaded workbook cells and brief figures are inspected rather than only checking a download event.

Python tests execute an in-process HTTP mock of LM Studio's models/chat endpoints, including path, optional bearer authentication, JSON-schema request, response validation, unavailable-model fallback and evidence IDs. They also execute the application HTTP boundary, built asset subpath, input validation and shared Node calculations. Browser model responses are mocked. These establish integration behavior, not inference quality of a real model.

Desktop and 390-pixel mobile screenshots were inspected for readable controls, cards, tables and evidence navigation. Additional compiled-browser checks confirmed the official browser title, exact banner labels, short product header/footer, organization identity, About content and visible mobile separators. Business datasets were compared with the prior v1.1.0 integration and are identical; only metadata changed. The environment used a separate packaged Chromium binary because the standard browser download was unavailable; it is not an application dependency. The workflow and normal local instructions retain Playwright's standard browser installer.

The production app's main JavaScript chunk is approximately 910 kB before compression and 166 kB with gzip, including the synthetic data/evidence bundle. Vite reports its standard large-chunk warning; compilation succeeds. Workbook generation loads separately. These are build sizes, not measured load timings.

## Remaining validation

- Install/load a real model in LM Studio, run `python -m atlas_coworker check`, then `python -m atlas_coworker evaluate`. Require `mode: local_ai` and inspect narrative claims; a guided fallback is not a successful inference check.
- Run the supplied checks on the owner's system and complete [WALKTHROUGH.md](WALKTHROUGH.md), including reference figures, scenario assumptions and review reset.
- Push the update to the existing branch and inspect its new workflow run. No remote commit, push, PR, merge, Actions execution or Pages deployment was performed here. Main-only deployment and the published guided demo remain to be confirmed in GitHub.

Schema and valid-source checks cannot prove narrative accuracy. Review is session-only. Synthetic probability/loss assumptions are uncalibrated. See [LM_STUDIO_SETUP.md](LM_STUDIO_SETUP.md) and [METHODOLOGY.md](METHODOLOGY.md).

> This is a demo with dummy data. It does not contain or reproduce copyrighted, confidential or protected code, systems, or datasets.
