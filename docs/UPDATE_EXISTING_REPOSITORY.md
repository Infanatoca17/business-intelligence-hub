# Update the existing Atlas Business Intelligence Hub repository

Target: `Infanatoca17/business-intelligence-hub`, branch **`atlas_coworker_integration`**. This v1.1.1 update was built from the supplied `business-intelligence-hub-atlas_coworker_integration.zip` (Atlas v1.0.0 source). It includes the complete Coworker integration and naming changes. It does not replace `.git`, your remote or repository history.

## 1. Select or rename the integration branch

Extract this update ZIP outside your repository. Open your existing repository in GitHub Desktop and select **atlas_coworker_integration**. Open the repository in VS Code and run in PowerShell:

```powershell
git branch --show-current
git remote -v
git status --short
```

Confirm the branch and personal repository. Preserve unrelated local changes before applying the patch. If the requested branch already exists, select it; no rename is needed.

If your current branch is an older **integration branch**, rename that local branch while it is checked out:

```powershell
git branch -m atlas_coworker_integration
```

Do not run this rename while on `main`. If you are on main and the integration branch does not yet exist, create it instead:

```powershell
git switch -c atlas_coworker_integration
```

These are alternatives, not commands to execute together. Renaming a local branch does not rename/delete its old remote counterpart; the final push explicitly creates/updates the new remote name. An older remote branch can be left untouched.

## 2. Check and apply the update

Set the extracted patch's full path, using your actual folder:

```powershell
$atlasPatch = "C:\Users\YOUR_USER\Downloads\Atlas_Business_Intelligence_Hub_v1.1.1_Coworker_Update\Atlas_Business_Intelligence_Hub_v1.1.1.patch"
git apply --check $atlasPatch
```

A successful check normally prints nothing. Only after it succeeds:

```powershell
git apply $atlasPatch
git diff --stat
git status --short
```

The patch is checked against the uploaded branch's files. If you have already applied another integration or edited those files, the check may fail: do not force it. Compare with the supplied `project/` source in VS Code, preserve your edits and integrate the corresponding changes. `project/` is a source reference; do not nest it inside the checkout or replace `.git`.

## 3. Validate locally

Use Node 22.14+ within major 22 or Node 24, and Python 3.10+ for the local service:

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run test:python
npx.cmd playwright install chromium
npm.cmd run test:ui
npm.cmd run preview
```

Expected: 16 data/engine, 21 React, 11 Python and 10 browser tests; successful types, production build and audit. Open [127.0.0.1:4173/business-intelligence-hub](http://127.0.0.1:4173/business-intelligence-hub/).

Check the banner **Independent Demo | All Data is Synthetic | About the Data**, the header **Business Intelligence Hub**, the browser title **Atlas Business Intelligence Hub**, and the retained **Atlas Impact Network** organization. Complete [WALKTHROUGH.md](WALKTHROUGH.md). Stop preview with Ctrl+C.

For local inference, follow [LM_STUDIO_SETUP.md](LM_STUDIO_SETUP.md). The preview/Pages website uses guided mode; Python serves the integrated localhost app.

## 4. Commit and push the exact branch name

In GitHub Desktop review the changed/new files and commit on `atlas_coworker_integration`, for example **Integrate Coworker and Business Intelligence Hub branding**. Do not select extracted update copies, model files or environment tokens.

From VS Code's PowerShell terminal, explicitly push and set the new upstream:

```powershell
git push --set-upstream origin atlas_coworker_integration
```

This pushes the requested name even if a previous integration branch had a different upstream. GitHub Desktop can then use Push origin for future commits. No remote branch deletion is required.

## 5. Validate and publish

1. Open a pull request from `atlas_coworker_integration` to `main`.
2. Inspect **Validate and publish Atlas** for the new commit. Branch/PR runs validate without publishing.
3. Review and merge after validation succeeds. The main run validates again before deploying `dist/` to Pages.
4. Confirm [infanatoca17.github.io/business-intelligence-hub](https://infanatoca17.github.io/business-intelligence-hub/).

Keep one workflow, `.github/workflows/pages.yml`, whose push trigger uses the exact new branch. Settings → Pages should use GitHub Actions. The repository and `/business-intelligence-hub/` Pages base remain unchanged. Python/LM Studio run locally; they are not deployed by Pages.

No remote commit, push, PR, merge or deployment was performed in this delivery. See [VALIDATION.md](VALIDATION.md) for executed checks and model-evaluation limits.

> This is a demo with dummy data. It does not contain or reproduce copyrighted, confidential or protected code, systems, or datasets.
