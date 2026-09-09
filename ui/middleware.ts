/**
 * Vercel Edge Middleware — runs before the /ado/* and /vsrm/* proxy rewrites.
 *
 * Three protections:
 *  1. Method allow-list — only GET and PUT pass through (GET = all reads,
 *     PUT = CSV Import variable group update).
 *  2. Origin / Referer check — rejects requests whose Origin or Referer
 *     header does not match the app's own domain. Skipped when
 *     ALLOWED_ORIGIN is not set (local dev).
 *
 * Rate limiting is not available on Vercel's free tier without an external
 * store (e.g. Upstash Redis). Add it separately if needed.
 *
 * ALLOWED_ORIGIN  — set in Vercel dashboard → Settings → Environment
 *                   Variables. Primary custom domain, e.g.
 *                   https://tooldock.notbatman.me
 * VERCEL_URL      — injected automatically by Vercel; covers the
 *                   .vercel.app deployment URL as a fallback so both domains
 *                   work without extra config.
 */

const ALLOWED_METHODS = new Set(['GET', 'PUT', 'OPTIONS']);

function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  const primary = process.env.ALLOWED_ORIGIN?.trim();
  if (primary) origins.push(primary);

  // VERCEL_URL is the raw hostname (no https://) injected by Vercel.
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) origins.push(`https://${vercelUrl}`);

  return origins;
}

function isOriginAllowed(request: Request): boolean {
  const allowed = getAllowedOrigins();
  if (allowed.length === 0) return true; // dev — no check

  const origin = request.headers.get('origin') ?? '';
  const referer = request.headers.get('referer') ?? '';

  return allowed.some(
    (o) => origin.startsWith(o) || referer.startsWith(o),
  );
}

export default function middleware(request: Request): Response | void {
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (!ALLOWED_METHODS.has(request.method)) {
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (!isOriginAllowed(request)) {
    return new Response('Forbidden', { status: 403 });
  }

  // Allow the request to proceed to the rewrite
}

export const config = {
  matcher: ['/ado/:path*', '/vsrm/:path*'],
};
