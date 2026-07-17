import { Github } from 'lucide-react';
import { APP_VERSION, GITHUB_URL } from '@/lib/constants';

/** App footer: version, GitHub link. Theme toggle lives in the header. */
export function Footer() {
  return (
    <footer className="flex items-center justify-between border-t border-border px-6 py-3 text-xs text-muted-foreground">
      <span>ToolDock v{APP_VERSION}</span>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 hover:text-foreground"
      >
        <Github className="h-3.5 w-3.5" />
        GitHub
      </a>
    </footer>
  );
}
