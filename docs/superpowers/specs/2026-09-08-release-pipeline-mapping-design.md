# Release Pipeline Mapping — Design Spec

**Date:** 2026-09-08  
**Status:** Approved  
**Tool name:** Release Pipeline Mapping  
**Sidebar group:** Release Pipelines (new)

---

## Problem

Azure DevOps engineers need to know which release pipelines (and which stages within them) use a given variable group. Currently this requires opening every release pipeline manually. This tool answers that question instantly and lets the user export the full mapping.

---

## API Layer

### New proxy route

`vite.config.ts` gains a `/vsrm` proxy target pointing to `https://vsrm.dev.azure.com`. Release definitions live on this subdomain, not `dev.azure.com`.

### `adoRequest` extension

`lib/api/client.ts` — add an optional `basePath?: string` parameter (defaults to `'/ado'`). Release calls pass `'/vsrm'`. No breaking change to existing callers.

### New API module: `lib/api/releaseDefinitions.ts`

Two functions:

1. `listReleaseDefinitions(org, project, signal?)` — `GET /vsrm/{org}/{project}/_apis/release/definitions?api-version=7.1`  
   Returns `ReleaseDefinitionRef[]` — lightweight `{ id, name }` objects.

2. `getReleaseDefinition(org, project, id, signal?)` — `GET /vsrm/{org}/{project}/_apis/release/definitions/{id}?api-version=7.1`  
   Returns full `ReleaseDefinition` with:
   - `variableGroups: number[]` at definition level (shared across all stages)
   - `environments: { id, name, variableGroups: number[] }[]` per stage

### Call minimization

For N release pipelines:
1. One call → list all definition refs (IDs + names)
2. One call → list all variable groups (reuses existing `listVariableGroups`)
3. N calls → fetch full definitions, fired in **parallel batches of 5** (Promise.allSettled per chunk)

Total wall time for 100 pipelines: ~4–5 seconds with concurrency. A live progress counter (`Fetching pipelines… 23 / 100`) is shown during fetch.

### New types (`types/ado.ts`)

```ts
interface ReleaseDefinitionRef {
  id: number;
  name: string;
}

interface ReleaseEnvironment {
  id: number;
  name: string;
  variableGroups: number[];
}

interface ReleaseDefinition {
  id: number;
  name: string;
  variableGroups: number[];        // definition-level (all stages)
  environments: ReleaseEnvironment[];
}
```

---

## Data Hook: `lib/hooks/useReleaseMapping.ts`

Single TanStack Query hook that orchestrates all fetches and returns the fully-built mapping.

```ts
interface ReleaseMappingEntry {
  pipelineName: string;
  stageName: string | null;        // null = definition-level (applies to all stages)
  scope: 'Definition-level' | 'Stage-level';
}

interface UseReleaseMappingResult {
  mapping: Map<number, ReleaseMappingEntry[]>;   // groupId → usages
  variableGroups: VariableGroup[];               // for name lookup + picker
  isLoading: boolean;
  progress: { done: number; total: number };
  isError: boolean;
  error: unknown;
  refetch: () => void;
}
```

**Query key:** `['releaseMapping', organization, project?.id]`  
**staleTime:** `5 * 60_000` (5 minutes — release pipelines change infrequently)  
**enabled:** `!!organization && !!project`

The hook is the single data source — both the lookup view and the export button consume the same cached result without re-fetching.

---

## Tool UI: `features/tools/release-group-mapping/ReleaseGroupMapping.tsx`

**Registry entry:**
- `id`: `release-group-mapping`
- `title`: `Release Pipeline Mapping`
- `group`: `Release Pipelines` (new group added to `TOOL_GROUPS`)
- `icon`: `GitBranch` (lucide-react)
- `requiresConnection`: `true`
- `path`: `/tools/release-group-mapping`

### PAT scope

A persistent info banner (not dismissible, always visible while the tool is open):

> *"This tool requires a PAT with **Release (read)** scope in addition to Variable Groups (read). If you see a 403 error, regenerate your PAT and add the Release scope."*

