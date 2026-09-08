import { LogOut, PanelLeft, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Logo } from './Logo';
import { ProjectSelector } from './ProjectSelector';
import { ThemeToggle } from './ThemeToggle';
import { PersistButton } from './PersistButton';
import { unlockPat } from '@/lib/utils/patVault';
import { useSessionStore } from '@/store/sessionStore';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const isConnected = useSessionStore((s) => s.isConnected);
  const organization = useSessionStore((s) => s.organization);
  const disconnect = useSessionStore((s) => s.disconnect);

  const handleDisconnect = async () => {
    await unlockPat().catch(() => {});
    disconnect();
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-sidebar-border bg-background/98 px-4 backdrop-blur-md">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggleSidebar} aria-label="Toggle sidebar">
        <PanelLeft />
      </Button>

      <Logo />

      {isConnected && (
        <>
          <div className="h-5 w-px bg-border mx-1" />
          <div className="flex items-center gap-2">
            <Badge variant="success" className="gap-1.5">
              <Wifi className="h-3 w-3" />
              Connected
            </Badge>
            {organization && (
              <Badge variant="outline" className="hidden sm:inline-flex">
                {organization}
              </Badge>
            )}
          </div>
        </>
      )}

      <div className="ml-auto flex items-center gap-2">
        {isConnected ? (
          <>
            <ProjectSelector />
            <ThemeToggle />
            <PersistButton />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleDisconnect} aria-label="Disconnect">
                  <LogOut />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Disconnect (clears PAT from memory)</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <ThemeToggle />
        )}
      </div>
    </header>
  );
}
