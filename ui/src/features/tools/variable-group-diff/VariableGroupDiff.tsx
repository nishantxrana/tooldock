import { useMemo, useState } from 'react';
import { ArrowLeftRight, Diff, Lock, X } from 'lucide-react';
import { SearchBox } from '@/components/common/SearchBox';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { RequireProject } from '@/components/common/RequireProject';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Combobox } from '@/components/ui/combobox';
import { diffGroups, type DiffRow, type DiffStatus } from '@/lib/utils/groupDiff';
import { exportDiffXlsx } from '@/lib/utils/xlsx';
import { variableCount } from '@/lib/utils/variables';
import { safeFilename } from '@/lib/utils/download';
import { useVariableGroups } from '@/lib/hooks/useVariableGroups';
import { cn } from '@/lib/utils/cn';
import type { VariableGroup } from '@/types/ado';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_LABEL: Record<DiffStatus, string> = {
  identical: 'Identical',
  changed: 'Changed',
  'left-only': 'Left only',
  'right-only': 'Right only',
  'both-secret': 'Both secret',
};

// Dot color per status (used on key cell and filter chips)
const STATUS_DOT: Record<DiffStatus, string> = {
  identical: 'bg-success',
  changed: 'bg-warning',
  'left-only': 'bg-primary',
  'right-only': 'bg-muted-foreground/50',
  'both-secret': 'bg-muted-foreground/30',
};

// Left border accent per status
const ROW_BORDER: Record<DiffStatus, string> = {
  identical: '',
  changed: 'border-l-2 border-l-warning bg-warning/5',
  'left-only': 'border-l-2 border-l-primary bg-primary/4',
  'right-only': 'border-l-2 border-l-muted-foreground/40 bg-muted/30',
  'both-secret': 'border-l-2 border-l-muted-foreground/20 bg-muted/15',
};

// Filter chip styles (active vs inactive)
const CHIP_ACTIVE: Record<DiffStatus, string> = {
  identical: 'bg-success/15 text-success border-success/30 ring-1 ring-success/20',
  changed: 'bg-warning/15 text-warning border-warning/30 ring-1 ring-warning/20',
  'left-only': 'bg-primary/12 text-primary border-primary/30 ring-1 ring-primary/20',
  'right-only': 'bg-muted-foreground/12 text-foreground border-border ring-1 ring-border',
  'both-secret': 'bg-muted/40 text-muted-foreground border-border ring-1 ring-border',
};

const CHIP_INACTIVE =
  'bg-transparent text-muted-foreground border-border/50 hover:border-border hover:text-foreground';

// ---------------------------------------------------------------------------
// Value cell
// ---------------------------------------------------------------------------

