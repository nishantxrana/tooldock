/**
 * Builds the Authorization header for Azure DevOps PAT auth.
 *
 * ADO expects HTTP Basic with an empty username and the PAT as the password:
 *   Authorization: Basic base64(":" + PAT)
 *
 * The PAT is used transiently to build this header and is never stored or logged.
 */
export function buildAuthHeader(pat: string): string {
  const token = btoa(`:${pat}`);
  return `Basic ${token}`;
}
