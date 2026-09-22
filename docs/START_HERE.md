# Start here — Atlas Impact Network v1.0.0

These instructions use your personal Windows computer, **Command Prompt**, GitHub account **Infanatoca17**, and local pushes. The target repository is `Infanatoca17/program-intelligence-hub`.

## 1. Extract the new application

Create `C:\Users\USER\github-portfolio` if needed. Open the delivered ZIP and copy its `program-intelligence-hub` folder into that directory.

The correct result is:

`C:\Users\USER\github-portfolio\program-intelligence-hub\package.json`

If an earlier starter already occupies that folder, move it to a different folder first. Do not merge this application into a starter or the original reference package. Keep the reference package under `portfolio-reference`.

## 2. Select Node and install

Your installed Node 24 works with Atlas. The portable Node 22 environment used for the original preview also works. This edition supports Node 22.14+ within major 22, or major 24.

```bat
cd /d C:\Users\USER\github-portfolio\program-intelligence-hub
node --version
npm.cmd --version
npm.cmd ci
```

Keep `package-lock.json`; it enables reproducible installs. Package updates are not required to start.

## 3. Validate and run the production preview

```bat
npm.cmd run build
npm.cmd run preview
```

Open **http://127.0.0.1:4173/program-intelligence-hub/**. If port 4173 is occupied by the previous preview, stop that preview using Ctrl+C, or follow the actual address printed by Vite.

Check the following before publication:

- The header says Atlas Impact Network and the synthetic-data label is visible.
- Programs appear as Sustainability, Health, Governance, and Education.
- Every navigation tab opens and shows records.
- Program and office filters change KPIs and tables consistently.
- A chart bubble or table record opens Project 360.
- Search finds a project and a fictional person.
- XLSX, PNG, and SVG downloads work and show the synthetic-data notice.
- The mobile layout is readable, including tables that scroll horizontally.

To run the supplied automated browser checks, stop the preview first or leave it on its default port, then run:

```bat
npx.cmd playwright install chromium
npm.cmd run test:ui
```

These browser checks also run in GitHub Actions and must pass before deployment. If a check fails, use its report to resolve the failure; do not remove the check just to publish.

For development:

```bat
npm.cmd run dev
```

Use the full address shown, including `/program-intelligence-hub/`.

## 4. Create the personal GitHub repository

In your personal browser session, open https://github.com/new and check that the owner is **Infanatoca17**.

- Repository name: `program-intelligence-hub`
- Description: `Atlas Impact Network — independent program intelligence demo with synthetic data.`
- Visibility: Public, for the intended public portfolio.
- Leave automatic README, `.gitignore`, and license initialization unchecked; the package already contains the first two.

Create the repository. Do not upload the original reference ZIP or the original pipeline ZIP.

## 5. Initialize and check the local identity

From the extracted application folder:

```bat
git init -b main
git config --local user.name "Ivan Morales"
git config --local user.email "infanatoca@live.com"
git config --local credential.https://github.com.username "Infanatoca17"
git config --local --get user.name
git config --local --get user.email
```

The email must be `infanatoca@live.com`, with no backslash, and should be verified in your personal GitHub account. Local configuration leaves your global settings unchanged. Commit identity and push authentication are separate settings.

## 6. Review and push

```bat
git add .
git status --short
```

Review the list. It should contain the Atlas source, generated synthetic JSON, documentation, tests, workflow, and lockfile. `node_modules`, `dist`, and test reports are ignored. No original reference folders belong here.

```bat
git commit -m "Add Atlas Impact Network portfolio demo"
git remote add origin https://Infanatoca17@github.com/Infanatoca17/program-intelligence-hub.git
git remote -v
git push -u origin main
```

The remote must point to the personal account. If Git Credential Manager opens a browser, authenticate as **Infanatoca17**. If another account is selected, cancel that sign-in and choose your personal session. Do not paste passwords or tokens into chat or source files.

If a remote or branch already exists, inspect it before changing it. Do not force-push to resolve an unexpected existing repository.

## 7. Enable Pages and complete deployment

In the repository open **Settings → Pages**. Under **Build and deployment**, set **Source → GitHub Actions**.

Open **Actions → Validate and publish Atlas**. If the initial run failed because Pages was not enabled yet, select **Run workflow** on `main` after enabling Pages. Both the validation and deployment jobs must be green.

The intended public URL is:

https://infanatoca17.github.io/program-intelligence-hub/

Verify it in a signed-out browser window. Check a project link after reloading, all charts, and exports. These are query-string links, so they do not require a server-side router or 404 redirect workaround.

Add the live URL to the repository's **About** section once it is working.

## 8. Subsequent changes

```bat
git switch -c feature/atlas-update
```

Make and validate the change. Commit and push the branch, then review it through a pull request. Pull requests validate without deploying; merging into `main` publishes after all checks pass.

## Troubleshooting

| Symptom | Check |
|---|---|
| `package.json` not found | You are probably one directory above or below the application root. |
| Node engine warning | Select supported Node 22.14+ or 24, reopen the terminal, and check `where node`. |
| Page opens at the wrong address | Use the complete `/program-intelligence-hub/` path shown by the server. |
| `git remote add` says origin exists | Run `git remote -v`; inspect the destination before changing anything. |
| GitHub Pages assets return 404 | Check that repository name and `vite.config.ts` base match exactly. |
| Browser installer cannot download Chromium | This affects browser checks. Check access to the official Playwright download service; keep the checks enabled. |

> This is an independent portfolio implementation built with synthetic data. It does not contain or reproduce confidential employer code, systems, or datasets.
