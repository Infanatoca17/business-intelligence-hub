# Validation record — Atlas v1.0.0 deployment hotfix

Prepared on 22 September 2026. This record distinguishes executed checks from checks supplied for local or GitHub Actions execution.

## Executed successfully

| Check | Result |
|---|---|
| Deterministic fixture and data integrity | 7 tests passed |
| React component interactions in jsdom | 15 tests passed |
| TypeScript | `tsc --noEmit` passed |
| Production compilation | Vite build passed |
| Static output audit | Correct `/business-intelligence-hub/` asset paths; no source maps or reference-project branding/endpoints in the output |
| Runtime dependency advisory check | Original preparation reported zero known advisories; dependencies are unchanged |
| Playwright test discovery | All 5 existing browser tests discovered; this is not browser execution |

Six new focus regression cases first failed against the original modal implementation and then passed after the correction. They cover cancel, close-button, and backdrop closure, both normally and under React StrictMode. They verify that cleanup closes a connected dialog, restores the opener's focus, and restores the previous body overflow setting. Together with the original checks, **22 data/component tests pass**.

The data checks verify reproducibility, populated business fields, absence of missing-data placeholders, unique IDs, valid relationships, metric boundary cases, and reconciliation of program totals with the portfolio. Zero values are legitimate numbers; they are not missing fields.

The component checks exercise all eight views, global filters, reset, sorting, pagination, Project 360, cross-entity search, deep links, invalid URL parameters, funding-stage totals, chart filters, empty results, help, and the disclaimer. A real XLSX archive is generated and its worksheets and disclaimer are inspected.

The compiled application and synthetic bundle produce a main JavaScript chunk of approximately 651 kB before compression, or 137 kB with gzip. Vite reports its standard large-chunk warning; compilation succeeds. Workbook generation is loaded separately. These are build sizes, not measured page-load timings.

## Not executed in a real browser here

The user supplied a GitHub Actions result with **4 browser tests passed and 1 failed**: the final focus-restoration assertion after Escape. This correction keeps that assertion and the entire Playwright suite. It does not disable a check, increase a timeout, or force focus from the browser test.

The session's browser could not open the local preview because its access policy blocked the address. No workaround was used. Consequently, the corrected Playwright suite has **not been run successfully in this environment**. The next local or GitHub Actions execution must confirm all five tests pass.

jsdom is not a rendering browser. Its dialog methods are simulated for component tests; those tests do not establish native focus trapping, Escape behavior, layout, pointer dragging, clipboard permissions, PNG rendering, or browser download behavior.

Before publication, stop any preview serving the old build and execute the included browser checks on your personal computer:

```bat
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:ui
```

The five browser checks cover page errors and runtime requests, scoped navigation, Project 360, search and reloadable URLs, empty filters, XLSX/SVG/PNG downloads, a narrow viewport, and keyboard/dialog behavior. They also run as a deployment gate in the supplied GitHub Actions workflow. If a check fails, diagnose the result before publishing.

Open the production preview and visually inspect desktop and mobile layouts, globe rotation, chart labels, modal scrolling, and downloaded charts. No new walkthrough screenshots are included: the reference project's screenshots were removed, and Atlas help uses newly authored text.

## Publication has not been tested

The user has reported an initial Actions execution. No repository, commit, push, Actions run, or Pages deployment was performed by the assistant on the user's behalf. The target account and subpath are configured for `Infanatoca17/business-intelligence-hub`. Successful deployment and the signed-out live-site check remain steps to confirm from that personal account.

The advisory result and automated scans describe the checks performed at preparation time; they are not a comprehensive security certification or proof of visual equivalence to the reference webpart.

> This is an independent portfolio implementation built with synthetic data. It does not contain or reproduce confidential employer code, systems, or datasets.
