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
 * and variableGroupProjectReferences (omitting the references would un-share the
 * group). We derive the body from the existing group to preserve everything.
 *
 * PUT /{org}/_apis/distributedtask/variablegroups/{groupId}?api-version=7.2-preview.2
 */
export async function updateVariableGroupVariables(
  organization: string,
  existing: VariableGroup,
  nextVariables: VariableMap,
): Promise<VariableGroup> {
  const body: VariableGroupUpdateBody = {
    name: existing.name,
    description: existing.description ?? '',
    type: existing.type,
    variables: nextVariables,
    variableGroupProjectReferences: existing.variableGroupProjectReferences ?? [],
  };

  return adoRequest<VariableGroup>(
    [organization, '_apis', 'distributedtask', 'variablegroups', String(existing.id)],
    { method: 'PUT', query: { 'api-version': API_VERSION_VARIABLE_GROUPS }, body },
  );
}
