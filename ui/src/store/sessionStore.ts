import { create } from 'zustand';
import type { Project } from '@/types/ado';

/**
 * In-memory session state. Holds the PAT, organization and the selected
 * project ONLY in runtime memory.
 *
 * SECURITY: This store is intentionally NOT persisted. There is no use of
 * localStorage / sessionStorage / cookies / IndexedDB. A page refresh clears
 * everything and forces reconnection. The PAT must never be logged.
 */
interface SessionState {
  pat: string | null;
  organization: string | null;
  selectedProject: Project | null;
  isConnected: boolean;
  /**
   * Whether the PAT can write variable groups. `null` = unknown (not attempted
   * yet). Set to `false` when a write is rejected with 403, so we can disable
   * write actions and explain why. A PAT's scopes can't be read up-front from
   * the browser, so this is learned reactively.
   */
  variableGroupsWritable: boolean | null;

  connect: (pat: string, organization: string) => void;
  selectProject: (project: Project | null) => void;
  setVariableGroupsWritable: (writable: boolean) => void;
  disconnect: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  pat: null,
  organization: null,
  selectedProject: null,
  isConnected: false,
  variableGroupsWritable: null,

  connect: (pat, organization) =>
    set({ pat, organization: organization.trim(), isConnected: true }),

  selectProject: (project) => set({ selectedProject: project }),

  setVariableGroupsWritable: (writable) => set({ variableGroupsWritable: writable }),

  disconnect: () =>
    set({
      pat: null,
      organization: null,
      selectedProject: null,
      isConnected: false,
      variableGroupsWritable: null,
    }),
}));

/**
 * Read the current session imperatively (for the API layer, outside React).
 * Returns a snapshot; do not hold references to the PAT longer than a request.
 */
export function getSessionSnapshot() {
  const { pat, organization, selectedProject } = useSessionStore.getState();
  return { pat, organization, selectedProject };
}
