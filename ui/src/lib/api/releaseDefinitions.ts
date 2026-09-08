import { API_VERSION } from '@/lib/constants';
import type { AdoListResponse, ReleaseDefinition, ReleaseDefinitionRef } from '@/types/ado';
import { adoRequest } from './client';

const VSRM_BASE = '/vsrm';

/**
 * List all release definitions in a project (lightweight — IDs and names only).
 * GET https://vsrm.dev.azure.com/{org}/{project}/_apis/release/definitions?api-version=7.1
 */
export async function listReleaseDefinitions(
  organization: string,
  project: string,
  signal?: AbortSignal,
): Promise<ReleaseDefinitionRef[]> {
  const data = await adoRequest<AdoListResponse<ReleaseDefinitionRef>>(
    [organization, project, '_apis', 'release', 'definitions'],
    { query: { 'api-version': API_VERSION }, signal, basePath: VSRM_BASE },
  );
  return [...data.value].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get a single release definition with full variable group and environment data.
 * GET https://vsrm.dev.azure.com/{org}/{project}/_apis/release/definitions/{id}?api-version=7.1
 */
export async function getReleaseDefinition(
  organization: string,
  project: string,
  id: number,
  signal?: AbortSignal,
): Promise<ReleaseDefinition> {
  return adoRequest<ReleaseDefinition>(
    [organization, project, '_apis', 'release', 'definitions', String(id)],
    { query: { 'api-version': API_VERSION }, signal, basePath: VSRM_BASE },
  );
}
