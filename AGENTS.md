# Atlas repository context

- Personal repository: `Infanatoca17/business-intelligence-hub`; GitHub Pages base `/business-intelligence-hub/`.
- Official product: **Atlas Business Intelligence Hub**; UI product label: **Business Intelligence Hub**; fictional organization: **Atlas Impact Network**. Keep these identities distinct.
- Current UI branch: `atlas_ui_refresh`; original integration branch: `atlas_coworker_integration`. The product-facing assistant is **Coworker**. Use the exact underscore-separated branch name in workflow triggers and documentation.
- Use original implementation and fictional/dummy business data only. End-user UI and documents are English. Program order: Sustainability, Health, Governance, Education.
- The current README dummy-data disclaimer is authoritative. Retain third-party software/geography notices and model licensing attribution.
- Actual progress comes from deliverables; On track tolerance is ±7 percentage points. Historical monthly observations are evidence. Do not replace delivery-derived KPIs with observation averages.
- Exposure is an ordinal index. Expected financial consequences use explicit synthetic probabilities/losses in USD. Do not add the units together or describe the probabilities as calibrated.
- `src/metrics.mjs` and `src/coworker-engine.mjs` own the calculations. Python invokes `scripts/coworker-context.mjs`; avoid a second divergent formula implementation.
- Generative inference uses local LM Studio through `atlas_coworker`. Keep model weights/tokens out of the repository and frontend. Guided/fallback/model responses must remain visibly distinguished.
- Preserve one Pages workflow. Integration/PR builds validate; main alone deploys. Do not bypass a failed test to publish.
- Before delivery: `npm run build`, `npm run test:python`, `npm run test:ui`. Record any environment-limited checks and require a real local model evaluation before claiming inference was verified.
- Review is session-only and resets on scope, sample, scenario or narrative change.

- Local app/API port is 8765; LM Studio base is http://127.0.0.1:1234/v1. Preserve these defaults and same-origin AI requests.
- Main navigation contains eight portfolio views. Coworker opens from the header. Risk Scenarios is embedded in Risks. Optional workspaces remain implemented but disabled by the portfolio UI flag.
- Quarterly deliverable events are synthetic. Future quarter ends must be labelled simulations. Historical completion anchors to the authoritative snapshot; current portfolio KPIs remain unchanged. Chart download is PNG only.
