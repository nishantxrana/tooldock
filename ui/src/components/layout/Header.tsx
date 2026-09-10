import { LogOut, PanelLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Logo } from './Logo';
import { ProjectSelector } from './ProjectSelector';
import { ThemeToggle } from './ThemeToggle';
import { PersistButton } from './PersistButton';
import { unlockPat } from '@/lib/utils/patVault';
import { useSessionStore } from '@/store/sessionStore';
import { useVariableGroups } from '@/lib/hooks/useVariableGroups';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const isConnected = useSessionStore((s) => s.isConnected);
  const organization = useSessionStore((s) => s.organization);
  const disconnect = useSessionStore((s) => s.disconnect);
  const { isFetching: groupsFetching, refetch: refetchGroups } = useVariableGroups();

  const handleDisconnect = async () => {
    await unlockPat().catch(() => {});
    disconnect();
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-sidebar-border bg-background/98 px-4 backdrop-blur-md">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <PanelLeft />
      </Button>

      <Logo />

      {isConnected && organization && (
        <>
          <span className="hidden text-muted-foreground/40 sm:block">/</span>
          <span className="hidden truncate max-w-[160px] text-sm text-muted-foreground sm:block">
            {organization}
          </span>
        </>
      )}

      <div className="ml-auto flex items-center gap-2">
        {isConnected ? (
          <>
            {/* Data controls — project + refresh */}
            <div className="flex items-center gap-1">
              <ProjectSelector />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => refetchGroups()}
                    disabled={groupsFetching}
                    aria-label="Refresh variable groups"
                  >
                    <RefreshCw className={groupsFetching ? 'animate-spin' : ''} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh variable groups</TooltipContent>
              </Tooltip>
            </div>

            <div className="h-5 w-px bg-border" />

            {/* UI + session controls */}
            <div className="flex items-center gap-0.5">
              <ThemeToggle />
              <PersistButton />
            </div>

            <div className="h-5 w-px bg-border" />

            {/* Destructive — kept visually separate */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDisconnect}
                  aria-label="Disconnect"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Disconnect</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <ThemeToggle />
        )}
      </div>
    </header>
  );
}
