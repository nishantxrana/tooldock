import type { VariableGroup, VariableMap } from '@/types/ado';
import type { CsvRow } from '@/lib/utils/csv';

export type ImportStatus = 'new' | 'same' | 'overwrite';

export interface ImportRow {
  key: string;
  incoming: string;
  current: string | null;
  /** True when the current value is a secret (unreadable, so treated as overwrite). */
  currentIsSecret: boolean;
  status: ImportStatus;
}

export interface ImportPlan {
  rows: ImportRow[];
  counts: Record<ImportStatus, number>;
  /** The variables map to send in the update (existing + incoming). */
  nextVariables: VariableMap;
}

/**
 * Compute what a CSV import would do against an existing variable group.
 * Existing variables not present in the CSV are preserved untouched.
 */
export function buildImportPlan(existing: VariableGroup, csvRows: CsvRow[]): ImportPlan {
  const rows: ImportRow[] = [];
  const counts: Record<ImportStatus, number> = { new: 0, same: 0, overwrite: 0 };

  // Start from a deep-ish copy of existing variables to preserve untouched keys.
  const nextVariables: VariableMap = {};
  for (const [k, v] of Object.entries(existing.variables)) {
    nextVariables[k] = { ...v };
  }

  for (const { key, value } of csvRows) {
    const existingVar = existing.variables[key];
    let status: ImportStatus;
    let current: string | null = null;
    const currentIsSecret = Boolean(existingVar?.isSecret);

    if (!existingVar) {
      status = 'new';
    } else if (currentIsSecret) {
      // Secret value can't be read to compare; any write is an overwrite.
      status = 'overwrite';
    } else {
      current = existingVar.value ?? '';
      status = current === value ? 'same' : 'overwrite';
    }

    counts[status]++;
    rows.push({ key, incoming: value, current, currentIsSecret, status });

    // Apply the incoming value, preserving secret/read-only flags where present.
    nextVariables[key] = { ...(existingVar ?? {}), value };
  }

  rows.sort((a, b) => {
    const order: Record<ImportStatus, number> = { overwrite: 0, new: 1, same: 2 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return a.key.localeCompare(b.key);
  });

  return { rows, counts, nextVariables };
}
