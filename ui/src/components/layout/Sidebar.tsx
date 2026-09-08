import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Lock, Search } from 'lucide-react';
import { SearchBox } from '@/components/common/SearchBox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toolsByGroup } from '@/features/tools/registry';
import { cn } from '@/lib/utils/cn';

interface SidebarProps {
  open: boolean;
  onNavigate: () => void;
}

/** Left sidebar: searchable, grouped, scrollable list of tools. */
export function Sidebar({ open, onNavigate }: SidebarProps) {
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return toolsByGroup()
      .map(({ group, tools }) => ({
        group,
        tools: q
          ? tools.filter(
              (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
            )
          : tools,
      }))
      .filter((g) => g.tools.length > 0);
  }, [query]);

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card pt-14 transition-transform lg:static lg:translate-x-0 lg:pt-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="border-b border-border p-3">
        <SearchBox value={query} onChange={setQuery} placeholder="Search tools…" />
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto scrollbar-thin p-3">
        {groups.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <Search className="h-5 w-5" />
            No tools match “{query}”.
          </div>
        )}
        {groups.map(({ group, tools }) => (
          <div key={group}>
            <p className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group}
            </p>
            <ul className="space-y-0.5">
              {tools.map((tool) => (
                <li key={tool.id}>
                  <NavLink
                    to={tool.path}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-accent font-medium text-accent-foreground'
                          : 'text-foreground/80 hover:bg-muted hover:text-foreground',
                      )
                    }
                  >
                    <tool.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{tool.title}</span>
                    {tool.requiresConnection && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Lock
                            className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground"
                            aria-label="Requires connection"
                          />
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          Requires an Azure DevOps connection
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
