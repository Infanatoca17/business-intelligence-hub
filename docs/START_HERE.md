# Start here — Atlas Business Intelligence Hub v1.2.0

This UI refresh targets your existing `Infanatoca17/business-intelligence-hub` repository after the v1.1.1 Coworker integration has been merged into main. Create a new branch named **atlas_ui_refresh**. The complete source ZIP is a historical checkpoint; use the smaller UI Update package to change only the affected files.

1. Follow [UPDATE_EXISTING_REPOSITORY.md](UPDATE_EXISTING_REPOSITORY.md): start from clean, updated main, create the new branch, check and apply the patch once.
2. Run `npm.cmd ci` and `npm.cmd run build`.
3. Run `npm.cmd run test:python`, `npx.cmd playwright install chromium` and `npm.cmd run test:ui`.
4. Keep the already validated LM Studio model/server running. In the terminal that will start Python, set model ID `qwen2.5-7b-instruct`, base `http://127.0.0.1:1234/v1` and timeout `120`. Run `python -m atlas_coworker check`, then `python -m atlas_coworker serve --port 8765`.
5. Open [the local Hub](http://127.0.0.1:8765/business-intelligence-hub/), launch Coworker from the header, check connection and enable local AI. See [LM_STUDIO_SETUP.md](LM_STUDIO_SETUP.md).
6. Complete [WALKTHROUGH.md](WALKTHROUGH.md), especially the ribbon cut, export reconciliation, responsive layout and local inference checks.
7. Review/commit/push **atlas_ui_refresh**, open a PR to main, wait for validation, then merge. The same single workflow validates and publishes main to Pages.

See [UI_REFRESH.md](UI_REFRESH.md) for the implementation choices, retained code and exact changed-file list; [VALIDATION.md](VALIDATION.md) distinguishes executed tests from browser and real-model checks still needed.

Source, tests, geography, Python service, configuration and documentation are included. Installed dependencies, build output, model weights, credentials and Git history are excluded from the checkpoint. Rebuild before starting Python.

> This is a demo with dummy data. It does not contain or reproduce copyrighted, confidential or protected code, systems, or datasets.
