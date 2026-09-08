import { useLocation, useNavigate, type Location } from 'react-router-dom';
import { Logo } from '@/components/layout/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { ConnectForm } from './ConnectForm';
import { APP_NAME, APP_SUBTITLE } from '@/lib/constants';
import { TOOLS } from '@/features/tools/registry';

/**
 * Standalone connect screen for direct/bookmarked access to /connect. Carries
 * the same top nav as the rest of the app so it never feels like a dead end.
 * Locked tools reached via in-app navigation use the inline ConnectForm
 * instead (see RequireConnection); this route is the fallback entry point.
 */
export function ConnectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from;
  const intendedTool = from ? TOOLS.find((t) => t.path === from.pathname) : undefined;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
        <Logo />
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center bg-muted/30 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <img src="/favicon.svg" alt={APP_NAME} className="mx-auto mb-3 h-12 w-12" />
            <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{APP_SUBTITLE}</p>
          </div>

          <ConnectForm
            title={intendedTool ? `Connect to use ${intendedTool.title}` : undefined}
            onConnected={() => navigate(from?.pathname ?? '/', { replace: true })}
          />
        </div>
      </div>
    </div>
  );
}
