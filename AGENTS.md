# Atlas repository context

- Personal repository: `Infanatoca17/business-intelligence-hub`; GitHub Pages base `/business-intelligence-hub/`.
- Official product: **Atlas Business Intelligence Hub**; UI product label: **Business Intelligence Hub**; fictional organization: **Atlas Impact Network**. Keep these identities distinct.
- Integration branch: `atlas_coworker_integration`. The product-facing assistant is **Coworker**. Use the exact underscore-separated branch name in workflow triggers and documentation.
- Use original implementation and fictional/dummy business data only. End-user UI and documents are English. Program order: Sustainability, Health, Governance, Education.
- The current README dummy-data disclaimer is authoritative. Retain third-party software/geography notices and model licensing attribution.
- Actual progress comes from deliverables; On track tolerance is ±7 percentage points. Historical monthly observations are evidence. Do not replace delivery-derived KPIs with observation averages.
- Exposure is an ordinal index. Expected financial consequences use explicit synthetic probabilities/losses in USD. Do not add the units together or describe the probabilities as calibrated.
- `src/metrics.mjs` and `src/coworker-engine.mjs` own the calculations. Python invokes `scripts/coworker-context.mjs`; avoid a second divergent formula implementation.
- Generative inference uses local LM Studio through `atlas_coworker`. Keep model weights/tokens out of the repository and frontend. Guided/fallback/model responses must remain visibly distinguished.
- Preserve one Pages workflow. Integration/PR builds validate; main alone deploys. Do not bypass a failed test to publish.
- Before delivery: `npm run build`, `npm run test:python`, `npm run test:ui`. Record any environment-limited checks and require a real local model evaluation before claiming inference was verified.
- Review is session-only and resets on scope, sample, scenario or narrative change.
