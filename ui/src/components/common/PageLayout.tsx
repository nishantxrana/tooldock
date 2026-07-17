import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageLayoutProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Actions shown on the right of the header (buttons, toggles). */
  actions?: ReactNode;
  children: ReactNode;
}

/** Standard tool page frame: header (title/description/actions) + content. */
export function PageLayout({ title, description, icon: Icon, actions, children }: PageLayoutProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className="flex flex-col gap-6">{children}</div>
    </div>
  );
}
