import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge, type BadgeProps } from '@/components/ui/badge';
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

/** Preview table showing per-key New / Same / Overwrite status. */
export function ImportPreviewTable({ rows }: { rows: ImportRow[] }) {
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
          {rows.map((row) => {
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
          })}
        </TableBody>
      </Table>
    </div>
  );
}
