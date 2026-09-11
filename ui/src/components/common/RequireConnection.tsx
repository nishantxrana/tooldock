import type { ReactNode } from 'react';
import { Navigate, useNavigationType } from 'react-router-dom';
import { useSessionStore } from '@/store/sessionStore';
import { ConnectForm } from '@/features/connection/ConnectForm';

function ConnectGate() {
  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-start justify-center px-6 pt-[14vh] pb-24">
      <div className="w-full max-w-sm">
        <ConnectForm onConnected={() => {}} />
      </div>
    </div>
  );
}

/**
 * Route guard for tools that need a connection. Because the session is
 * memory-only, a page refresh always clears it.
 *
 * - Reaching a gated tool via POP (refresh, typed URL, back/forward) sends the
 *   user to the home page so they can see all tools again instead of being
 *   dropped straight into the connect form.
 * - Reaching it via an in-app click (PUSH/REPLACE) shows the connect form
 *   inline, in place, on the same URL: no navigation, sidebar/header stay put.
 *   Once `connect()` flips isConnected, this re-renders and shows `children`
 *   automatically - onConnected has nothing else to do.
 */
export function RequireConnection({ children }: { children: ReactNode }) {
  const isConnected = useSessionStore((s) => s.isConnected);
  const navigationType = useNavigationType();

  if (!isConnected) {
    if (navigationType === 'POP') return <Navigate to="/" replace />;
    return <ConnectGate />;
  }

  return <>{children}</>;
}
