import { API_VERSION_VARIABLE_GROUPS } from '@/lib/constants';
import type {
  AdoListResponse,
  VariableGroup,
  VariableGroupUpdateBody,
  VariableMap,
} from '@/types/ado';
import { adoRequest } from './client';

/**
 * List variable groups in a project.
 * GET /{org}/{project}/_apis/distributedtask/variablegroups?api-version=7.2-preview.2
 */
export async function listVariableGroups(
  organization: string,
  project: string,
  signal?: AbortSignal,
): Promise<VariableGroup[]> {
  const data = await adoRequest<AdoListResponse<VariableGroup>>(
    [organization, project, '_apis', 'distributedtask', 'variablegroups'],
    { query: { 'api-version': API_VERSION_VARIABLE_GROUPS }, signal },
  );
  return [...data.value].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get a single variable group.
 * GET /{org}/{project}/_apis/distributedtask/variablegroups/{groupId}?api-version=7.2-preview.2
 */
export async function getVariableGroup(
  organization: string,
  project: string,
  groupId: number,
  signal?: AbortSignal,
): Promise<VariableGroup> {
  return adoRequest<VariableGroup>(
    [organization, project, '_apis', 'distributedtask', 'variablegroups', String(groupId)],
    { query: { 'api-version': API_VERSION_VARIABLE_GROUPS }, signal },
  );
}

/**
 * Update a variable group's variables. The update endpoint is org-scoped and
 * REQUIRES the full body — name, type, description, the complete variables map,
 * and variableGroupProjectReferences (omitting the references fails with
 * "Project information name is not valid for variable group", and would
 * otherwise un-share the group).
 *
 * IMPORTANT: the LIST endpoint does not populate variableGroupProjectReferences,
 * so we always GET the authoritative group by id first to obtain them, then
 * apply the new variables on top.
 *
 * PUT /{org}/_apis/distributedtask/variablegroups/{groupId}?api-version=7.2-preview.2
 */
export async function updateVariableGroupVariables(
  organization: string,
  project: string,
  groupId: number,
  nextVariables: VariableMap,
): Promise<VariableGroup> {
  const authoritative = await getVariableGroup(organization, project, groupId);

  const body: VariableGroupUpdateBody = {
    name: authoritative.name,
    description: authoritative.description ?? '',
    type: authoritative.type,
    variables: nextVariables,
    variableGroupProjectReferences: authoritative.variableGroupProjectReferences ?? [],
  };

  return adoRequest<VariableGroup>(
    [organization, '_apis', 'distributedtask', 'variablegroups', String(groupId)],
    {
      method: 'PUT',
      query: { 'api-version': API_VERSION_VARIABLE_GROUPS },
      body,
      errorContext: 'write',
    },
  );
}
