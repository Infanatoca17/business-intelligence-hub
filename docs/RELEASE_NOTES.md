# Atlas Impact Network v1.0.0

Prepared 22 September 2026 as an independent portfolio application.

## Deployment hotfix

The reported GitHub Actions run passed four browser tests and failed the fifth when focus did not return to the About button after Escape. The shared modal now uses layout-effect cleanup to close the dialog while connected and explicitly restore the opening control's focus. Six regression cases cover cancel, close-button, and backdrop closure, both normally and under React StrictMode. The original Playwright focus assertion is preserved.

The reported repository is `business-intelligence-hub`. Its Pages base is now defined once in `deployment-base.mjs` and used by the build, preview tests, component tests, and output audit. Dependencies and business data are unchanged. See [DEPLOYMENT_FIX.md](DEPLOYMENT_FIX.md) for applying the patch to an existing checkout.

## Scope

The supplied webpart was inspected as a functional reference. This release contains newly authored application code, styling, a vector brand mark, and a deterministic fictional dataset. It does not copy the original React components, source CSS, screenshots, workbooks, bundles, contacts, IDs, SharePoint configuration, compiled code, or pipeline.

Eight main views, global filters, table sorting/pagination, cross-entity search, project detail, geographic exploration, chart export, workbook export, and shareable project URLs are implemented. The order of programs is Sustainability, Health, Governance, Education. The disclaimer appears in the footer, help, Project 360, chart downloads, workbook About sheets, and documentation.

## Deliberate product boundaries

This is a new portfolio edition, not full visual or behavioral parity with the reference webpart. Its visual identity, demonstration metrics, and data volumes are its own. It includes a rotatable SVG globe, not a WebGL earth renderer. Original institutional walkthrough screenshots were removed; help now explains the Atlas workflow in text.

There are no organizational connectors, email generation/sending, SharePoint installation packages, production financial systems, sign-in, or live operational data. Pipeline automation and a separate analytics application remain separate portfolio projects.

The original exposure methodology was not claimed or copied as an approved organizational standard. The About dialog and methodology document explain the independent demonstration index, its assumptions, bands, and limitations.

## Publication status

Prepared for `Infanatoca17/business-intelligence-hub` and GitHub Pages. The user has reported an initial Actions execution. No repository, commit, push, or deployment has been performed by the assistant on the user's behalf. The workflow deploys only when a `main` build passes its checks in the user's repository.
