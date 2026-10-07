# Update the existing repository — v1.2.0 UI refresh

Repository: `Infanatoca17/business-intelligence-hub`. New branch: **atlas_ui_refresh**. Baseline: the previously delivered v1.1.1 Coworker source. The update patch changes only the listed files; it does not contain `.git`, remote settings, model files or the Python service. Your Python default port remains **8765** and LM Studio remains **1234**.

## 1. Prepare a clean branch

Extract **Atlas_Business_Intelligence_Hub_v1.2.0_UI_Update.zip** outside your repository, for example into Downloads. Open your existing repository in VS Code or GitHub Desktop. In its PowerShell terminal:

```powershell
git status --short
git remote -v
```

Confirm origin is your personal `business-intelligence-hub` repository. If status lists work in progress, first commit it on its appropriate branch or save it using GitHub Desktop's stash option. Continue when status is empty. Do not discard existing changes.

```powershell
git switch main
git pull --ff-only origin main
git switch -c atlas_ui_refresh
git branch --show-current
```

Expected branch: `atlas_ui_refresh`. If it already exists because you started this update, use `git switch atlas_ui_refresh` instead of creating it again. This guide assumes main already contains v1.1.1; it is not the original v1.0.0 integration patch.

## 2. Apply only the UI update, once

Use your actual extracted path:

```powershell
$atlasPatch = "C:\Users\USER\OneDrive\Descargas\Atlas_Business_Intelligence_Hub_v1.2.0_UI_Update\Atlas_UI_v1.2.0.patch"
git apply --check $atlasPatch
```

Success normally prints nothing. Only if that check succeeds:

```powershell
git apply $atlasPatch
git diff --stat
git status --short
```

New files appear as `??` until committed; that is expected. Do not copy `changed-files/` and apply the patch afterwards: those are two alternative update methods. Do not run the same patch twice.

If the check says `already exists` or `patch does not apply`, stop before applying it. The working files may already include the update or may differ from the v1.1.1 baseline. Check `git diff` and compare the affected files with the package's `changed-files/` copies in VS Code. These copies contain only the changed/new files at their repository-relative paths. Merge your custom edits into them and copy only the reviewed files to those same paths. In particular, retain any custom local AI fixes you made. Never force the patch, replace `.git`, or overwrite the whole repository to solve a context mismatch.

The full checkpoint is a reference archive, not a folder to nest inside your checkout. `UPDATE_MANIFEST.json` records old/new SHA-256 hashes for each affected file. `CHANGED_FILES.md` lists the changes.

## 3. Validate the updated frontend and service

Stop any existing Python server with Ctrl+C before rebuilding. Use Node 22.14+ in major 22 or Node 24, and Python 3.10+:

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run test:python
npx.cmd playwright install chromium
npm.cmd run test:ui
```

Expected counts: **22 data/engine, 26 React, 11 Python and 12 browser tests**. Build also checks TypeScript and static output. Browser tests temporarily use Vite preview on 4173; this does not change the integrated service port 8765.

Keep LM Studio's Qwen model and local server running, then use the same terminal for these variables and Python:

```powershell
$env:LM_STUDIO_MODEL = "qwen2.5-7b-instruct"
$env:LM_STUDIO_BASE_URL = "http://127.0.0.1:1234/v1"
$env:LM_STUDIO_TIMEOUT = "120"
python -m atlas_coworker check
python -m atlas_coworker serve --port 8765
```

Open [http://127.0.0.1:8765/business-intelligence-hub/](http://127.0.0.1:8765/business-intelligence-hub/), then complete [WALKTHROUGH.md](WALKTHROUGH.md). If a rebuild appears stale, use Ctrl+F5. Local AI is accessed through **Coworker beside Search → Check connection → Use local AI**. No model download or server migration is required.

## 4. Review, commit and push

In GitHub Desktop, choose **atlas_ui_refresh** and review Changes. Commit the listed source, configuration, data, documentation and tests. Do not commit the extracted update ZIP, `node_modules`, `dist`, model weights or local credentials. Suggested summary: **Refresh Atlas UI and add quarterly deliverable history**.

Alternatively, after reviewing `git status --short`, use PowerShell:

```powershell
git add -- .github/workflows/pages.yml AGENTS.md README.md package.json package-lock.json scripts/generate-data.mjs src tests docs
git diff --cached --stat
git commit -m "Refresh Atlas UI and add quarterly deliverable history"
git push --set-upstream origin atlas_ui_refresh
```

The staging command is appropriate for the clean branch created above; review every staged file if you made additional edits. In Desktop, Publish branch / Push origin performs the push. A `nothing to commit` result means there are no staged changes; inspect status instead of reapplying the patch.

## 5. Merge and check GitHub Pages

1. Open [your repository](https://github.com/Infanatoca17/business-intelligence-hub).
2. Open **Pull requests → New pull request**, with **base: main**, **compare: atlas_ui_refresh**. Review Files changed, then create the PR.
3. Wait for **Validate and publish Atlas** to pass. Branch and PR runs validate; only main deploys. A failing test must be fixed before merging.
4. Choose **Merge pull request → Confirm merge** when checks and review are complete. If GitHub reports conflicts, resolve and validate them on the branch first.
5. In **Actions**, watch the new main run finish both validation and deployment. Preserve the one existing `.github/workflows/pages.yml`; Pages source should remain **GitHub Actions**.
6. Open [the public Hub](https://infanatoca17.github.io/business-intelligence-hub/) and refresh with Ctrl+F5. Check the new navigation, Coworker launcher, ribbon, embedded scenarios and PNG exports.
7. Pages runs guided mode. Verify the real local model using the localhost 8765 URL separately; Python and model weights are not published.
8. Once your working tree is clean, synchronize locally:

```powershell
git switch main
git pull --ff-only origin main
```

No remote commit, PR, merge or deployment was performed while preparing these deliverables.

## Official references

- [Creating a pull request](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request)
- [Configuring the Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
