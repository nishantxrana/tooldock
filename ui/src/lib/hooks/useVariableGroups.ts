import { useQuery } from '@tanstack/react-query';
import { listVariableGroups } from '@/lib/api/variableGroups';
import { useSessionStore } from '@/store/sessionStore';

/** Load variable groups for the currently selected project. */
export function useVariableGroups() {
  const organization = useSessionStore((s) => s.organization);
  const project = useSessionStore((s) => s.selectedProject);

  return useQuery({
    queryKey: ['variableGroups', organization, project?.id],
    queryFn: ({ signal }) => listVariableGroups(organization!, project!.name, signal),
    enabled: !!organization && !!project,
    staleTime: 60 * 1000,
  });
}
