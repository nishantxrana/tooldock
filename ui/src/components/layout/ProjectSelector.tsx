import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Combobox } from '@/components/ui/combobox';
import { useProjects } from '@/lib/hooks/useProjects';
import { useSessionStore } from '@/store/sessionStore';

/** Header control to pick the active project. Selection lives in memory only. */
export function ProjectSelector() {
  const { data: projects, isLoading, isError } = useProjects();
  const selectedProject = useSessionStore((s) => s.selectedProject);
  const selectProject = useSessionStore((s) => s.selectProject);

  const options = useMemo(
    () => (projects ?? []).map((p) => ({ value: p.id, label: p.name })),
    [projects],
  );

  if (isLoading) return <Skeleton className="h-9 w-52" />;
  if (isError || !projects) {
    return <span className="text-sm text-destructive">Failed to load projects</span>;
  }

  return (
    <Combobox
      options={options}
      value={selectedProject?.id ?? undefined}
      onChange={(id) => {
        const project = projects.find((p) => p.id === id) ?? null;
        selectProject(project);
      }}
      placeholder="Select project…"
      searchPlaceholder="Search projects…"
      className="h-9 w-52"
    />
  );
}
