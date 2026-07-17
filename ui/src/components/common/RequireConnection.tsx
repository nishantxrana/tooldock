import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSessionStore } from '@/store/sessionStore';

/**
 * Route guard: redirect to /connect when there is no PAT in memory. Because the
 * session is memory-only, a page refresh always lands here.
 */
export function RequireConnection({ children }: { children: ReactNode }) {
  const isConnected = useSessionStore((s) => s.isConnected);
  if (!isConnected) return <Navigate to="/connect" replace />;
  return <>{children}</>;
}