function ValueCell({
  value,
  secret,
  absent,
}: {
  value: string | null;
  secret: boolean;
  absent?: boolean;
}) {
  if (absent) return <span className="text-muted-foreground/25 select-none text-xs">—</span>;
  if (secret)
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
// Diff table (no Status column — encoded via border + dot)
// ---------------------------------------------------------------------------

function DiffTable({
  rows,
  leftName,
  rightName,
}: {
  rows: DiffRow[];
  leftName: string;
  rightName: string;
}) {
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
          <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground w-[30%]">
            Key
          </th>
          <th className="px-3 py-2.5 text-left text-xs font-semibold w-[35%]">
            <span className="inline-flex items-center gap-1.5 text-primary/80">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {leftName}
            </span>
          </th>
          <th className="px-3 py-2.5 text-left text-xs font-semibold w-[35%]">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground/70">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
              {rightName}
            </span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/30">
        {rows.map((row) => (
          <tr
            key={row.key}
            className={cn('transition-colors hover:brightness-95', ROW_BORDER[row.status])}
          >
            <td className="px-3 py-2 align-top">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={cn('h-1.5 w-1.5 rounded-full shrink-0 mt-0.5', STATUS_DOT[row.status])}
                  title={STATUS_LABEL[row.status]}
                />
                <span className="font-mono text-xs break-all">{row.key}</span>
              </span>
            </td>
            <td className="px-3 py-2 align-top">
              <ValueCell
                value={row.leftValue}
                secret={row.leftSecret}
                absent={row.status === 'right-only'}
              />
            </td>
            <td className="px-3 py-2 align-top">
              <ValueCell
                value={row.rightValue}
                secret={row.rightSecret}
                absent={row.status === 'left-only'}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// Group chip (compact selected-group display)
// ---------------------------------------------------------------------------

function GroupChip({
  group,
  side,
  onClear,
}: {
  group: VariableGroup;
  side: 'left' | 'right';
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 min-w-0">
      <span
        className={cn(
          'h-2 w-2 rounded-full shrink-0',
          side === 'left' ? 'bg-primary' : 'bg-muted-foreground/50',
        )}
      />
      <span className="truncate font-medium text-sm flex-1 min-w-0">{group.name}</span>
      <Badge variant="secondary" className="shrink-0 tabular-nums text-[10px]">
        {variableCount(group)} vars
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onClear}
        aria-label={`Remove ${group.name}`}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
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
  status: DiffStatus;
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
      <span className="opacity-70">{STATUS_LABEL[status].toLowerCase()}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function VariableGroupDiff() {
  const [leftGroup, setLeftGroup] = useState<VariableGroup | null>(null);
  const [rightGroup, setRightGroup] = useState<VariableGroup | null>(null);
  const [filter, setFilter] = useState('');
  const [activeStatuses, setActiveStatuses] = useState<Set<DiffStatus>>(new Set());
  const [exporting, setExporting] = useState(false);

  const { data: allGroups, isLoading, isError, error, refetch } = useVariableGroups();
  const groups = useMemo(() => allGroups ?? [], [allGroups]);

  const leftOptions = useMemo(
    () => groups.filter((g) => g.id !== rightGroup?.id),
    [groups, rightGroup],
  );
  const rightOptions = useMemo(
    () => groups.filter((g) => g.id !== leftGroup?.id),
    [groups, leftGroup],
  );

  const result = useMemo(() => {
    if (!leftGroup || !rightGroup) return null;
    return diffGroups(leftGroup.variables, rightGroup.variables);
  }, [leftGroup, rightGroup]);

  const filteredRows = useMemo(() => {
    if (!result) return [];
    let rows = result.rows;
    if (activeStatuses.size > 0) rows = rows.filter((r) => activeStatuses.has(r.status));
    if (filter) rows = rows.filter((r) => r.key.toLowerCase().includes(filter.toLowerCase()));
    return rows;
  }, [result, activeStatuses, filter]);

  const toggleStatus = (s: DiffStatus) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const canCompare = Boolean(leftGroup && rightGroup);
  const hasDifferences = result
    ? result.counts.changed + result.counts.leftOnly + result.counts.rightOnly > 0
    : false;

  const handleExport = async () => {
    if (!result || !leftGroup || !rightGroup) return;
    setExporting(true);
    try {
      await exportDiffXlsx(
        `${safeFilename(leftGroup.name)}-vs-${safeFilename(rightGroup.name)}-diff.xlsx`,
        leftGroup.name,
        rightGroup.name,
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
                <Diff className="h-3.5 w-3.5" />
              </span>
              <div>
                <h1 className="text-sm font-semibold tracking-tight">Variable Group Diff</h1>
                <p className="text-xs text-muted-foreground/70">
                  Compare two variable groups key by key
                </p>
              </div>
            </div>

            {/* Group pickers */}
            {isError && <ErrorBanner error={error} onRetry={() => refetch()} />}
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                {leftGroup ? (
                  <GroupChip group={leftGroup} side="left" onClear={() => setLeftGroup(null)} />
                ) : (
                  <Combobox
                    options={leftOptions.map((g) => ({
                      value: String(g.id),
                      label: g.name,
                      description: `${variableCount(g)} vars`,
                    }))}
                    onChange={(v) => {
                      const g = groups.find((g) => g.id === Number(v));
                      if (g) setLeftGroup(g);
                    }}
                    placeholder="Left group…"
                    searchPlaceholder="Search groups…"
                  />
                )}
                <ArrowLeftRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                {rightGroup ? (
                  <GroupChip group={rightGroup} side="right" onClear={() => setRightGroup(null)} />
                ) : (
                  <Combobox
                    options={rightOptions.map((g) => ({
                      value: String(g.id),
                      label: g.name,
                      description: `${variableCount(g)} vars`,
                    }))}
                    onChange={(v) => {
                      const g = groups.find((g) => g.id === Number(v));
                      if (g) setRightGroup(g);
                    }}
                    placeholder="Right group…"
                    searchPlaceholder="Search groups…"
                  />
                )}
              </div>
            )}

            {/* Toolbar: filter + status chips + export — only after both groups selected */}
            {canCompare && result && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Overall verdict pill */}
                <span
                  className={cn(
                    'text-xs font-semibold mr-1',
                    hasDifferences ? 'text-warning' : 'text-success',
                  )}
                >
                  {hasDifferences ? 'Differences found' : 'Fully identical'}
                </span>

                {/* Clickable status filter chips */}
                {(
                  ['identical', 'changed', 'left-only', 'right-only', 'both-secret'] as DiffStatus[]
                ).map((s) => {
                  const count =
                    s === 'identical'
                      ? result.counts.identical
                      : s === 'changed'
                        ? result.counts.changed
                        : s === 'left-only'
                          ? result.counts.leftOnly
                          : s === 'right-only'
                            ? result.counts.rightOnly
                            : result.counts.bothSecret;
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

                {/* Spacer */}
                <div className="flex-1" />

                {/* Search */}
                <SearchBox
                  value={filter}
                  onChange={setFilter}
                  placeholder="Filter keys…"
                  className="w-44"
                />

                {/* Export */}
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
                  icon={Diff}
                  title="Select two groups to compare"
                  description="Pick a left and a right variable group above. Keys, values, and secrets are compared side by side."
                />
              </div>
            ) : result ? (
              <>
                <DiffTable
                  rows={filteredRows}
                  leftName={leftGroup!.name}
                  rightName={rightGroup!.name}
                />
                {/* Footer: row count + legend */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-border/40 px-3 py-2.5 text-xs text-muted-foreground bg-muted/10">
                  <span className="tabular-nums font-medium">
                    {filteredRows.length === result.counts.total
                      ? `${result.counts.total} keys`
                      : `${filteredRows.length} of ${result.counts.total} keys`}
                  </span>
                  <span className="h-3 w-px bg-border/50" />
                  {[
                    { status: 'identical' as DiffStatus, desc: 'Same value' },
                    { status: 'changed' as DiffStatus, desc: 'Value differs' },
                    { status: 'left-only' as DiffStatus, desc: 'Missing from right' },
                    { status: 'right-only' as DiffStatus, desc: 'Missing from left' },
                    { status: 'both-secret' as DiffStatus, desc: 'Both secret' },
                  ].map(({ status, desc }) => (
                    <span key={status} className="flex items-center gap-1.5">
                      <span
                        className={cn('h-1.5 w-1.5 rounded-full shrink-0', STATUS_DOT[status])}
                      />
                      <span className="text-muted-foreground/70">{STATUS_LABEL[status]}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span>{desc}</span>
                    </span>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </RequireProject>
  );
}
