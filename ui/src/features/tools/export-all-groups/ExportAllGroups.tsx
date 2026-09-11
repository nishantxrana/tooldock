import { useEffect, useMemo, useState } from 'react';
import { Boxes, Download, Layers, Loader2, Search, X } from 'lucide-react';
import { Callout } from '@/components/common/Callout';
import { Input } from '@/components/ui/input';
import { PageLayout } from '@/components/common/PageLayout';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { RequireProject } from '@/components/common/RequireProject';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { safeFilename } from '@/lib/utils/download';
import { exportVariableGroupWorkbook } from '@/lib/utils/xlsx';
import { variableCount, variableEntries } from '@/lib/utils/variables';
import { useVariableGroups } from '@/lib/hooks/useVariableGroups';
import { useSessionStore } from '@/store/sessionStore';

/** Secret values cannot be read back from ADO; represented as a placeholder. */
const SECRET_PLACEHOLDER = '';

/** Tool - export every (or a chosen subset of) a project's variable groups into one multi-sheet XLSX workbook. */
export function ExportAllGroups() {
  const organization = useSessionStore((s) => s.organization);
  const project = useSessionStore((s) => s.selectedProject);
  const { data: groups, isLoading, isError, error, refetch } = useVariableGroups();

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');

  // Pre-check every group the first time the list loads; leave user edits
  // alone on any later refetch.
  useEffect(() => {
    if (groups && !initialized) {
      setSelected(new Set(groups.map((g) => g.id)));
      setInitialized(true);
    }
  }, [groups, initialized]);

  const total = groups?.length ?? 0;
  const selectedGroups = (groups ?? []).filter((g) => selected.has(g.id));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? (groups ?? []).filter((g) => g.name.toLowerCase().includes(q)) : (groups ?? []);
  }, [groups, search]);

  // "Select all" operates on the filtered list - so when searching it only toggles visible items
  const allFilteredSelected = filtered.length > 0 && filtered.every((g) => selected.has(g.id));

  const hasSecrets = selectedGroups.some((g) => variableEntries(g).some((e) => e.isSecret));

  const toggleAll = () => {
    if (!groups) return;
    if (allFilteredSelected) {
      // Deselect only the filtered items, keep others
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((g) => next.delete(g.id));
        return next;
      });
    } else {
      // Select all filtered items (add to existing selection)
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((g) => next.add(g.id));
        return next;
      });
    }
  };

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filename = project
    ? `${safeFilename(organization ? `${organization}-${project.name}` : project.name)}-variable-groups.xlsx`
    : 'variable-groups.xlsx';

  const handleExport = async () => {
    if (selectedGroups.length === 0) return;
    setExporting(true);
    try {
      await exportVariableGroupWorkbook(
        filename,
        selectedGroups.map((g) => ({
          name: g.name,
          rows: variableEntries(g).map((e) => ({
            key: e.key,
            value: e.value ?? SECRET_PLACEHOLDER,
          })),
        })),
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <RequireProject>
      <PageLayout
        title="Export All Variable Groups"
        description="Export every (or a chosen subset of) this project's variable groups into one XLSX workbook, one sheet per group."
        icon={Layers}
      >
        {isLoading && <Skeleton className="h-64 w-full" />}
        {isError && <ErrorBanner error={error} onRetry={() => refetch()} />}

        {!isLoading && !isError && total === 0 && (
          <EmptyState
            icon={Boxes}
            title="No variable groups"
            description="This project has no variable groups, or your PAT lacks read access."
          />
        )}

        {!isLoading && !isError && total > 0 && groups && (
          <>
            <SectionCard
              title={
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <Checkbox checked={allFilteredSelected} onCheckedChange={toggleAll} />
                  {search ? 'Select filtered' : 'Select all'}
                </label>
              }
              actions={
                <Badge variant="secondary">
                  {selected.size}/{total} selected
                </Badge>
              }
              contentClassName="p-0"
            >
              {/* Search bar */}
              <div className="flex items-center gap-2 border-b px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter groups…"
                  className="h-7 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:border-0"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {filtered.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No groups match "{search}".
                </p>
              ) : (
                <ul className="max-h-80 divide-y divide-border overflow-y-auto scrollbar-thin">
                  {filtered.map((g) => (
                    <li key={g.id}>
                      <label className="flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-muted/50">
                        <span className="flex items-center gap-2.5 truncate">
                          <Checkbox
                            checked={selected.has(g.id)}
                            onCheckedChange={() => toggleOne(g.id)}
                          />
                          <span className="truncate">{g.name}</span>
                        </span>
                        <span className="flex-shrink-0 text-xs text-muted-foreground">
                          {variableCount(g)} vars
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            {hasSecrets && (
              <Callout variant="warning">
                Secret variables cannot be read from Azure DevOps; their values are exported empty.
              </Callout>
            )}

            <SectionCard title="XLSX export">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Download className="h-5 w-5 flex-shrink-0" />
                  {selected.size === 0 ? (
                    <span>Select at least one group to export.</span>
                  ) : (
                    <span>
                      <span className="font-medium text-foreground">{filename}</span> -{' '}
                      {selected.size} sheet{selected.size === 1 ? '' : 's'}.
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={handleExport}
                  disabled={selected.size === 0 || exporting}
                >
                  {exporting ? <Loader2 className="animate-spin" /> : <Download />}
                  {exporting ? 'Preparing…' : 'Download'}
                </Button>
              </div>
            </SectionCard>
          </>
        )}
      </PageLayout>
    </RequireProject>
  );
}
