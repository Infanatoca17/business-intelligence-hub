# Atlas Business Intelligence Hub

**Fictional organization:** Atlas Impact Network

**AI Assistant:** Coworker · **Version:** 1.2.0 · UI update 23 October 2026

**Portfolio owner:** [Ivan Morales · Infanatoca17](https://github.com/Infanatoca17)

**Live demo:** [infanatoca17.github.io/business-intelligence-hub](https://infanatoca17.github.io/business-intelligence-hub/)

> This is a demo with dummy data. It does not contain or reproduce copyrighted, confidential or protected code, systems, or datasets.

## Why does this product exist?

At organizations, decision-makers often review data from multiple sources with different reporting methods. To assist them, I designed an integrated data hub that translates complex information into simple and actionable tools that anyone can use. This demo is built using automated workflows, relational models and an intuitive interface to support informed conversations.

Coworker is an AI Assistant: It connects portfolio and project reporting data, evidence review and financial scenarios. The  demo uses verified calculations and guided templates. However, it is enabled to run Python using locally installed LM Studio models to generate insights from verified facts and evidence.

## Explore the Business Intelligence Hub in one minute

1. Start on Overview and select **Health** in the Program filter.
2. Select **Review delivery** to inspect projects behind schedule.
3. Open a project from a table or chart to explore Project 360.
4. Review its deliverables, response plan, people, and financials.
5. Open **Coworker**, select **Draft the quarterly brief**, then press **Ask Coworker** to generate a response.
6. Export a filtered workbook, download a chart as PNG.

## What is included in this Hub?

| View | Working interactions |
|---|---|
| Overview | Portfolio KPIs, exposure/progress chart, globe, multiselect scope filters and delivery attention summary |
| Projects | Total projects, schedule filter in the filter bar, progress tracker, budget by delivery status and Project 360 |
| Deliverables | Active/Closed filter in the filter bar, program pie chart, quarterly cutoff ribbon and matching register/export |
| Staff | Atlas Staff, weekly hours and Active Teams KPIs; staff-count pie by program and office hours chart |
| Financials | FY Total Budget, expenditure, forecast, burn rate; budget pie by program and financial register |
| Funding Pipeline | Multiselect opportunity stage in the filter bar; requested amount, opportunities, secured amount and program pie |
| Risks / Issues | Register-only views with Active/Closed status pies, severity/category/impact filters, probability and gross financial impact |
| Coworker | Full-portfolio verified facts; editable example question; responses only after Ask Coworker; guided, local AI and fallback modes visibly distinguished |
| Project 360 | Profile, deliverables, response plan, risks/issues, staffing, financials, funding and copyable URL |
| Search / help | Cross-portfolio search and methodology/data help |

All search-criteria dropdowns support multiple selections: **OR within a criterion, AND across criteria**. Selected controls are highlighted; removable chips identify every active filter. Reset filters clears the full portfolio selection. Scope and view-specific filters survive URL reloads. Chart clicks select one category.

Status is **Active** or **Closed** for projects, deliverables, threats, staff allocations and response plans. Closed deliverables are 100% complete; an active deliverable is overdue when its due date precedes the cutoff. Schedule bands, opportunity stages and management-action workflow remain distinct from lifecycle status.

Charts export as **PNG**. Tables and current views export as **XLSX**, retaining numeric cells, white headers, worksheet filters and the dummy-data notice. The optional quality, scenario, brief and methodology components/calculations remain in source but are hidden from standard navigation. Risks displays its register only.

## Data and methodology

- 48 projects (40 Active, 8 Closed; two closed examples per program), 288 deliverables, and 48 response plans.
- 96 risks and 48 issues, with dummy probability, USD loss and delay assumptions.
- 96 unique fictional staff members and 48 financial records.
- 24 funding opportunities and 24 fictional demonstration sites.
- 576 monthly observations: 12 per project, October 2025–September 2026.
- 6 dummy methodology/evidence documents, plus inspectable project and reporting records.

Four future-start projects remain Active with zero progress/spending and no execution-cost projection. Eight closed projects have 100% completion, ended timelines, closed deliverables and closed threats. These dummy examples deliberately change the snapshot metrics; IDs, record counts and formulas are preserved.

Current progress is the mean completion of each project's deliverables. **On track** uses a **±7 percentage-point** tolerance. The ordinal exposure index and expected financial loss use the same non-closed threats but retain separate units. Likelihood levels 1–5 map to **10%, 25%, 45%, 65%, 85%** probabilities; occurred issues use **100%**.

See [METHODOLOGY.md](docs/METHODOLOGY.md), [DATA_DICTIONARY.md](docs/DATA_DICTIONARY.md), and [RELEASE_NOTES.md](docs/RELEASE_NOTES.md).

## Run, validate and update

To run locally, use Node 22.14+ in major 22 or Node 24, and Python 3.10+.

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run test:python
npx.cmd playwright install chromium
npm.cmd run test:ui
npm.cmd run preview
```

Preview: [127.0.0.1:4173/business-intelligence-hub](http://127.0.0.1:4173/business-intelligence-hub/). The guided demo does not require Python or a model.

- Existing repository/branch: [UPDATE_EXISTING_REPOSITORY.md](docs/UPDATE_EXISTING_REPOSITORY.md).
- Local AI installation, model choice, exact model ID and real inference check: [LM_STUDIO_SETUP.md](docs/LM_STUDIO_SETUP.md).
- Manual checks and reference figures: [WALKTHROUGH.md](docs/WALKTHROUGH.md).
- Executed tests and practical limitations: [VALIDATION.md](docs/VALIDATION.md).

There is one workflow, `.github/workflows/pages.yml`. It validates the integration branch, pull requests and main. It publishes the frontend to GitHub Pages only after main passes validation. Python and LM Studio run on your local computer, not on GitHub Pages.

## Run Coworker with local AI (LM Studio)

The public [Coworker demo](https://infanatoca17.github.io/business-intelligence-hub/?view=coworker) uses pre-loaded settings and guided calculations. Real local generation uses the Python-served app on **8765** and LM Studio on **1234**, on the same computer.

1. Open LM Studio, load **Qwen2.5-7B-Instruct-GGUF (Q4_K_M)** or your existing instruction model, and start the API server in **Developer**. See [LM Studio's local server guide](https://lmstudio.ai/docs/developer/core/server).
2. Open PowerShell in this repository. List the server models and copy the exact instruction-model ID:

   ```powershell
   $models = Invoke-RestMethod -Uri "http://127.0.0.1:1234/v1/models"
   $models.data | Select-Object id
   ```

3. Set the following variables in that same terminal. Replace the model ID if your listing differs:

   ```powershell
   $env:LM_STUDIO_MODEL = "qwen2.5-7b-instruct"
   $env:LM_STUDIO_BASE_URL = "http://127.0.0.1:1234/v1"
   $env:LM_STUDIO_TIMEOUT = "120"
   npm.cmd ci
   npm.cmd run build
   python -m atlas_coworker check
   python -m atlas_coworker evaluate --question "Draft the quarterly brief"
   ```

   `check` should show `reachable: true` and `model_available: true`. The evaluation must show `mode: local_ai`; a model listing or guided fallback does not verify inference. Python uses its standard library; no Python packages are required.
4. Start Atlas and keep both applications running:

   ```powershell
   python -m atlas_coworker serve --port 8765
   ```

5. Open [local Coworker](http://127.0.0.1:8765/business-intelligence-hub/?view=coworker), click **Check connection**, enable **Use local AI**, and press **Ask Coworker**. Confirm **Local AI · LM Studio** and compare the narrative with verified figures.

Coworker always uses the complete current-snapshot portfolio. Portfolio filters remain available when you return to another tab. Selecting a sample question only fills the prompt. Changing the question clears the previous response. Public Pages does not connect to your local model in this update; the same-origin service configuration is preserved.

If your server requires authentication, use `LM_STUDIO_API_KEY` in the Python terminal and an Authorization header when listing models. Keep tokens and model weights out of Git. See [the detailed setup and troubleshooting guide](docs/LM_STUDIO_SETUP.md).

## Architecture

```mermaid
flowchart TB
    G["Deterministic generator"] --> D["Atlas data and evidence"]
    D --> M["Shared calculation engine"]
    M --> U["React hub and Coworker"]
    U --> E["Charts, workbooks and briefs"]
    M --> S["Local Python service"]
    S <--> L["LM Studio local model"]
    S --> U
    V["Data, React, Python and browser checks"] --> B["Vite static build"]
    B --> P["GitHub Pages guided demo"]
```

The public application loads its data, geography, styling and logo from compiled assets. It has no operational data connectors, remote fonts, analytics, external images or sign-in. It makes a same-origin capability request to detect the optional local service; on Pages, local AI is unavailable and guided mode remains usable. The GitHub profile link opens only when selected by a visitor.

For local inference, the Python service serves the built frontend and API from localhost. It calls LM Studio's localhost endpoint and keeps optional LM Studio authentication in the server environment. The model can draft text; it cannot replace calculated figures, repair records, send messages or approve reports.

## Dependencies, attribution and licensing

Exact frontend dependency versions are recorded in `package-lock.json`. Model weights are not included. Public geographic data and third-party software notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md); model licensing belongs to the selected model's source.

This product's concept, direction and implementation belong to Ivan Morales.