import { useMemo, useState } from 'react';
import { GitCompareArrows, Lock, X } from 'lucide-react';
import { SearchBox } from '@/components/common/SearchBox';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { RequireProject } from '@/components/common/RequireProject';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Combobox } from '@/components/ui/combobox';
import { compareGroups, type CompareRow, type RowStatus } from '@/lib/utils/groupCompare';
import { exportMultiGroupXlsx } from '@/lib/utils/xlsx';
import { variableCount } from '@/lib/utils/variables';
import { safeFilename } from '@/lib/utils/download';
import { useVariableGroups } from '@/lib/hooks/useVariableGroups';
import { cn } from '@/lib/utils/cn';
import type { VariableGroup } from '@/types/ado';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Color palette - one per group slot (up to 8)
// ---------------------------------------------------------------------------

const GROUP_PALETTE = [
  { dot: 'bg-primary', text: 'text-primary', border: 'border-primary/30', bg: 'bg-primary/8' },
  {
    dot: 'bg-amber-500',
    text: 'text-amber-600',
    border: 'border-amber-400/40',
    bg: 'bg-amber-50/80 dark:bg-amber-950/30',
  },
  {
    dot: 'bg-emerald-500',
    text: 'text-emerald-600',
    border: 'border-emerald-400/40',
    bg: 'bg-emerald-50/80 dark:bg-emerald-950/30',
  },
  {
    dot: 'bg-violet-500',
    text: 'text-violet-600',
    border: 'border-violet-400/40',
    bg: 'bg-violet-50/80 dark:bg-violet-950/30',
  },
  {
    dot: 'bg-rose-500',
    text: 'text-rose-600',
    border: 'border-rose-400/40',
    bg: 'bg-rose-50/80 dark:bg-rose-950/30',
  },
  {
    dot: 'bg-cyan-500',
    text: 'text-cyan-600',
    border: 'border-cyan-400/40',
    bg: 'bg-cyan-50/80 dark:bg-cyan-950/30',
  },
  {
    dot: 'bg-orange-500',
    text: 'text-orange-600',
    border: 'border-orange-400/40',
    bg: 'bg-orange-50/80 dark:bg-orange-950/30',
  },
  {
    dot: 'bg-pink-500',
    text: 'text-pink-600',
    border: 'border-pink-400/40',
    bg: 'bg-pink-50/80 dark:bg-pink-950/30',
  },
] as const;

const MAX_GROUPS = 8;

// ---------------------------------------------------------------------------
// Row status config
// ---------------------------------------------------------------------------

const ROW_STATUS_LABEL: Record<RowStatus, string> = {
  same: 'Same',
  conflict: 'Conflict',
  partial: 'Missing in some',
};

const ROW_CLASS: Record<RowStatus, string> = {
  same: 'opacity-50 hover:opacity-100',
  conflict: 'bg-warning/6 border-l-2 border-l-warning',
  partial: 'bg-primary/4 border-l-2 border-l-primary/50',
};

const STATUS_DOT: Record<RowStatus, string> = {
  same: 'bg-success',
  conflict: 'bg-warning',
  partial: 'bg-primary/60',
};

const CHIP_ACTIVE: Record<RowStatus, string> = {
  same: 'bg-success/15 text-success border-success/30 ring-1 ring-success/20',
  conflict: 'bg-warning/15 text-warning border-warning/30 ring-1 ring-warning/20',
  partial: 'bg-primary/12 text-primary border-primary/30 ring-1 ring-primary/20',
};

const CHIP_INACTIVE =
  'bg-transparent text-muted-foreground border-border/50 hover:border-border hover:text-foreground';

// ---------------------------------------------------------------------------
// Cell display
// ---------------------------------------------------------------------------

