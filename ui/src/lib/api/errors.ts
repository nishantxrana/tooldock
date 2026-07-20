/** Typed error for Azure DevOps API failures, with actionable messaging. */
export type AdoErrorKind =
  | 'unauthorized' // 401 — PAT invalid/expired
  | 'forbidden' // 403 — insufficient scope/permission
  | 'not-found' // 404 — org/project/group missing
  | 'rate-limit' // 429
  | 'network' // offline / DNS / proxy unreachable
  | 'non-json' // got HTML (usually a sign-in redirect / wrong org)
  | 'unknown';

export class AdoError extends Error {
  readonly kind: AdoErrorKind;
  readonly status?: number;
  readonly retryAfter?: number;

  constructor(kind: AdoErrorKind, message: string, status?: number, retryAfter?: number) {
    super(message);
    this.name = 'AdoError';
    this.kind = kind;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

/**
 * Whether the failing call was a read or a write. Azure DevOps returns 401 (not
 * always 403) when a valid PAT lacks the scope for a write, so the messaging for
 * a write differs from a read/connect.
 */
export type AdoErrorContext = 'read' | 'write';

const WRITE_SCOPE_MESSAGE =
  'Your PAT is valid but lacks the "Variable Groups (Read, create, & manage)" scope needed to write. Reconnect with a manage-scoped PAT.';

/** Map an HTTP response status to a typed, user-actionable AdoError. */
export function errorFromStatus(
  status: number,
  retryAfter?: number,
  context: AdoErrorContext = 'read',
): AdoError {
  const isWrite = context === 'write';
  switch (status) {
    case 401:
      return new AdoError(
        'unauthorized',
        isWrite
          ? WRITE_SCOPE_MESSAGE
          : 'Your PAT is invalid or expired. Reconnect with a valid token.',
        status,
      );
    case 403:
      return new AdoError(
        'forbidden',
        isWrite
          ? WRITE_SCOPE_MESSAGE
          : 'Permission denied. Ensure your PAT has the required Variable Groups and Project (Read) scopes.',
        status,
      );
    case 404:
      return new AdoError(
        'not-found',
        'Not found. Check the organization, project, or variable group exists and is spelled correctly.',
        status,
      );
    case 429:
      return new AdoError(
        'rate-limit',
        retryAfter
          ? `Rate limited by Azure DevOps. Retry in ${retryAfter}s.`
          : 'Rate limited by Azure DevOps. Please retry shortly.',
        status,
        retryAfter,
      );
    default:
      return new AdoError(
        'unknown',
        `Azure DevOps returned an unexpected error (HTTP ${status}).`,
        status,
      );
  }
}

/** Human-readable title for banners/toasts. */
export function errorTitle(err: unknown): string {
  if (err instanceof AdoError) {
    switch (err.kind) {
      case 'unauthorized':
        return 'Authentication failed';
      case 'forbidden':
        return 'Permission denied';
      case 'not-found':
        return 'Not found';
      case 'rate-limit':
        return 'Rate limited';
      case 'network':
        return 'Network error';
      case 'non-json':
        return 'Unexpected response';
      default:
        return 'Something went wrong';
    }
  }
  return 'Something went wrong';
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
