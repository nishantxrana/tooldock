/**
 * App-wide constants. No secrets here — the PAT lives only in the in-memory
 * session store (see src/store/sessionStore.ts).
 */

export const APP_NAME = 'ToolDock';
export const APP_SUBTITLE = 'Productivity tools for Azure DevOps engineers.';
export const APP_VERSION = '0.1.0';
export const GITHUB_URL = 'https://github.com/your-org/tooldock';

/**
 * Relative base path for all Azure DevOps API calls. A same-origin proxy
 * (Vite dev proxy / deploy rewrite) forwards `/ado/*` to https://dev.azure.com/*.
 */
export const ADO_BASE_PATH = '/ado';

/** API versions verified against Microsoft Learn (July 2026). */
export const API_VERSION = '7.2';
export const API_VERSION_VARIABLE_GROUPS = '7.2-preview.2';

/** Minimum PAT scopes shown to the user before connecting. */
export interface PatScope {
  readonly name: string;
  readonly detail: string;
  readonly required: boolean;
}

export const REQUIRED_PAT_SCOPES: readonly PatScope[] = [
  {
    name: 'Variable Groups (Read, create, & manage)',
    detail: 'Read variable groups and write changes (needed for CSV Import).',
    required: true,
  },
  {
    name: 'Project and Team (Read)',
    detail: 'List the projects in your organization.',
    required: true,
  },
];
