# Fix the failed Pages validation

This hotfix is for the reported `business-intelligence-hub` repository and the original Atlas v1.0.0 source. It corrects dialog focus restoration and the GitHub Pages asset base. It keeps all five Playwright tests enabled.

## Apply to the existing repository

1. Extract the updated ZIP into a temporary folder. It contains the full corrected application and `ATLAS_DEPLOYMENT_FIX.patch` alongside it.
2. Copy only `ATLAS_DEPLOYMENT_FIX.patch` into your existing repository root, beside `package.json`.
3. Open Command Prompt in that existing root. Stop any old preview with Ctrl+C before testing.

Inspect your checkout and destination:

```bat
git status --short
git branch --show-current
git remote -v
```

The remote should be your personal `Infanatoca17/business-intelligence-hub` repository. Work from the existing `main` checkout used for deployment. If you are on another branch, retain that branch and use your normal pull-request workflow to merge the fix into `main`.

Check that the patch applies, then apply it:

```bat
git apply --check --ignore-space-change ATLAS_DEPLOYMENT_FIX.patch
git apply --ignore-space-change ATLAS_DEPLOYMENT_FIX.patch
```

Only run the second command if the check succeeds. A successful check normally prints nothing. These commands do not overwrite conflicting edits or force a merge. If the check fails, keep your current files and inspect the indicated conflict before proceeding. Do not use a reject/force option.

The patch modifies the shared modal, build/preview configuration, audit, component regression tests, and documentation. It adds `deployment-base.mjs` as the single source of the `/business-intelligence-hub/` base. Your local folder can have a different name. If your actual remote has a different repository name, change the base in this one new file before building.

## Validate

Dependencies have not changed. If `node_modules` already exists, no reinstall is required; otherwise run `npm.cmd ci` first.

```bat
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:ui
```

Expected results are **7 data tests + 15 component tests**, a successful build, and **5 passed** from Playwright. The browser installer is only needed once per required browser version. If browser checks fail, inspect the failure before pushing.

For a manual check, run `npm.cmd run preview` and open:

http://127.0.0.1:4173/business-intelligence-hub/

Focus the `?` About button, press Enter, then Escape. Focus should return to `?`, allowing keyboard navigation to continue. Stop the preview before running a fresh automated suite.

## Commit and push

Review the changes, then stage only the patch's files:

```bat
git diff --stat
git add src/main.tsx deployment-base.mjs vite.config.ts playwright.config.ts vitest.config.ts scripts/audit-build.mjs tests/components.test.tsx
git add README.md docs/START_HERE.md docs/RELEASE_NOTES.md docs/VALIDATION.md docs/DEPLOYMENT_FIX.md
git diff --cached --stat
git commit -m "Fix dialog focus restoration and Pages base path"
git push
```

The patch file is not staged by these commands; you can move it outside the repository after applying it. No `git init`, new remote, or new repository is needed.

In GitHub Actions, inspect the **new run for the new commit**. Re-running the old failed execution uses the old code. After the validation and deployment jobs succeed, the intended URL is:

https://infanatoca17.github.io/business-intelligence-hub/

## Why it failed

Escape called the React close handler, which unmounted the dialog. The original passive-effect cleanup called `dialog.close()` after the dialog had been removed. Native focus restoration did not return focus to the About button in the reported Chromium run.

The correction records the opening element before `showModal()`, uses `useLayoutEffect` cleanup to close before DOM removal, and explicitly restores that element's focus if it still exists. It also restores the previous body overflow setting. The common component handles About and Project 360.

The base-path correction is separate: Vite project sites need the repository name in their asset base. The previous package used `/program-intelligence-hub/`, while the reported Actions run belongs to `business-intelligence-hub`.

References: [React useLayoutEffect](https://react.dev/reference/react/useLayoutEffect), [Vite GitHub Pages deployment](https://vite.dev/guide/static-deploy.html#github-pages).

> This is an independent portfolio implementation built with synthetic data. It does not contain or reproduce confidential employer code, systems, or datasets.
