import { useLocation, useNavigate, type Location } from 'react-router-dom';
import { Logo } from '@/components/layout/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { ConnectForm } from './ConnectForm';
import { APP_NAME, APP_SUBTITLE } from '@/lib/constants';
import { TOOLS } from '@/features/tools/registry';

export function ConnectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from;
  const intendedTool = from ? TOOLS.find((t) => t.path === from.pathname) : undefined;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b-2 border-b-primary/50 bg-background/98 px-4 backdrop-blur-md">
        <Logo />
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center bg-dot-grid bg-muted/20 px-4 py-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 ring-1 ring-primary/30 p-2">
              <img src="/favicon.svg" alt={APP_NAME} className="h-full w-full" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{APP_SUBTITLE}</p>
          </div>

          <div className="shadow-xl shadow-black/10 rounded-[calc(var(--radius)+2px)]">
            <ConnectForm
              title={intendedTool ? `Connect to use ${intendedTool.title}` : undefined}
              onConnected={() => navigate(from?.pathname ?? '/', { replace: true })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
