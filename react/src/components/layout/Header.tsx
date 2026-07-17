import { LogOut, PanelLeft, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProjectSelector } from './ProjectSelector';
import { ThemeToggle } from './ThemeToggle';
import { APP_NAME } from '@/lib/constants';
import { useSessionStore } from '@/store/sessionStore';

interface HeaderProps {
  onToggleSidebar: () => void;
}

/** Top bar: brand, connection status, project selector, session controls. */
export function Header({ onToggleSidebar }: HeaderProps) {
  const organization = useSessionStore((s) => s.organization);
  const disconnect = useSessionStore((s) => s.disconnect);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <PanelLeft />
      </Button>

      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <PanelLeft className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
      </div>

      <div className="ml-2 flex items-center gap-2">
        <Badge variant="success" className="gap-1.5">
          <Wifi className="h-3 w-3" />
          Connected
        </Badge>
        {organization && (
          <span className="hidden text-sm text-muted-foreground sm:inline">{organization}</span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ProjectSelector />
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={disconnect}
          aria-label="Disconnect"
          title="Disconnect (clears PAT from memory)"
        >
          <LogOut />
        </Button>
      </div>
    </header>
  );
}
