# Run Atlas Coworker locally with LM Studio

This guide applies to Atlas Business Intelligence Hub v1.1.1 in `Infanatoca17/business-intelligence-hub`. Use your existing `atlas_coworker_integration` branch. All business data is fictional. The local service is `atlas_coworker`; Ollama is not required.

## 1. Prepare the project

Open the existing repository folder in VS Code. In a PowerShell terminal, run:

```powershell
git branch --show-current
node --version
python --version
npm.cmd ci
npm.cmd run build
```

The branch should be `atlas_coworker_integration`. Atlas supports Node 22.14+ within major 22 or Node 24, and Python 3.10+. The Python service uses the standard library and invokes the shared JavaScript calculation engine through Node. No Python package installation is needed.

## 2. Install LM Studio and select a model

Download LM Studio from [lmstudio.ai](https://lmstudio.ai/). In its model discovery/download view, search for **Qwen2.5-7B-Instruct-GGUF**, preferably the official [Qwen repository](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF), and select the **Q4_K_M** quantization when available.

This is a practical starting candidate because its model card describes instruction following and JSON/structured-data capability. It has not been benchmarked on Atlas in this delivery. Confirm LM Studio's memory estimate before downloading/loading: the model, context cache and application all need memory, and inference speed depends on your CPU/GPU. Hardware capacity was not supplied, so this is not a guaranteed fit. If it does not fit, choose a smaller instruction model that supports structured output and run the evaluation below; smaller models may be less reliable.

The project does not include model weights or automatically download a model. Model files stay in LM Studio's model storage, outside Git.

## 3. Load the model and start its local server

1. Open LM Studio's **Developer** view.
2. Load the downloaded instruction model.
3. Start with an **8192-token context window**. This is an Atlas starting setting, not a universal model requirement; reduce it only if needed and check that evidence still fits. Increase it if the server reports a context limit.
4. Start the server, using port **1234** and localhost access.
5. Keep LM Studio running while using Atlas. Local inference can operate offline after the runtime and model have been downloaded.

LM Studio offers a **Start server** control in Developer. The adapter uses its OpenAI-compatible `/v1/chat/completions` endpoint and JSON-schema response format; it does not contact OpenAI.

## 4. Get the exact model ID

In PowerShell:

```powershell
$models = Invoke-RestMethod http://127.0.0.1:1234/v1/models
$models.data | Select-Object id
```

Copy the exact ID displayed by the server. Do not assume it matches the download filename or model title. Model listing may also include downloaded models available for just-in-time loading.

If you enabled LM Studio authentication, use your token locally:

```powershell
$env:LM_STUDIO_API_KEY = "YOUR_LOCAL_TOKEN"
$headers = @{ Authorization = "Bearer $env:LM_STUDIO_API_KEY" }
$models = Invoke-RestMethod http://127.0.0.1:1234/v1/models -Headers $headers
$models.data | Select-Object id
```

Authentication is optional for the default localhost setup. Keep any token out of source files, screenshots, commits and frontend configuration.

## 5. Configure Atlas in the same PowerShell terminal

```powershell
$env:LM_STUDIO_MODEL = "PASTE_THE_EXACT_SERVER_MODEL_ID"
$env:LM_STUDIO_BASE_URL = "http://127.0.0.1:1234/v1"
$env:LM_STUDIO_TIMEOUT = "120"
python -m atlas_coworker check
```

Expected: `reachable: true` and `model_available: true`. This checks connectivity/model listing, not inference. These variables affect the Python process started from this terminal. An `.env` file is not automatically loaded. To use another port, adjust `LM_STUDIO_BASE_URL` and LM Studio together. The adapter accepts localhost HTTP addresses ending in `/v1`.

## 6. Verify a real inference

```powershell
python -m atlas_coworker evaluate --question "Draft the quarterly brief"
```

Pass: output has `"mode": "local_ai"`, a narrative and valid evidence IDs; the command exits successfully. A guided fallback is not a passing inference check. The model may take longer on its first load; the configurable timeout is supported from 5 to 300 seconds.

## 7. Run the integrated application

```powershell
python -m atlas_coworker serve
```

Open **http://127.0.0.1:8765/business-intelligence-hub/**. Keep this terminal open. If port 8765 is busy, use `python -m atlas_coworker serve --port 8766` and open the corresponding URL.

1. Open **Coworker**.
2. Click **Check connection** after starting or changing the LM Studio model.
3. Enable **Use local AI**.
4. Ask **Draft the quarterly brief**.
5. Confirm the response says **Local AI · LM Studio**.
6. Inspect citations and compare every number with the verified fact cards.
7. Open **Executive Brief** and select **Draft with Coworker**. The AI toggle persists across these views.
8. Review/edit the narrative before marking the scope reviewed.

The Python server serves the built React app and API from one origin. The Vite development/preview server runs the guided demo; it is not the documented local AI entry point. After editing frontend code, rebuild and refresh the Python-served page. Press Ctrl+C to stop Python.

## 8. Evaluate the model's usefulness

| Prompt / condition | Expected behavior |
|---|---|
| Draft the quarterly brief | Same scope, delivery, spending, exposure and baseline losses as the verified cards |
| What blocks review? with the defect sample | Identify critical findings and missing current observations; do not claim records were repaired |
| Which threats need follow-up? | Refer to supplied risk records/actions and valid source IDs |
| What changes in this scenario? after 20% / 25% / 50% | Use the current scenario figures and distinguish them from baseline |
| What is the weather? | Guided refusal; no model call for an unsupported topic |
| Stop LM Studio after enabling AI, then ask | Clearly labelled guided fallback, with no AI-generated claim |

Record model ID, quantization, context, hardware, response time, prompt, mode, citation validity and any factual errors. JSON/citation validation cannot establish that every sentence is true. The checked facts are never replaced by a model response.

## Troubleshooting

| Symptom | Check |
|---|---|
| `Use local AI` is disabled | Python-served URL, server running, exact model ID, then Check connection |
| `check` reports unreachable | LM Studio server/port and optional token; a local chat window alone is not an API server |
| Model not available | Copy an ID from `/v1/models`; load that model |
| Guided fallback | Run `evaluate`; inspect LM Studio's server logs for load, timeout, context or schema errors |
| Slow / out of memory | LM Studio memory estimate, context size and model quantization; do not assume GPU acceleration is available |
| Changed frontend is absent | Run `npm.cmd run build` again and refresh |
| App opens on GitHub Pages | That URL runs the guided demo; use the localhost URL for local inference |

## Official references

- [LM Studio local server](https://lmstudio.ai/docs/developer/core/server)
- [Structured output](https://lmstudio.ai/docs/developer/openai-compat/structured-output)
- [Model listing](https://lmstudio.ai/docs/developer/openai-compat/models)
- [Authentication](https://lmstudio.ai/docs/developer/core/authentication)
- [Offline operation](https://lmstudio.ai/docs/app/offline)
- [Qwen2.5-7B-Instruct-GGUF model card](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF)

This is a demo with dummy data. It does not contain or reproduce copyrighted, confidential or protected code, systems, or datasets.
