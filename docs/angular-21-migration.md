# Angular 21 migration (THFF Fuse2)

This document records the **investigation**, **rollback points**, and **recommended workflow** for moving `thff-fuse2` from **Angular 13** toward **Angular 21** (and optionally aligning with a new Fuse ThemeForest purchase).

## Rollback / “placeholder” if migration fails

Git already has a fixed point **before** any Angular 21 work:

| Artifact | Purpose |
|----------|---------|
| Branch `backup/angular-13-baseline` | Same commit as the baseline; checkout to return to Angular 13 tree. |
| Branch `feature/angular-21-fuse-migration` | Starts at the **same** commit; use this for all upgrade commits. |
| Tag `angular-13-baseline` | Annotated tag on baseline commit for `git reset --hard angular-13-baseline` or new branch from tag. |

**Recover if the migration branch is a mess:**

```bash
git checkout backup/angular-13-baseline
# or
git checkout -b fix/recover-angular13 angular-13-baseline
```

**Before starting migration**, commit or stash local changes so the baseline includes everything you care about (`git status` should be clean when you tag future baselines).

## ThemeForest Fuse on disk (verified)

Local path (example):

`~/Desktop/themeforest-i4Eyd5Kg-fuse-angularjs-material-design-admin-template/fuse/`

**Confirmed from `fuse/package.json`:**

| Item | Version |
|------|---------|
| Fuse template | **21.1.0** |
| `@angular/core` / compiler / router | **21.2.6** |
| `@angular/material` / `@angular/cdk` | **21.2.4** |
| `@angular/cli` / `@angular/build` | **21.2.5** |
| TypeScript | **5.9.3** |
| Transloco | **`@jsverse/transloco` 8.2.1** (package rename from `@ngneat/transloco`) |
| Tailwind | **4.x** (`tailwindcss` 4.2.2, `@tailwindcss/postcss`) |
| Builder | **`@angular/build:application`** (not legacy `browser` builder) |
| SSR | **`@angular/ssr`**, `outputMode: "server"` in `angular.json` |

**Engines:** `node >= 24.0.0` — use **Node 24+** when working with this template (nvm/Volta).

Quick check:

```bash
cd ~/Desktop/themeforest-i4Eyd5Kg-fuse-angularjs-material-design-admin-template/fuse
npm install
npm start   # ng serve --port=3873 per package.json
```

## What it takes to upgrade (13 → 21)

Skipping majors in one jump is **not** supported by Angular’s tooling. Expect **eight sequential major upgrades**: 13→14→15→16→17→18→19→20→21.

### 1. Environment

- **New Fuse 21 template** declares **`node >= 24`**. Plan on **Node 24** for parity with ThemeForest Fuse.
- Current **thff-fuse2** uses **Node 18** in `engines`; migration will replace that with the Fuse 21 requirement.
- Confirm [Angular version compatibility](https://angular.dev/reference/versions) when locking Node.

### 2. Core workflow (repeat per major)

For each target major `N`:

```bash
npx @angular/cli@N ng update @angular/core@N @angular/cli@N
npx @angular/cli@N ng update @angular/material@N @angular/cdk@N   # if using Material
npm install
npm run build   # or ng build
```

Fix compile errors, commit, then proceed to `N+1`. Use the official guide: [https://angular.dev/update-guide](https://angular.dev/update-guide) (set *From* / *To* and options: Material, complexity).

### 3. Major breakpoints you will likely hit

- **14–15**: RxJS / TypeScript minimums; Material **MDC** migration (visual + class renames).
- **16+**: Esbuild-based application builder; `angular.json` schema changes; stricter typing.
- **17+**: New control flow (`@if` / `@for`) optional; `standalone` migrations optional.
- **18+**: Zone.js / `provideZoneChangeDetection` and SSR/hydration options if you adopt them later.
- **19–21**: Signals, incremental hydration, ongoing Material and CLI updates.

### 4. THFF-specific app scope

This app is **not** a tiny starter: **~47** feature/layout modules under `src/app`, Fuse layout components, Transloco, custom pages (director, org, proposal, auth, etc.). Budget **substantial** time for:

- Template and DI changes from deprecations.
- Third-party packages: **`ngx-markdown`**, **`ngx-quill`**, **`ng-apexcharts`**, **`@ngneat/transloco`**, **`@ngneat/edit-in-place`** — each must have an Angular-21–compatible release or a replacement.
- **Fuse (`@fuse/*`)**: If you stay on the old Fuse sources, you must port or replace them with the **new Fuse 21** structure from ThemeForest (often easier: **new Fuse 21 app shell + copy `src/app/modules` / routes / assets** from THFF incrementally).

### 5. Two strategies

| Strategy | Pros | Cons |
|----------|------|------|
| **A. Incremental `ng update`** on this repo | Preserves git history linearly | Long chain of fixes; Fuse customizations may fight migrations. |
| **B. New project from Fuse 21 + port features** | Clean Angular 21/Fuse baseline | More manual file copying; need to merge env, routes, auth, API services. |

Many teams use **B** when the gap is **8+ majors** and the template vendor shipped a new major.

## Suggested next steps

1. Commit any pending work on `feature/director-solicitation-referral` (or merge to `develop`) so `backup/angular-13-baseline` / tag represent what you intend.
2. `git checkout feature/angular-21-fuse-migration`.
3. Compare ThemeForest Fuse 21 `package.json` with this repo; decide **A vs B** above.
4. After the first successful `ng build` on a given major, tag e.g. `angular-14-migration-ok` for intermediate safety.

## Pushing branches / tags

```bash
git push -u origin backup/angular-13-baseline
git push -u origin feature/angular-21-fuse-migration
git push origin angular-13-baseline
```
