import type { ReactNode } from 'react';
import { FolderGit2 } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { useSessionStore } from '@/store/sessionStore';

/**
 * Gate for tools that need a selected project. Shows a prompt instead of the
 * tool when no project is chosen. (Connection itself is enforced by the router.)
 */
export function RequireProject({ children }: { children: ReactNode }) {
  const selectedProject = useSessionStore((s) => s.selectedProject);

  if (!selectedProject) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <EmptyState
          icon={FolderGit2}
          title="Select a project"
          description="Choose a project from the selector in the header to use this tool."
        />
      </div>
    );
  }

  return <>{children}</>;
}