function CellValue({ status, value }: { status: string; value: string }) {
  if (status === 'missing')
    return <span className="text-muted-foreground/25 select-none text-xs">-</span>;
  if (status === 'secret')
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground/50 italic text-xs">
        <Lock className="h-3 w-3 shrink-0" />
        secret
      </span>
    );
  if (!value) return <span className="text-muted-foreground/40 italic text-xs">empty</span>;
  return (
    <span className="font-mono text-xs break-all leading-relaxed" title={value}>
      {value}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Compare table
// ---------------------------------------------------------------------------

function CompareTable({ rows, groups }: { rows: CompareRow[]; groups: VariableGroup[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">No keys match the current filters.</p>
      </div>
    );
  }

  return (
    <table className="w-full text-sm border-collapse">
      <thead className="sticky top-0 z-10">
        <tr className="border-b border-border bg-muted/50 backdrop-blur-sm">
          <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground w-[220px] min-w-[160px]">
            Key
          </th>
          {groups.map((g, i) => {
            const palette = GROUP_PALETTE[i % GROUP_PALETTE.length]!;
            return (
              <th key={g.id} className="px-3 py-2.5 text-left text-xs font-semibold min-w-[160px]">
                <span className={cn('inline-flex items-center gap-1.5', palette.text)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', palette.dot)} />
                  <span className="truncate max-w-[180px]" title={g.name}>
                    {g.name}
                  </span>
                </span>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody className="divide-y divide-border/30">
        {rows.map((row) => (
          <tr key={row.key} className={cn('transition-all', ROW_CLASS[row.rowStatus])}>
            <td className="px-3 py-2 align-top">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0 mt-0.5',
                    STATUS_DOT[row.rowStatus],
                  )}
                  title={ROW_STATUS_LABEL[row.rowStatus]}
                />
                <span className="font-mono text-xs break-all">{row.key}</span>
              </span>
            </td>
            {row.cells.map((cell, ci) => (
              <td key={ci} className="px-3 py-2 align-top">
                <CellValue status={cell.status} value={cell.value} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// Group chip
// ---------------------------------------------------------------------------

function GroupChip({
  group,
  index,
  onRemove,
}: {
  group: VariableGroup;
  index: number;
  onRemove: () => void;
}) {
  const palette = GROUP_PALETTE[index % GROUP_PALETTE.length]!;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        palette.border,
        palette.bg,
        palette.text,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', palette.dot)} />
      <span className="max-w-[140px] truncate" title={group.name}>
        {group.name}
      </span>
      <span className="opacity-50 tabular-nums">({variableCount(group)})</span>
      <button
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        aria-label={`Remove ${group.name}`}
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status filter chip
// ---------------------------------------------------------------------------

function StatusChip({
  status,
  count,
  active,
  onClick,
}: {
  status: RowStatus;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  if (count === 0) return null;
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
        active ? CHIP_ACTIVE[status] : CHIP_INACTIVE,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', STATUS_DOT[status])} />
      <span className="tabular-nums">{count}</span>
      <span className="opacity-70">{ROW_STATUS_LABEL[status].toLowerCase()}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MultiGroupCompare() {
  const [selectedGroups, setSelectedGroups] = useState<VariableGroup[]>([]);
  const [filter, setFilter] = useState('');
  const [activeStatuses, setActiveStatuses] = useState<Set<RowStatus>>(new Set());
  const [exporting, setExporting] = useState(false);

  const { data: allGroups, isLoading, isError, error, refetch } = useVariableGroups();
  const groups = useMemo(() => allGroups ?? [], [allGroups]);

  const availableGroups = useMemo(
    () => groups.filter((g) => !selectedGroups.some((s) => s.id === g.id)),
    [groups, selectedGroups],
  );

  const addGroup = (id: string) => {
    const g = groups.find((g) => g.id === Number(id));
    if (g) setSelectedGroups((prev) => [...prev, g]);
  };

  const removeGroup = (id: number) => setSelectedGroups((prev) => prev.filter((g) => g.id !== id));

  const result = useMemo(() => {
    if (selectedGroups.length < 2) return null;
    return compareGroups(selectedGroups);
  }, [selectedGroups]);

  const filteredRows = useMemo(() => {
    if (!result) return [];
    let rows = result.rows;
    if (activeStatuses.size > 0) rows = rows.filter((r) => activeStatuses.has(r.rowStatus));
    if (filter) rows = rows.filter((r) => r.key.toLowerCase().includes(filter.toLowerCase()));
    return rows;
  }, [result, activeStatuses, filter]);

  const toggleStatus = (s: RowStatus) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const canCompare = selectedGroups.length >= 2;

  const handleExport = async () => {
    if (!result) return;
    setExporting(true);
    try {
      const namePart = selectedGroups.map((g) => safeFilename(g.name)).join('-vs-');
      await exportMultiGroupXlsx(
        `${namePart}-compare.xlsx`,
        selectedGroups.map((g) => g.name),
        result.rows,
      );
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <RequireProject>
      <div className="flex h-full flex-col overflow-hidden">
        {/* ── Top bar ─────────────────────────────────────────── */}
        <div className="shrink-0 border-b border-border bg-background">
          <div className="mx-auto w-full max-w-6xl space-y-3 px-6 py-4">
            {/* Title */}
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
                <GitCompareArrows className="h-3.5 w-3.5" />
              </span>
              <div>
                <h1 className="text-sm font-semibold tracking-tight">Multi-Group Compare</h1>
                <p className="text-xs text-muted-foreground/70">
                  Compare up to {MAX_GROUPS} variable groups side by side
                </p>
              </div>
            </div>

            {/* Group chips + add picker */}
            {isError && <ErrorBanner error={error} onRetry={() => refetch()} />}
            {isLoading ? (
              <div className="flex gap-2">
                <Skeleton className="h-7 w-32 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
                <Skeleton className="h-7 w-36 rounded-full" />
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {selectedGroups.map((g, i) => (
                  <GroupChip key={g.id} group={g} index={i} onRemove={() => removeGroup(g.id)} />
                ))}

                {selectedGroups.length < MAX_GROUPS && availableGroups.length > 0 && (
                  <Combobox
                    options={availableGroups.map((g) => ({
                      value: String(g.id),
                      label: g.name,
                      description: `${variableCount(g)} vars`,
                    }))}
                    onChange={addGroup}
                    placeholder="+ Add group"
                    searchPlaceholder="Search groups…"
                    className="h-7 rounded-full border-dashed text-xs px-3"
                  />
                )}

                {selectedGroups.length === 0 && (
                  <p className="text-xs text-muted-foreground/60">
                    Add at least 2 groups to compare
                  </p>
                )}
              </div>
            )}

            {/* Toolbar - only when ≥2 groups */}
            {canCompare && result && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Status chips */}
                {(['conflict', 'partial', 'same'] as RowStatus[]).map((s) => {
                  const count =
                    s === 'conflict'
                      ? result.counts.conflict
                      : s === 'partial'
                        ? result.counts.partial
                        : result.counts.same;
                  return (
                    <StatusChip
                      key={s}
                      status={s}
                      count={count}
                      active={activeStatuses.has(s)}
                      onClick={() => toggleStatus(s)}
                    />
                  );
                })}

                <div className="flex-1" />

                <SearchBox
                  value={filter}
                  onChange={setFilter}
                  placeholder="Filter keys…"
                  className="w-44"
                />

                <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
                  {exporting ? 'Exporting…' : 'Export XLSX'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ── Scrollable table ─────────────────────────────────── */}
        <div className="flex-1 overflow-hidden flex justify-center">
          <div className="w-full max-w-6xl overflow-y-auto overflow-x-auto scrollbar-thin">
            {!canCompare ? (
              <div className="flex h-[60vh] items-center justify-center px-6">
                <EmptyState
                  icon={GitCompareArrows}
                  title="Add groups to compare"
                  description="Select 2–8 variable groups above. Each key is shown as a row; each group is a column. Conflicts and missing keys are highlighted automatically."
                />
              </div>
            ) : result ? (
              <>
                <CompareTable rows={filteredRows} groups={selectedGroups} />

                {/* Footer */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/40 px-3 py-2.5 text-xs text-muted-foreground bg-muted/10">
                  <span className="tabular-nums font-medium">
                    {filteredRows.length === result.counts.total
                      ? `${result.counts.total} keys`
                      : `${filteredRows.length} of ${result.counts.total} keys`}
                  </span>
                  <span className="h-3 w-px bg-border/50" />
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                    Conflict - values differ between groups
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                    Missing in some groups
                  </span>
                  <span className="flex items-center gap-1.5 opacity-60">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    Same everywhere (dimmed)
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </RequireProject>
  );
}
