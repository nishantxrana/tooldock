import { useQuery } from '@tanstack/react-query';
import { getVariableGroup } from '@/lib/api/variableGroups';
import { useSessionStore } from '@/store/sessionStore';

/** Load a single variable group by id for the selected project. */
export function useVariableGroup(groupId: number | null) {
  const organization = useSessionStore((s) => s.organization);
  const project = useSessionStore((s) => s.selectedProject);

  return useQuery({
    queryKey: ['variableGroup', organization, project?.id, groupId],
    queryFn: ({ signal }) => getVariableGroup(organization!, project!.name, groupId!, signal),
    enabled: !!organization && !!project && groupId !== null,
    staleTime: 30 * 1000,
  });
}
