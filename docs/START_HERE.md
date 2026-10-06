# Start here — Atlas Business Intelligence Hub v1.1.1 with Coworker

Target: your existing `Infanatoca17/business-intelligence-hub` repository and `atlas_coworker_integration` branch. Use this exact branch name; the assistant is called **Coworker** and the fictional organization remains **Atlas Impact Network**.

1. Apply the update using [UPDATE_EXISTING_REPOSITORY.md](UPDATE_EXISTING_REPOSITORY.md). Do not initialize another repository.
2. Install with `npm.cmd ci`, then run `npm.cmd run build`.
3. Run `npm.cmd run test:python`, `npx.cmd playwright install chromium`, and `npm.cmd run test:ui`.
4. Try the guided app with `npm.cmd run preview` at [127.0.0.1:4173/business-intelligence-hub](http://127.0.0.1:4173/business-intelligence-hub/).
5. Follow [LM_STUDIO_SETUP.md](LM_STUDIO_SETUP.md) to install/load the model and run the integrated app from Python at port 8765.
6. Complete [WALKTHROUGH.md](WALKTHROUGH.md), including matching export figures and review reset.
7. Review, commit and push the integration branch. Open a pull request to main. The single workflow validates the branch/PR; merging a validated PR to main triggers Pages publication.

The public URL keeps working in guided mode without a model. Local AI runs from the Python-served localhost URL. This package includes source and an update patch; dependencies, builds, model weights and Git history are excluded.

> This is a demo with dummy data. It does not contain or reproduce copyrighted, confidential or protected code, systems, or datasets.
