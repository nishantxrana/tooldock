import { useQuery } from '@tanstack/react-query';
import { listReleaseDefinitions } from '@/lib/api/releaseDefinitions';
import { useSessionStore } from '@/store/sessionStore';

export function useReleaseDefinitions() {
  const organization = useSessionStore((s) => s.organization);
  const project = useSessionStore((s) => s.selectedProject);

  return useQuery({
    queryKey: ['releaseDefinitions', organization, project?.id],
    queryFn: ({ signal }) => listReleaseDefinitions(organization!, project!.name, signal),
    enabled: !!organization && !!project,
    staleTime: 5 * 60_000,
  });
}
