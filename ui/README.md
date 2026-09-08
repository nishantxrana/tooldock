# ToolDock (UI)

Contributor guide for the React SPA. For the product overview, security model, deploy configs, and FAQ, see the [root README](../README.md).

**Package root:** run all npm commands from this directory (`ui/`).

## Quick start

```bash
cd ui
npm install
npm run dev        # http://localhost:5173
```

Enter organization + PAT on the connection screen, pick a project, then use the tools.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server (proxies `/ado` and `/vsrm` to Azure DevOps) |
| `npm run build` | `tsc -b` + production build → `dist/` |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Strict TypeScript, no emit |
| `npm run lint` | ESLint with `--max-warnings 0` |
| `npm run format` | Prettier on `src/**/*.{ts,tsx,css}` |

## CORS proxy

Azure DevOps sends no CORS headers, so all requests use same-origin paths. There are two, because release definitions live on a separate subdomain:

| Path | Upstream | Used by |
| --- | --- | --- |
| `/ado/*` | `https://dev.azure.com` | Projects, variable groups |
| `/vsrm/*` | `https://vsrm.dev.azure.com` | Release pipeline definitions |

- **Dev:** [vite.config.ts](vite.config.ts) — both paths, both strip browser cookies
- **Prod:** [vercel.json](vercel.json), [netlify.toml](netlify.toml), [nginx.conf.example](nginx.conf.example)

Proxy rules must precede the SPA fallback. When they don't, the request resolves to `index.html` and the client's content-type guard reports "Azure DevOps did not return JSON" — a missing rewrite, not a bad PAT.

## Security (summary)

The PAT lives in the in-memory Zustand store (`src/store/sessionStore.ts`), which has no `persist` middleware — a refresh clears it. The header lock button (`src/components/layout/PersistButton.tsx`) is an opt-in that encrypts the PAT with AES-GCM-256 and stores it in IndexedDB for a rolling 30 minutes via `src/lib/utils/patVault.ts`; `src/main.tsx` restores it before React mounts. Auth header: `Basic base64(":" + PAT)`.

Full write-up, including what the vault does and does not protect against: [root README — Security](../README.md#security-model).

Required PAT scopes are listed in `src/lib/constants.ts` (`REQUIRED_PAT_SCOPES`). Release (Read) is optional and only needed by the two Release Pipelines tools.

## API versions

From `src/lib/constants.ts` (verified against Azure DevOps):

| Resource | Version | Base path |
| --- | --- | --- |
| Projects | `7.1` | `/ado` |
| Variable Groups | `7.2-preview.2` | `/ado` |
| Release definitions | `7.1` | `/vsrm` |

Plain `7.2` for projects is rejected without a preview flag, so the released `7.1` is used. Variable groups are preview-only. `VSRM_BASE` is a module-local constant in `src/lib/api/releaseDefinitions.ts`.

## Adding a new tool

The sidebar, the home page, and the routes are all generated from `src/features/tools/registry.ts`.

1. Create `src/features/tools/<your-tool>/YourTool.tsx`.
2. Add one `ToolDefinition` entry to `TOOLS` in `registry.ts`.

No router or sidebar edits needed. `ToolDefinition` (in `src/types/tools.ts`) requires all eight fields, including `group`, which must be one of the `ToolGroup` values — `'Variable Groups' | 'Release Pipelines' | 'App Settings'`. Add a new group to both the type and `TOOL_GROUPS` so the sidebar renders it in the intended order.

Set `requiresConnection: false` for paste-only tools. For gated tools, the router applies `RequireConnection`, but the component must wrap its own body in `RequireProject` — connection and project selection are enforced separately.

## Keeping the docs accurate

Three facts drift faster than the rest. When a change touches any of them, update this file and the [root README](../README.md) in the same merge request:

| Fact | Source of truth |
| --- | --- |
| Tool list and grouping | `src/features/tools/registry.ts` |
| API versions and base paths | `src/lib/constants.ts`, `src/lib/api/releaseDefinitions.ts` |
| How the PAT is stored | `src/store/sessionStore.ts`, `src/lib/utils/patVault.ts` |

## Deploy

See [root README — Deploy](../README.md#deploy). Build with `npm run build`, serve `dist/`, and keep the `/ado/*` and `/vsrm/*` rewrites ahead of the SPA fallback.
