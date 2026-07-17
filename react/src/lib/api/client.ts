import { ADO_BASE_PATH } from '@/lib/constants';
import { getSessionSnapshot } from '@/store/sessionStore';
import { buildAuthHeader } from './auth';
import { AdoError, errorFromStatus } from './errors';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Query params (api-version etc.). */
  query?: Record<string, string | undefined>;
  body?: unknown;
  /** Override the PAT (used during connect validation, before the store is set). */
  patOverride?: string;
  /** Signal for cancellation. */
  signal?: AbortSignal;
}

function buildUrl(pathSegments: string[], query?: Record<string, string | undefined>): string {
  const path = pathSegments
    .map((s) => encodeURIComponent(s))
    .join('/')
    .replace(/%2F/gi, '/'); // keep intentional slashes readable — segments are pre-split
  const url = new URL(`${ADO_BASE_PATH}/${path}`, window.location.origin);
  if (query) {
    for (const [key, val] of Object.entries(query)) {
      if (val !== undefined) url.searchParams.set(key, val);
    }
  }
  return url.toString();
}

/**
 * Core Azure DevOps request. Path is provided as pre-split segments (each is
 * URL-encoded). All calls go through the same-origin `/ado` proxy.
 *
 * The PAT is read from the in-memory session snapshot, used only to build the
 * Authorization header for this single request, and never logged.
 */
export async function adoRequest<T>(
  pathSegments: string[],
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', query, body, patOverride, signal } = options;
  const pat = patOverride ?? getSessionSnapshot().pat;

  if (!pat) {
    throw new AdoError('unauthorized', 'Not connected. Enter a PAT to continue.');
  }

  const headers: Record<string, string> = {
    Authorization: buildAuthHeader(pat),
    Accept: 'application/json',
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(pathSegments, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new AdoError(
      'network',
      'Could not reach Azure DevOps. Check your connection and that the proxy is running.',
    );
  }

  if (!res.ok) {
    const retryAfterHeader = res.headers.get('Retry-After');
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;
    throw errorFromStatus(res.status, Number.isNaN(retryAfter) ? undefined : retryAfter);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  // ADO returns an HTML sign-in page (200) when the org is wrong or auth is not
  // recognised. Guard against parsing that as JSON.
  const contentType = res.headers.get('Content-Type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new AdoError(
      'non-json',
      'Azure DevOps did not return JSON. Double-check the organization name and your PAT.',
      res.status,
    );
  }

  return (await res.json()) as T;
}
