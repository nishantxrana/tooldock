# ToolDock

**Productivity tools for Azure DevOps engineers.**

A polished, **frontend-only** toolkit that eliminates repetitive Variable Group /
App Service deployment chores in Azure DevOps. No backend, no database — you paste
a Personal Access Token (PAT) once per session and everything runs in your browser.

## Tools

| Tool | What it does |
| --- | --- |
| **Generate App Service Settings** | Turn a variable group into the `-KEY "$(KEY)"` string for the App Service Deploy task. |
| **Compare vs App Settings** | Diff a variable group against pasted App Settings (matched / missing / extra / duplicates). |
| **CSV Import** | Import `Key,Value` CSV into a variable group, with a full preview and explicit confirmation before writing. |
| **Export Variable Group** | Export a variable group as CSV, JSON, or TXT. |
| **Duplicate Finder** | Find duplicate keys in pasted App Settings, with line numbers. |
| **Sort App Settings** | Sort pasted App Settings alphabetically. |

## Tech stack

React + TypeScript (strict) · Vite · React Router · Tailwind CSS · shadcn/ui ·
Lucide · TanStack Query · Zustand.

## Security model

- The PAT lives **only in runtime memory** (a Zustand store). No `localStorage`,
  `sessionStorage`, cookies, or IndexedDB. **Refreshing the page clears it** and
  forces reconnection.
- The PAT is used solely to build the `Authorization: Basic base64(":" + PAT)`
  header for Azure DevOps requests. It is never logged.

## The CORS proxy (important)

The Azure DevOps REST API does **not** send CORS headers, so browser JavaScript
cannot call `https://dev.azure.com` directly. ToolDock therefore calls a relative
path `/ado/*` that a **same-origin proxy** forwards to Azure DevOps:

- **Development:** the Vite dev server proxies `/ado` → `https://dev.azure.com`
  (see `vite.config.ts`).
- **Production:** deploy behind a reverse proxy that rewrites `/ado/*` the same way.
  Ready-made configs are included:
  - `vercel.json` (Vercel rewrites)
  - `netlify.toml` (Netlify redirects)
  - `nginx.conf.example` (nginx `proxy_pass`)

The PAT only ever travels from the browser toward Azure DevOps through this proxy.

## Required PAT scopes

Create a PAT (Azure DevOps → User settings → Personal access tokens) with the
**minimum** scopes:

- **Variable Groups** → *Read, create, & manage* (needed for CSV Import writes)
- **Project and Team** → *Read* (to list projects)

Do not grant Full access.

## API versions

- Projects: `7.2`
- Variable Groups: `7.2-preview.2`

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

Then enter your **organization** and **PAT** on the connection screen, pick a
project, and use the tools.

## Scripts

```bash
npm run dev         # start dev server (with the /ado proxy)
npm run build       # typecheck + production build
npm run typecheck   # strict TypeScript, no emit
npm run lint        # eslint
npm run preview     # preview the production build
```

## Adding a new tool

The sidebar and routes are generated from `src/features/tools/registry.ts`.
To add a tool:

1. Create `src/features/tools/<your-tool>/YourTool.tsx`.
2. Add one `ToolDefinition` entry to `TOOLS` in `registry.ts`.

That's it — no router or sidebar edits needed.
