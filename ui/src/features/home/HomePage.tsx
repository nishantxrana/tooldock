import { Link } from 'react-router-dom';
import { ArrowRight, Lock, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TOOLS, toolsByGroup } from '@/features/tools/registry';
import { APP_NAME, APP_SUBTITLE } from '@/lib/constants';
import { useSessionStore } from '@/store/sessionStore';
import { cn } from '@/lib/utils/cn';
import type { ToolDefinition } from '@/types/tools';

function ToolRow({ tool, connected }: { tool: ToolDefinition; connected: boolean }) {
  const locked = tool.requiresConnection && !connected;

  const row = (
    <div
      className={cn(
        'group flex items-center gap-4 rounded-lg border border-transparent px-4 py-3 transition-all duration-150',
        locked
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:border-border hover:bg-muted/40 cursor-pointer',
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md ring-1',
          locked
            ? 'bg-muted text-muted-foreground ring-border'
            : 'bg-primary/10 text-primary ring-primary/20 group-hover:bg-primary/15',
        )}
      >
        <tool.icon className="h-4 w-4" />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm font-medium leading-tight',
            locked ? 'text-muted-foreground' : 'text-foreground',
          )}
        >
          {tool.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{tool.description}</p>
      </div>

      {/* Right side */}
      <div className="flex shrink-0 items-center gap-2">
        {tool.requiresConnection && <Lock className="h-3 w-3 text-muted-foreground/50" />}
        {!locked && (
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 transition-all group-hover:text-muted-foreground/60 group-hover:translate-x-0.5" />
        )}
      </div>
    </div>
  );

  if (locked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div>{row}</div>
        </TooltipTrigger>
        <TooltipContent side="right">Connect to Azure DevOps to use this tool</TooltipContent>
      </Tooltip>
    );
  }

  return <Link to={tool.path}>{row}</Link>;
}

export function HomePage() {
  const isConnected = useSessionStore((s) => s.isConnected);
  const groups = toolsByGroup();

  const groupColors: Record<string, string> = {
    'Variable Groups': 'text-blue-500 dark:text-blue-400',
    'Release Pipelines': 'text-violet-500 dark:text-violet-400',
    'App Settings': 'text-emerald-500 dark:text-emerald-400',
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10 space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt={APP_NAME} className="h-9 w-9" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{APP_NAME}</h1>
            <p className="text-sm text-muted-foreground">{APP_SUBTITLE}</p>
          </div>
        </div>

        {/* Connection status — actionable */}
        {isConnected ? (
          <Badge
            variant="outline"
            className="gap-1.5 text-xs font-normal text-muted-foreground mt-1"
          >
            <Wifi className="h-3 w-3 text-emerald-500" />
            Connected
          </Badge>
        ) : (
          <Link
            to="/connect"
            className="mt-1 flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            Connect to ADO
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Tool groups */}
      {groups.map(({ group, tools }) => {
        const connectedCount = tools.filter((t) => !t.requiresConnection || isConnected).length;
        const allLocked = tools.every((t) => t.requiresConnection) && !isConnected;

        return (
          <section key={group} className="space-y-1">
            {/* Section header */}
            <div className="flex items-center gap-2.5 px-4 pb-1">
              <span
                className={cn(
                  'text-[11px] font-semibold uppercase tracking-widest',
                  groupColors[group] ?? 'text-muted-foreground',
                )}
              >
                {group}
              </span>
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {allLocked ? (
                  <span className="flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" />
                    {tools.length}
                  </span>
                ) : (
                  `${connectedCount} / ${tools.length}`
                )}
              </span>
            </div>

            {/* Tool rows */}
            <div>
              {tools.map((tool) => (
                <ToolRow key={tool.id} tool={tool} connected={isConnected} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Footer nudge — only when disconnected */}
      {!isConnected && (
        <p className="px-4 text-xs text-muted-foreground/60">
          {TOOLS.filter((t) => !t.requiresConnection).length} tools work without a connection —{' '}
          <Link to="/connect" className="text-primary hover:underline">
            connect to unlock the rest
          </Link>
          .
        </p>
      )}
    </div>
  );
}
