import { create } from 'zustand';
import type { Project } from '@/types/ado';

/**
 * In-memory session state. Holds the PAT, organization and the selected
 * project ONLY in runtime memory.
 *
 * SECURITY: The PAT is never persisted by default. localStorage / sessionStorage
 * / cookies are never used. The user may voluntarily encrypt and store the PAT
 * in IndexedDB via the PersistButton - see lib/utils/patVault.ts. A page
 * refresh without that opt-in clears everything and forces reconnection.
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
  /** Whether the PAT is currently persisted to encrypted IndexedDB. */
  isPatPersisted: boolean;
  /** Timestamp (ms) when the PAT was last locked - drives the countdown timer. */
  lockedAt: number | null;

  connect: (pat: string, organization: string) => void;
  selectProject: (project: Project | null) => void;
  setVariableGroupsWritable: (writable: boolean) => void;
  setPatPersisted: (persisted: boolean, lockedAt: number | null) => void;
  disconnect: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  pat: null,
  organization: null,
  selectedProject: null,
  isConnected: false,
  variableGroupsWritable: null,
  isPatPersisted: false,
  lockedAt: null,

  connect: (pat, organization) =>
    set({ pat, organization: organization.trim(), isConnected: true }),

  selectProject: (project) => set({ selectedProject: project }),

  setVariableGroupsWritable: (writable) => set({ variableGroupsWritable: writable }),

  setPatPersisted: (persisted, lockedAt) => set({ isPatPersisted: persisted, lockedAt }),

  disconnect: () =>
    set({
      pat: null,
      organization: null,
      selectedProject: null,
      isConnected: false,
      variableGroupsWritable: null,
      isPatPersisted: false,
      lockedAt: null,
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
