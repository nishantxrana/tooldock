import { useQuery } from '@tanstack/react-query';
import { listProjects } from '@/lib/api/projects';
import { useSessionStore } from '@/store/sessionStore';

/** Load the organization's projects. Enabled only when connected. */
export function useProjects() {
  const organization = useSessionStore((s) => s.organization);
  const isConnected = useSessionStore((s) => s.isConnected);

  return useQuery({
    queryKey: ['projects', organization],
    queryFn: ({ signal }) => listProjects(organization!, { signal }),
    enabled: isConnected && !!organization,
    staleTime: 5 * 60 * 1000,
  });
}
