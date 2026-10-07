# Keep Coworker running locally with LM Studio — v1.2.0

You already validated **Qwen2.5-7B-Instruct-GGUF, Q4_K_M**, server model ID **qwen2.5-7b-instruct**, and LM Studio at **http://127.0.0.1:1234/v1**. This UI update retains that setup and the Python application/API on **8765**. There is no need to download the model again or change providers.

## 1. Keep the LM Studio server available

Keep the **Local Model API** screen you already used open, load the Qwen instruction model and enable its API server on port **1234**. Depending on the LM Studio version, server controls may be shown in the Developer view instead. The important check is the endpoint response below, not the name of the navigation item. Keep the server bound to localhost. Retain your validated context/runtime settings; 8192 tokens is a starting context if setting up a new instance, not a requirement to overwrite a working one.

In PowerShell:

```powershell
$models = Invoke-RestMethod -Uri "http://127.0.0.1:1234/v1/models"
$models.data | Select-Object id
```

The list must include **qwen2.5-7b-instruct**. It can also include an embedding model. Copy only the instruction model's single ID into `LM_STUDIO_MODEL`; do not copy the entire multi-line model list. Listing establishes connectivity and model visibility, not successful generation.

If you previously enabled authentication, retain your server token in this terminal's environment and use it when listing models. Never place it in React or Git:

```powershell
$env:LM_STUDIO_API_KEY = "YOUR_LOCAL_TOKEN"
$headers = @{ Authorization = "Bearer $env:LM_STUDIO_API_KEY" }
$models = Invoke-RestMethod -Uri "http://127.0.0.1:1234/v1/models" -Headers $headers
```

## 2. Rebuild and check the service

Open the existing repository's updated **atlas_ui_refresh** branch. Stop an old Python instance with Ctrl+C. In the terminal you will use for Python:

```powershell
npm.cmd ci
npm.cmd run build
$env:LM_STUDIO_MODEL = "qwen2.5-7b-instruct"
$env:LM_STUDIO_BASE_URL = "http://127.0.0.1:1234/v1"
$env:LM_STUDIO_TIMEOUT = "120"
python -m atlas_coworker check
```

Expected: `local_server: true`, `reachable: true`, `model_available: true`, with the exact Qwen ID. These environment variables apply to processes launched from this terminal. A new terminal needs them again; an `.env` file is not automatically loaded. The Python service uses the standard library and the shared Node calculation engine; no Python package installation is needed.

## 3. Verify a new-version inference

```powershell
python -m atlas_coworker evaluate --question "Draft the quarterly brief"
```

Expected: `mode: local_ai`, narrative text and valid evidence IDs. A guided fallback is not a passing inference check. The first inference can load/warm the model; timeout supports 5–300 seconds. The previously validated v1.1.1 model must still be checked against this changed data/context bundle.

## 4. Serve the frontend and assistant API together

```powershell
python -m atlas_coworker serve --port 8765
```

Open **[http://127.0.0.1:8765/business-intelligence-hub/](http://127.0.0.1:8765/business-intelligence-hub/)** and keep Python and LM Studio running.

1. Click the green **Coworker** launcher beside Search in the header.
2. In **Local model connection**, click **Check connection**.
3. Enable **Use local AI**.
4. Click **Draft the quarterly brief**, then **Ask Coworker** if needed.
5. Confirm **Local AI · LM Studio**, not Guided demo or Guided fallback.
6. Inspect inline citations such as **CALC-PORTFOLIO** and compare all narrative numbers with the verified cards and XLSX.

The readiness banner and separate Sources panel have been removed; connection checks, the AI toggle, request handling and evidence dialogs remain. This version does not expose the optional Executive Brief workspace. The local model drafts text and cannot replace calculated facts, repair source records or approve a report.

## 5. Recheck scope and fallback

| Check | Expected result |
|---|---|
| All programs, quarterly brief | 48 projects, 56.0% delivery, $20,617,744 spending and $6,703,756.25 baseline expected consequences |
| Health, quarterly brief | 12 projects, 58.5% delivery and $5,097,830 spending |
| Risks → Risk scenarios, change assumptions; then Coworker | Scenario facts use the same retained parameters and global scope |
| Unsupported prompt such as weather | Guided refusal; no invented portfolio facts |
| Stop LM Studio, then ask with AI enabled | Clearly labelled fallback; no claim of model-generated success |

Record model ID, quantization, context, hardware, response time and factual errors when evaluating. Structured JSON and valid citation IDs do not prove every generated sentence.

## Troubleshooting

| Symptom | Correction |
|---|---|
| `model_available: false` | Set `$env:LM_STUDIO_MODEL = "qwen2.5-7b-instruct"` on one line, load that model, rerun check and restart Python |
| No local AI / connection appears inactive | Use the **8765 Python-served URL**; Vite preview on 4173 and Pages do not serve the assistant API |
| Environment changed but UI uses the old model | Stop Python, set variables in that same terminal, restart on 8765 |
| Port 8765 already in use | Close your earlier Atlas Python instance, then restart on 8765; avoid moving to another port |
| API unreachable | Start LM Studio's server on 1234; check its optional authentication |
| Guided fallback | Run `evaluate`; inspect model logs for timeout, context or structured-output errors |
| New UI is absent | Rebuild, restart Python and Ctrl+F5 the local page |

The adapter calls local `/v1/chat/completions` with JSON-schema response format. It does not contact OpenAI. GitHub Pages publishes only the guided static frontend; use localhost for local AI.

## Official references

- [LM Studio local server](https://lmstudio.ai/docs/developer/core/server)
- [Server settings](https://lmstudio.ai/docs/developer/core/server/settings)
- [OpenAI-compatible model listing](https://lmstudio.ai/docs/developer/openai-compat/models)
- [Structured output](https://lmstudio.ai/docs/developer/openai-compat/structured-output)
- [Qwen model card and license](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF)