No separate connect flow. If the PAT lacks the scope, the fetch returns 403, the existing `ErrorBanner + retry` pattern handles it with a clear message.

### Top-right Connect button

Keep as-is. Same one-PAT model, same connect flow. Users just need to include the Release scope when generating their PAT.

### Loading state

While fetching definitions:
```
Fetching release pipelines…  47 / 100
[=========>        ]
```
Uses a simple progress bar (or text counter if a progress bar component doesn't exist yet — use text).

### Loaded state layout

**Group picker** — single-select `VariableGroupPicker` (existing component). When a group is selected, the results table updates immediately (no extra fetch — data is already in memory).

**Results table** — filtered to the selected group's usages:

| Pipeline Name | Stage | Scope |
|---|---|---|
| Prod Deploy | DEV | Stage-level |
| Prod Deploy | PROD | Stage-level |
| Infra Setup | *(all stages)* | Definition-level |

"Definition-level" rows use italic `(all stages)` in the Stage column.

If the selected group has zero usages: `EmptyState` — "This variable group is not used in any release pipeline."

**Export button** — always visible once data is loaded (doesn't require a group to be selected). Labeled "Export full mapping (.xlsx)".

### Error state

`ErrorBanner` with retry — same pattern as `ExportAllGroups`. 403 message: "PAT lacks Release (read) scope."

---

## XLSX Export

Single-sheet workbook. No per-group sheets.

**Filename:** `{org}-{project}-release-pipeline-mapping.xlsx`  
**Sheet name:** `Pipeline Mapping` (fixed, no 31-char issue)  
**Title row:** `Release Pipeline Mapping — {org} / {project}` merged across all 4 columns (bold)  
**Header row:** `Variable Group`, `Pipeline Name`, `Stage`, `Scope`  
**Data rows:** One row per usage, sorted by variable group name then pipeline name  
**Zero-usage groups:** One row per unused group — `{groupName}`, `—`, `—`, `Not used`

This flat layout is trivially filterable/sortable in Excel. All information is on one sheet; no need to flip between tabs.

### `xlsx.ts` extension

Add `exportReleaseMappingXlsx(filename, org, project, rows)` function:
- `rows: { groupName, pipelineName, stageName, scope }[]`
- Builds a 4-column sheet with merged title row
- Follows existing `downloadWorkbook` + dynamic `import('xlsx')` pattern

---

## Files Changed

| File | Type | Change |
|---|---|---|
| `vite.config.ts` | Modified | Add `/vsrm` proxy |
| `lib/api/client.ts` | Modified | `basePath` option on `adoRequest` |
| `types/ado.ts` | Modified | Add `ReleaseDefinitionRef`, `ReleaseEnvironment`, `ReleaseDefinition` |
| `lib/api/releaseDefinitions.ts` | New | `listReleaseDefinitions`, `getReleaseDefinition` |
| `lib/hooks/useReleaseMapping.ts` | New | Batched fetch + mapping hook |
| `lib/utils/xlsx.ts` | Modified | Add `exportReleaseMappingXlsx` |
| `features/tools/release-group-mapping/ReleaseGroupMapping.tsx` | New | Tool component |
| `features/tools/registry.ts` | Modified | Register tool + `Release Pipelines` group |

---

## Edge Cases

| Scenario | Handling |
|---|---|
| 0 release pipelines | EmptyState: "No release pipelines found in this project." |
| Group used at both definition level AND stage level in same pipeline | Two separate rows (one per scope level) |
| Group attached to multiple stages of same pipeline | One row per stage |
| Pipeline fetch fails mid-batch | `Promise.allSettled` — failed definitions logged, rest succeed; banner warns "N pipelines could not be fetched" |
| PAT missing Release scope | 403 → ErrorBanner: "PAT lacks Release (read) scope. Reconnect with a PAT that includes Release read." |
| 0 variable groups in project | EmptyState shown before fetch even starts |
| Variable group ID in pipeline no longer exists | Skipped silently (orphaned reference — ADO allows stale IDs) |
