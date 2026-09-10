import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import type { ImportRow, ImportStatus } from './importDiff';

const STATUS_META: Record<ImportStatus, { label: string; variant: BadgeProps['variant'] }> = {
  overwrite: { label: 'Overwrite', variant: 'warning' },
  new: { label: 'New', variant: 'success' },
  same: { label: 'Same', variant: 'secondary' },
};

function displayCurrent(row: ImportRow): string {
  if (row.currentIsSecret) return '(secret)';
  if (row.current === null) return '—';
  if (row.current === '') return '(empty)';
  return row.current;
}

interface ImportPreviewTableProps {
  rows: ImportRow[];
  /** When true, "same" rows are hidden. Default false. */
  hideSame?: boolean;
  /** When set, only rows matching this status are shown. */
  statusFilter?: ImportStatus | 'all';
  /** Optional keyword filter applied to key names. */
  search?: string;
}

/** Preview table showing per-key New / Same / Overwrite status. */
export function ImportPreviewTable({
  rows,
  hideSame = false,
  statusFilter = 'all',
  search = '',
}: ImportPreviewTableProps) {
  const visible = useMemo(() => {
    return rows.filter((r) => {
      if (hideSame && r.status === 'same') return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (search && !r.key.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [rows, hideSame, statusFilter, search]);

  return (
    <div className="max-h-[420px] overflow-auto scrollbar-thin rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 bg-card">
          <TableRow>
            <TableHead>Variable</TableHead>
            <TableHead>Current</TableHead>
            <TableHead>Incoming</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                No rows match the current filter.
              </TableCell>
            </TableRow>
          ) : (
            visible.map((row) => {
              const meta = STATUS_META[row.status];
              return (
                <TableRow
                  key={row.key}
                  className={cn(row.status === 'overwrite' && 'bg-warning/10 hover:bg-warning/15')}
                >
                  <TableCell className="font-mono text-sm font-medium">{row.key}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {displayCurrent(row)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {row.incoming === '' ? '(empty)' : row.incoming}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/** Toolbar with search + status filter + hide-same toggle, renders the table below. */
export function ImportPreviewTableWithControls({ rows }: { rows: ImportRow[] }) {
  const [hideSame, setHideSame] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ImportStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => {
    const c: Record<ImportStatus | 'all', number> = {
      all: rows.length,
      overwrite: 0,
      new: 0,
      same: 0,
    };
    for (const r of rows) c[r.status]++;
    return c;
  }, [rows]);

  const filters: { id: ImportStatus | 'all'; label: string; variant: BadgeProps['variant'] }[] = [
    { id: 'all', label: 'All', variant: 'secondary' },
    { id: 'overwrite', label: 'Overwrite', variant: 'warning' },
    { id: 'new', label: 'New', variant: 'success' },
    { id: 'same', label: 'Same', variant: 'secondary' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Status filter pills */}
        <div className="flex items-center gap-1 rounded-md border p-0.5">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={cn(
                'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors',
                statusFilter === f.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
              <Badge variant={f.variant} className="h-4 px-1 text-[10px]">
                {counts[f.id]}
              </Badge>
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search keys…"
          className="h-8 flex-1 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring min-w-[160px]"
        />

        {/* Hide same toggle */}
        <Button
          variant={hideSame ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setHideSame((v) => !v)}
        >
          {hideSame ? 'Showing changes only' : 'Showing all rows'}
        </Button>
      </div>

      <ImportPreviewTable
        rows={rows}
        hideSame={hideSame}
        statusFilter={statusFilter}
        search={search}
      />
    </div>
  );
}
