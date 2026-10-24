# FarmSight XAI

FarmSight XAI is an agriculture research project exploring crop data, historical weather, and explainable machine learning to support transparent crop-risk analysis. The repository includes a research notebook and a web prototype; the prototype's baseline predictions are not trained-model results.

## Project scope and boundaries

FarmSight XAI is a decision-support research prototype, not an autonomous agronomic advisory system. It combines a crop-stress research workflow with a separate farmer marketplace interface. The project does not use IoT hardware, and marketplace records are not training data. Open-Meteo is used only for live weather access; it is not a source of soil NPK or pH measurements.

## Research components

- Clean and audit ICRISAT crop records and geocoded locations.
- Acquire and validate consistent historical weather for the accepted locations.
- Prepare reproducible crop/weather features, then train and evaluate models.
- Apply SHAP and LIME after model training to investigate predictions.

## Data sources and intended roles

- **ICRISAT district-level crop records:** historical area, production, and yield evidence used for the structured research dataset.
- **CDS ERA5 time-series data:** the selected source for consistent historical temperature and precipitation acquisition.
- **Open-Meteo:** retained for current/live weather access in the web prototype and for the documented limited historical-download attempt.
- **Farmer-provided conditions:** optional operational inputs that must be identified as estimates rather than measured sensor observations.

Historical training inputs and current website weather must remain clearly separated so that annual historical features are not misrepresented as validated real-time predictions.

## Current verified dataset and weather status

The clean ICRISAT dataset contains **36,951 records**, with **229 accepted geocoded locations**. Open-Meteo historical downloads completed for **14 locations** before quota blocking.

The CDS one-day pilot and the Chittoor **1966–2017** pilot are verified. The full-span pilot contains **455,832 hourly timestamps**, with **0 missing `t2m` values** and **0 missing `tp` values**. These checks establish the pilot result; bulk CDS acquisition remains incomplete.

The latest notebook backup commit is `dd752822301d5362640fc1f036e5dcfbacb4cc9d`. See [PROJECT_STATUS.md](docs/PROJECT_STATUS.md) for the recorded checkpoint facts.

## Repository structure

| Path | Purpose |
| --- | --- |
| `notebooks/FarmSight_XAI_ML_Pipeline.ipynb` | Research workflow and saved checkpoint outputs |
| `docs/` | Verified project status and research documentation |
| `app/` | Web prototype, weather API, and marketplace API |
| `components/`, `hooks/`, `lib/` | Interface components and shared helpers |
| `db/`, `drizzle/` | Local database schema and migrations |
| `scripts/` | Dependency installation and framework runtime helpers |
| `examples/d1/` | Optional D1 integration example |

## Planned model evaluation

The planned comparison is Logistic Regression as the interpretable baseline, Random Forest as a nonlinear tree ensemble, and XGBoost as a boosted-tree candidate. Evaluation will use an appropriate chronological split, cross-validation limited to the training period, class-aware metrics, confusion matrices, and calibration or robustness checks where justified. SHAP and LIME will be applied only after a fitted model and locked evaluation results exist. No model-performance values are claimed in this README.

## Current limitations

CDS bulk acquisition is not completed. The latest batch attempt is paused because the generated Colab cells need correction; the next task is to repair and test the resumable CDS acquisition cell. Model training, evaluation, SHAP, and LIME have not started. Pilot weather validation does not establish coverage for all accepted locations, and prototype displays must not be presented as validated research results.

## Validation safeguards

- Preserve training, validation, and test separation and prevent target or temporal leakage.
- Select models using training and validation evidence rather than repeated test-set inspection.
- Record exact dataset hashes, feature definitions, chronological boundaries, random seeds, and library versions.
- Validate every retained weather file for expected timestamps, required variables, units, missing values, and returned grid coordinates.
- Treat geocoded locations as representative matched locations rather than official district centroids.
- Do not mix CDS and Open-Meteo historical observations without an explicit provider-comparison analysis.

## Reproducibility and no-fabricated-results policy

Preserve the notebook checkpoint and record data sources, request parameters, date ranges, coordinates, validation checks, and actual outputs when reproducing work. Keep credentials outside committed files. Report completed, failed, paused, and unrun work explicitly. Do not invent downloads, coverage, model metrics, evaluation outcomes, or SHAP/LIME explanations; label demonstrations and baseline predictions clearly. Claim a result only when it is supported by retained execution evidence.

## Immediate roadmap

1. Repair and validate the resumable CDS acquisition cell.
2. Complete historical weather acquisition or document the final achievable coverage.
3. Aggregate verified hourly weather into research features with explicit unit and time-boundary rules.
4. Join crop and weather records using audited district-year keys.
5. Freeze the modelling dataset and chronological split before training.
6. Train and compare the three planned models, then run relevant XAI and robustness analysis.
7. Update the research paper and web prototype only from verified outputs.

## Web prototype development

