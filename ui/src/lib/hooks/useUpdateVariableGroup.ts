import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateVariableGroupVariables } from '@/lib/api/variableGroups';
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, nextVariables }: UpdateArgs) =>
      updateVariableGroupVariables(organization!, project!.name, groupId, nextVariables),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: ['variableGroups', organization, project?.id],
      });
      queryClient.setQueryData(
        ['variableGroup', organization, project?.id, updated.id],
        updated,
      );
    },
  });
}
