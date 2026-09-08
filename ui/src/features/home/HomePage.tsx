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
      <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/40">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <tool.icon className="h-5 w-5" />
            </div>
            {tool.requiresConnection && (
              <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Connect
              </Badge>
            )}
          </div>
          <CardTitle className="text-base">{tool.title}</CardTitle>
          <CardDescription>{tool.description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

/**
 * Landing page shown at "/". Lists every tool up front, split by whether it
 * needs an Azure DevOps connection, so PAT-free tools are reachable with zero
 * clicks and PAT-required tools are clearly marked before navigating into
 * them (RequireConnection handles the actual gate on click-through).
 */
export function HomePage() {
  const freeTools = TOOLS.filter((t) => !t.requiresConnection);
  const gatedTools = TOOLS.filter((t) => t.requiresConnection);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{APP_SUBTITLE}</p>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Use without connecting
          </h2>
          <p className="text-sm text-muted-foreground">
            Work on pasted text, no Azure DevOps account needed.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {freeTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Requires an Azure DevOps connection
          </h2>
          <p className="text-sm text-muted-foreground">
            Connect with an organization + PAT to read or write variable groups.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gatedTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>
    </div>
  );
}
