import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateVariableGroupVariables } from '@/lib/api/variableGroups';
import { AdoError } from '@/lib/api/errors';
import type { VariableMap } from '@/types/ado';
import { useSessionStore } from '@/store/sessionStore';

interface UpdateArgs {
  groupId: number;
  nextVariables: VariableMap;
}

/** Mutation to write a variable group's variables and refresh caches. */
export function useUpdateVariableGroup() {
  const organization = useSessionStore((s) => s.organization);
  const project = useSessionStore((s) => s.selectedProject);
  const setVariableGroupsWritable = useSessionStore((s) => s.setVariableGroupsWritable);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, nextVariables }: UpdateArgs) =>
      updateVariableGroupVariables(organization!, project!.name, groupId, nextVariables),
    onSuccess: (updated) => {
      // A successful write confirms the PAT has the manage scope.
      setVariableGroupsWritable(true);
      queryClient.invalidateQueries({
        queryKey: ['variableGroups', organization, project?.id],
      });
      queryClient.setQueryData(['variableGroup', organization, project?.id, updated.id], updated);
    },
    onError: (err) => {
      // A write that fails with 403 OR 401 means the PAT lacks the Variable
      // Groups (manage) scope - by now the PAT has proven valid via reads, so a
      // 401 on the write is a scope issue, not a bad token. Remember it so write
      // actions can be disabled for the rest of the session.
      if (err instanceof AdoError && (err.kind === 'forbidden' || err.kind === 'unauthorized')) {
        setVariableGroupsWritable(false);
      }
    },
  });
}
