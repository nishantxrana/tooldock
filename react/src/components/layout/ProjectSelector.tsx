import { FolderGit2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects } from '@/lib/hooks/useProjects';
import { useSessionStore } from '@/store/sessionStore';

/** Header control to pick the active project. Selection lives in memory only. */
export function ProjectSelector() {
  const { data: projects, isLoading, isError } = useProjects();
  const selectedProject = useSessionStore((s) => s.selectedProject);
  const selectProject = useSessionStore((s) => s.selectProject);

  if (isLoading) return <Skeleton className="h-9 w-52" />;
  if (isError || !projects) {
    return <span className="text-sm text-destructive">Failed to load projects</span>;
  }

  return (
    <Select
      value={selectedProject?.id ?? undefined}
      onValueChange={(id) => {
        const project = projects.find((p) => p.id === id) ?? null;
        selectProject(project);
      }}
    >
      <SelectTrigger className="h-9 w-52">
        <div className="flex items-center gap-2 overflow-hidden">
          <FolderGit2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <SelectValue placeholder="Select project…" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
