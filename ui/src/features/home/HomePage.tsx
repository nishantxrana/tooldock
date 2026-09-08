import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TOOLS } from '@/features/tools/registry';
import { APP_NAME, APP_SUBTITLE } from '@/lib/constants';
import type { ToolDefinition } from '@/types/tools';

function ToolCard({ tool }: { tool: ToolDefinition }) {
  return (
    <Link to={tool.path} className="block h-full">
      <Card className="h-full transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <tool.icon className="h-5 w-5" />
            </div>
            {tool.requiresConnection && (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5 font-normal text-muted-foreground gap-1">
                <Lock className="h-2.5 w-2.5" />
                ADO
              </Badge>
            )}
          </div>
          <CardTitle className="text-sm font-semibold leading-snug">{tool.title}</CardTitle>
          <CardDescription className="text-xs leading-relaxed">{tool.description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

export function HomePage() {
  const freeTools = TOOLS.filter((t) => !t.requiresConnection);
  const gatedTools = TOOLS.filter((t) => t.requiresConnection);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-6 py-10">
      {/* Hero */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent px-8 py-10">
        <div className="flex items-center gap-3 mb-4">
          <img src="/favicon.svg" alt={APP_NAME} className="h-10 w-10" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{APP_SUBTITLE}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <div className="rounded-lg bg-background border border-border px-4 py-2.5 text-sm">
            <span className="font-semibold tabular-nums">{TOOLS.length}</span>
            <span className="text-muted-foreground ml-1.5">tools</span>
          </div>
          <div className="rounded-lg bg-background border border-border px-4 py-2.5 text-sm">
            <span className="font-semibold tabular-nums">{freeTools.length}</span>
            <span className="text-muted-foreground ml-1.5">work offline</span>
          </div>
        </div>
      </div>

      {/* Offline tools */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Works offline
          </span>
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground tabular-nums">{freeTools.length}</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {freeTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
        </div>
      </section>

      {/* ADO-connected tools */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Requires connection
          </span>
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground tabular-nums">{gatedTools.length}</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gatedTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
        </div>
      </section>
    </div>
  );
}
