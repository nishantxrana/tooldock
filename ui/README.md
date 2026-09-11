# ToolDock - UI

Contributor guide for the React SPA. For the product overview, security model, deploy configs, and FAQ see the [root README](../README.md).

**Run all npm commands from this directory (`ui/`).**

## Quick start

```bash
cd ui
npm install
npm run dev   # http://localhost:5173
```

Click any Azure DevOps tool to open the inline connect form, enter organization + PAT, pick a project.

## Scripts

| Script              | What it does                                                 |
| ------------------- | ------------------------------------------------------------ |
| `npm run dev`       | Vite dev server - proxies `/ado` and `/vsrm` to Azure DevOps |
| `npm run build`     | `tsc -b` + production build → `dist/`                        |
| `npm run preview`   | Preview the production build locally                         |
| `npm run typecheck` | Strict TypeScript, no emit                                   |
| `npm run lint`      | ESLint with `--max-warnings 0`                               |
| `npm run format`    | Prettier on `src/**/*.{ts,tsx,css}`                          |

## CORS proxy

Azure DevOps sends no CORS headers. All requests use same-origin paths forwarded by a proxy. Two upstreams exist because release definitions live on a separate subdomain:

| Path      | Upstream                     | Used by                      |
| --------- | ---------------------------- | ---------------------------- |
| `/ado/*`  | `https://dev.azure.com`      | Projects, variable groups    |
| `/vsrm/*` | `https://vsrm.dev.azure.com` | Release pipeline definitions |

- **Dev:** [`vite.config.ts`](vite.config.ts) - both paths configured, browser cookies stripped
- **Prod:** [`vercel.json`](vercel.json), [`netlify.toml`](netlify.toml), [`nginx.conf.example`](nginx.conf.example)

Proxy rules must precede the SPA fallback. When they don't, requests resolve to `index.html` and the client reports "Azure DevOps did not return JSON" - a missing rewrite, not a bad PAT.

## Security summary

The PAT is held in the in-memory Zustand store (`src/store/sessionStore.ts`) with no `persist` middleware - a refresh clears it. The lock button (`src/components/layout/PersistButton.tsx`) is an opt-in that encrypts the PAT with AES-GCM-256 and stores it in IndexedDB for a rolling 30 minutes via `src/lib/utils/patVault.ts`; `src/main.tsx` restores it before React mounts.

Full write-up including vault limitations: [root README - Security](../README.md#security-model).

Required PAT scopes are defined in `src/lib/constants.ts` (`REQUIRED_PAT_SCOPES`). Release (Read) is optional and only needed by the two Release Pipelines tools.

## API versions

From `src/lib/constants.ts` (verified against Azure DevOps):

| Resource            | Version         | Proxy path |
| ------------------- | --------------- | ---------- |
| Projects            | `7.1`           | `/ado`     |
| Variable Groups     | `7.2-preview.2` | `/ado`     |
| Release definitions | `7.1`           | `/vsrm`    |

`VSRM_BASE` is a module-local constant in `src/lib/api/releaseDefinitions.ts`.

## Adding a new tool

The sidebar, home page, and routes are generated from `src/features/tools/registry.ts`.

1. Create `src/features/tools/<your-tool>/YourTool.tsx`.
2. Add one `ToolDefinition` entry to `TOOLS` in `registry.ts`.

No router or sidebar edits needed. `ToolDefinition` (in `src/types/tools.ts`) requires eight fields including `group`, which must be one of the `ToolGroup` values - `'Variable Groups' | 'Release Pipelines' | 'App Settings'`. Add a new group to both the type and `TOOL_GROUPS` to control sidebar ordering.

Set `requiresConnection: false` for paste-only tools. For gated tools, the router applies `RequireConnection` (inline form, no redirect), and the component wraps its body in `RequireProject` - connection and project selection are enforced separately.

## Keeping docs accurate

Three facts drift faster than the rest. When a change touches any of them, update this file and the [root README](../README.md) in the same merge request:

| Fact                            | Source of truth                                             |
| ------------------------------- | ----------------------------------------------------------- |
| Tool list and grouping          | `src/features/tools/registry.ts`                            |
| API versions and proxy paths    | `src/lib/constants.ts`, `src/lib/api/releaseDefinitions.ts` |
| PAT storage and vault behaviour | `src/store/sessionStore.ts`, `src/lib/utils/patVault.ts`    |

## Deploy

See [root README - Deploy](../README.md#deploy). Build with `npm run build`, serve `dist/`, and keep the `/ado/*` and `/vsrm/*` rewrites ahead of the SPA fallback.
