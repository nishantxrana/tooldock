import { Link } from 'react-router-dom';
import { LogOut, PanelLeft, Plug, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Logo } from './Logo';
import { ProjectSelector } from './ProjectSelector';
import { ThemeToggle } from './ThemeToggle';
import { useSessionStore } from '@/store/sessionStore';

interface HeaderProps {
  onToggleSidebar: () => void;
}

/** Top bar: brand, connection status, project selector, session controls. */
export function Header({ onToggleSidebar }: HeaderProps) {
  const isConnected = useSessionStore((s) => s.isConnected);
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

      <Logo />

      {isConnected && (
        <div className="ml-2 flex items-center gap-2">
          <Badge variant="success" className="gap-1.5">
            <Wifi className="h-3 w-3" />
            Connected
          </Badge>
          {organization && (
            <span className="hidden text-sm text-muted-foreground sm:inline">{organization}</span>
          )}
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        {isConnected ? (
          <>
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
          </>
        ) : (
          <>
            <ThemeToggle />
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <Link to="/connect">
                <Plug className="h-4 w-4" />
                Connect
              </Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
