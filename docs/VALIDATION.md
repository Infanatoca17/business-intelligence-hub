# Validation record — Atlas UI polish, 25 October 2026

Baseline: the delivered **Atlas_Full_Source_2026-10-23.zip**. This is a focused presentation update on top of that checkpoint. Technical package version remains 1.2.0 and the business snapshot remains **22 September 2026**.

## Executed checks

| Check | Result |
|---|---|
| Node data, engine and history tests | 23 passed |
| React component tests, jsdom | 32 passed |
| Python service / LM Studio contract tests | 12 passed |
| Chromium browser tests | 18 passed |
| TypeScript | Passed |
| Production build and static output audit | Passed |
| Visual inspection | Centered filter frame, compact desktop Coworker and readable mobile stacking reviewed |
| Package integrity | Baseline plus incremental UPDATE_FILES reconstructed and compared with the complete source; ZIP CRC verified |

**85 automated tests passed.** The build's existing chunk-size advisory remains informational. No dependency or bundler changes were made.

Browser checks used the existing executable/argument environment overrides with a QA-only Chromium 153 binary outside the repository. No browser dependency or configuration was added to the deliverables. Temporary screenshots were inspected and are not included in source archives.

## New behavior verified

- Seven portfolio tabs; Issues no longer appears. Old `?view=issues` URLs open Risks. Issue records remain available to Project 360 and the shared calculation engine.
- The project-count label is absent from every filter bar. All seven views have equal left/right insets, and the labeled filter group has equal top/bottom insets within the rounded frame.
- Overview's exposure and financial-impact labels match the requested text; their values still use the existing calculations.
- Review delivery is tested after scrolling to the lower-page button with Health selected. The resulting Projects view starts at scroll position zero, preserves Health, applies Behind schedule, and shows the correct matching project count.
- Coworker's toolbar, sample pill and current-view export button are absent. The model-listing explanation is removed. Check connection, model ID, Use local AI, guided/local/fallback mode labels and response handling remain functional.
- At 100% zoom, all four fact cards, the textarea and all four example prompts fit the initial **1366 × 768**, **1280 × 720** and **1366 × 640** browser viewports. The compact layout adapts to shorter desktop windows. Mobile content and long generated responses retain normal scrolling.
- No response appears before Ask Coworker; example buttons only populate the textarea. Answer generation still works in guided and mocked local modes.

Existing browser checks also cover dropdown keyboard interaction, multiselect intersection/persistence/reset, Project 360, PNG/XLSX downloads, historical quarter reconciliation, hidden routes, narrow-screen overflow, and mock AI fallback.

## Preserved source and limits

Dataset, generator, calculation engines, exports module, geography, Python service, ports, dependency files, deployment base, TypeScript/Vite configuration, third-party notices and the single Pages workflow are byte-identical to the 23 October baseline. Updated files are presentation code, related tests and documentation only.

Application/API remains **8765**; LM Studio remains **http://127.0.0.1:1234/v1**. Requests remain same-origin. Model tests use controlled responses; real Qwen inference must be checked on the owner's machine using the existing README instructions before claiming successful model execution for a particular environment.

No remote commit, push, pull request, merge or deployment was performed. Run the existing build/Python/browser checks on the target checkout, then publish through the retained Pages workflow after main passes validation.
