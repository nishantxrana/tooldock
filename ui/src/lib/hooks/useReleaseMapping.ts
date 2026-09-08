import { useQuery } from '@tanstack/react-query';
import { listVariableGroups } from '@/lib/api/variableGroups';
import { listReleaseDefinitions, getReleaseDefinition } from '@/lib/api/releaseDefinitions';
import { useSessionStore } from '@/store/sessionStore';
import type { VariableGroup } from '@/types/ado';

export interface ReleaseMappingEntry {
  pipelineName: string;
  /** null = attached at definition level (applies to all stages) */
  stageName: string | null;
  scope: 'Definition-level' | 'Stage-level';
}

export interface ReleaseMappingResult {
  /** groupId → list of pipeline/stage usages */
  mapping: Map<number, ReleaseMappingEntry[]>;
  variableGroups: VariableGroup[];
  progress: { done: number; total: number };
}

const BATCH_SIZE = 5;

async function fetchReleaseMapping(
  organization: string,
  project: string,
  signal: AbortSignal,
): Promise<ReleaseMappingResult> {
  // Fetch variable groups and definition refs in parallel.
  const [variableGroups, definitionRefs] = await Promise.all([
    listVariableGroups(organization, project, signal),
    listReleaseDefinitions(organization, project, signal),
  ]);

  const mapping = new Map<number, ReleaseMappingEntry[]>();
  for (const vg of variableGroups) {
    mapping.set(vg.id, []);
  }

  // Fetch full definitions in parallel batches of BATCH_SIZE to minimize wall time
  // while avoiding rate-limit hammering on large projects.
  let done = 0;
  const total = definitionRefs.length;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    if (signal.aborted) break;
    const batch = definitionRefs.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((ref) => getReleaseDefinition(organization, project, ref.id, signal)),
    );

    for (const result of results) {
      done++;
      if (result.status === 'rejected') continue;
      const def = result.value;

      // Definition-level variable groups (shared across all stages).
      for (const groupId of def.variableGroups ?? []) {
        if (!mapping.has(groupId)) continue;
        mapping.get(groupId)!.push({
          pipelineName: def.name,
          stageName: null,
          scope: 'Definition-level',
        });
      }

      // Per-stage variable groups.
      for (const env of def.environments ?? []) {
        for (const groupId of env.variableGroups ?? []) {
          if (!mapping.has(groupId)) continue;
          mapping.get(groupId)!.push({
            pipelineName: def.name,
            stageName: env.name,
            scope: 'Stage-level',
          });
        }
      }
    }
  }

  return { mapping, variableGroups, progress: { done, total } };
}

export function useReleaseMapping() {
  const organization = useSessionStore((s) => s.organization);
  const project = useSessionStore((s) => s.selectedProject);

  return useQuery({
    queryKey: ['releaseMapping', organization, project?.id],
    queryFn: ({ signal }) => fetchReleaseMapping(organization!, project!.name, signal),
    enabled: !!organization && !!project,
    staleTime: 5 * 60_000,
  });
}