A clean full-stack starter running on [vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`
- Portable: Windows, macOS, or Linux; no Bash required
- Managed Linux: managed Linux runtime with Bash, `flock`, `curl`, `sha256sum`, and GNU `timeout`
- Git is required only for publishing

## Sites Lifecycle

The Sites initializer copies the shared starter and selects managed-linux only when `SITES_MANAGED_LINUX_CONTAINER=1`; otherwise it selects portable. It saves the selection only in ignored `.sites-runtime/execution-profile.json`. Both profiles copy/configure first, then use the plugin's separate `install-dependencies.mjs` step to measure installation independently. Edit source under `app/` and follow the Sites skill for installation, preview, builds, and publishing.

Whenever reopening or moving a checkout, run `node <plugin-root>/scripts/configure-execution-profile.mjs` before project commands. Profile changes do not alter tracked source or require reinstalling otherwise-valid dependencies; restart an existing preview to use the new selection. Do not commit or upload `.sites-runtime/`.

This starter does not use `wrangler.jsonc`.

`install:ci` runs `npm ci` once against the shared lockfile, disables parent-workspace discovery, and includes required dev/optional dependencies despite production/omit settings. Sharp defaults to prebuilt binaries unless explicitly configured otherwise. Do not overlap installers.

- **Portable:** Preserve host HOME, npm cache, registry, proxy, temporary paths, retry/concurrency settings, and lifecycle-script policy. Use `--prefer-offline --no-audit --no-fund`.
- **Managed Linux:** Use the existing project-local HOME/cache/tmp setup and Linux install lock, tarball preflight, and timeout. Restore the image-seeded npm cache only when its lockfile hash matches; retain network fallback. Builds keep their existing timeout. These helpers are not invoked by the portable profile.

`scripts/sites-env.mjs` preserves the caller's HOME, npm cache, proxy, XDG, and temporary-directory configuration while defaulting Wrangler and Miniflare state to the checkout. If npm reports an unwritable cache, select a writable path with `npm_config_cache` for that install. The `dev` and `start` scripts also keep Wrangler logs inside the checkout. Generated `.sites-runtime/` and `.wrangler/` directories are disposable and ignored by Git.

On portable, `npm run dev` uses `vinext dev` with HMR, starting at port 5173. Vinext records the running server in ignored `.vinext/` state, rejects an ordinary duplicate launch, and recovers stale state after a stopped process; exactly simultaneous starts can race. Pass `--port <port>` or `--hostname <host>` after `npm run dev --` when needed; keep portable previews on loopback.

On managed Linux, use `sites-preview start` only for requested browser QA. The project's dev script runs Vite and accepts the supervisor's `--host 0.0.0.0 --port 4173 --strictPort` arguments. The internal browser uses `http://terminal.local:4173/`; it is not a user-facing URL. The supervisor owns the preview lifecycle. The ignored local profile survives the supervisor's cleared process environment.

The portable profile simulates ChatGPT sign-in only for loopback development requests. Visit `/signin-with-chatgpt?return_to=/` to sign in as `local_seedy` (`seedy@sites.test`, display name `Seedy`) and `/signout-with-chatgpt?return_to=/` to sign out. The development cookie preserves that identity across server restarts. Mock auth is disabled in the managed-linux profile and is not included in production builds; hosted authentication remains dispatch-owned.

The Worker uses `vinext/server/fetch-handler`, including Vinext's config-aware image handling. After building, `npm start` runs that Worker locally through Wrangler on `127.0.0.1`, sharing `.wrangler/state` with dev preview and local D1 migrations; it does not deploy the site or simulate sign-in. Use the URL printed by the server. Pass `npm start -- --port <port>` to select a different built-preview port.

Local previews use Miniflare's placeholder `Request.cf` metadata without a network lookup. Set `CLOUDFLARE_CF_FETCH_ENABLED=true` to opt into fetching preview metadata; this setting does not change hosted request metadata.

Local tool usage metrics are disabled by default. Set `WRANGLER_SEND_METRICS=true` to opt in.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` starts intentionally empty
- `@cloudflare/workers-types` provides Worker types; `cloudflare-env.d.ts` declares optional `DB`/`BUCKET` bindings—update these declarations if binding names change
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

Signed-in visitors receive both `oai-authenticated-user-id` and `oai-authenticated-user-email`. Private Sites require every visitor to sign in; public Sites may also have anonymous visitors, for whom neither header is present.

The user ID is stable for the same user on the same Site and different across Sites. Use it as the durable user key; use email and name for display or contact purposes.

SIWC-authenticated workspace sites may also receive `oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty `name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by `oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use the returned `userId` as the stable user key for user-owned records; do not use email as a durable identifier.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send anonymous visitors through Sign in with ChatGPT.
- In a Server Component, start sign-in with `<a href={chatGPTSignInPath(returnTo)} target="_top">`. The auth helper module is server-only; do not import it into a Client Component.
- Do not use `fetch`, XHR, a client-side router, or a framework link that can prefetch the sign-in route. SIWC must start as a top-level navigation.
- Never request the AuthAPI authorization endpoint directly. The dispatch-owned `/signin-with-chatgpt` route must start the SIWC flow.
- Use `chatGPTSignOutPath(returnTo)` for browser sign-out links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the OAuth cookies, and identity header injection. Do not implement app routes for those reserved paths. Routes that do not import and call the helper remain anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the Sites hosting platform's access policy controls for workspace-wide restrictions, or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write actions tied to the current ChatGPT user. Leave public content anonymous.

## Local D1 migrations

For a D1-backed local preview, generate SQL with `npm run db:generate`. Build once through the Sites skill's build entrypoint (or `npm run build` for standalone use) to generate `dist/server/wrangler.json`, rebuilding if bindings change. From the project root, apply each pending migration in order:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_example.sql
```

Replace the filename with the pending migration and `DB` with your D1 binding name if different. Use `.wrangler/state`, not `.wrangler/state/v3`; Wrangler adds the versioned directories. Do not replay migrations already applied locally. This updates only the preview database; publishing applies production migrations separately.

## Diagnostic Commands

- `npm run install:ci`: perform one locked dependency install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build the deployable Sites artifact
- `npm run start`: preview the built Worker locally with D1/R2 support
- `npm run db:generate`: generate Drizzle migrations after schema changes

When using the Sites plugin, follow its skill instructions for installation, builds, and publishing. These npm commands remain available for standalone use.

The portable build runs Vinext directly without a host `timeout` command. The managed-linux build uses `scripts/build-verified.sh` and its existing `SITES_BUILD_TIMEOUT` setting.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
