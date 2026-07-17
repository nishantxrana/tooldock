import { API_VERSION } from '@/lib/constants';
import type { AdoListResponse, Project } from '@/types/ado';
import { adoRequest } from './client';

/**
 * List projects in the organization.
 * GET /{org}/_apis/projects?api-version=7.2
 *
 * Also used to validate the PAT + organization during connect.
 */
export async function listProjects(
  organization: string,
  opts: { patOverride?: string; signal?: AbortSignal } = {},
): Promise<Project[]> {
  const data = await adoRequest<AdoListResponse<Project>>(
    [organization, '_apis', 'projects'],
    {
      query: { 'api-version': API_VERSION, '$top': '1000', 'stateFilter': 'wellFormed' },
      patOverride: opts.patOverride,
      signal: opts.signal,
    },
  );
  return [...data.value].sort((a, b) => a.name.localeCompare(b.name));
}
