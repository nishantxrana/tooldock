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
| `npm run dev` | Vite dev server (proxies `/ado` → `https://dev.azure.com`) |
| `npm run build` | `tsc -b` + production build → `dist/` |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Strict TypeScript, no emit |
| `npm run lint` | ESLint with `--max-warnings 0` |
| `npm run format` | Prettier on `src/**/*.{ts,tsx,css}` |

## CORS proxy

Azure DevOps sends no CORS headers. App code calls `/ado/*`; the proxy forwards to `https://dev.azure.com`:

- **Dev:** [vite.config.ts](vite.config.ts)
- **Prod:** [vercel.json](vercel.json), [netlify.toml](netlify.toml), [nginx.conf.example](nginx.conf.example)

## Security (summary)

PAT lives only in the in-memory Zustand store (`src/store/sessionStore.ts`). Refresh clears it. Header: `Basic base64(":" + PAT)`. Full write-up: [root README — Security](../README.md#security-model).

Required PAT scopes are listed in `src/lib/constants.ts` (`REQUIRED_PAT_SCOPES`).

## API versions

From `src/lib/constants.ts` (verified against Azure DevOps):

| Resource | Version |
| --- | --- |
| Projects | `7.1` |
| Variable Groups | `7.2-preview.2` |

Plain `7.2` for projects is rejected without a preview flag, so the released `7.1` is used.

## Adding a new tool

Sidebar and routes are generated from `src/features/tools/registry.ts`.

1. Create `src/features/tools/<your-tool>/YourTool.tsx`.
2. Add one `ToolDefinition` entry to `TOOLS` in `registry.ts`.

No router or sidebar edits needed. Set `requiresConnection: false` for paste-only tools.

## Deploy

See [root README — Deploy](../README.md#deploy). Build with `npm run build`, serve `dist/`, and keep `/ado/*` rewrites ahead of the SPA fallback.
