import type { VariableMap } from '@/types/ado';

export type DiffStatus = 'identical' | 'changed' | 'left-only' | 'right-only' | 'both-secret';

export interface DiffRow {
  key: string;
  leftValue: string | null;  // null = secret
  rightValue: string | null; // null = secret
  leftSecret: boolean;
  rightSecret: boolean;
  status: DiffStatus;
}

export interface DiffCounts {
  identical: number;
  changed: number;
  leftOnly: number;
  rightOnly: number;
  bothSecret: number;
  total: number;
}

export interface DiffResult {
  rows: DiffRow[];
  counts: DiffCounts;
}

/**
 * Diff two variable maps key by key.
 *
 * - Identical   : key in both, same visible value
 * - Changed     : key in both, different value OR secret mismatch
 * - Both-secret : key in both, both secret (cannot compare values)
 * - Left-only   : key only in left group
 * - Right-only  : key only in right group
 */
export function diffGroups(left: VariableMap, right: VariableMap): DiffResult {
  const allKeys = [
    ...new Set([...Object.keys(left), ...Object.keys(right)]),
  ].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  const rows: DiffRow[] = allKeys.map((key) => {
    const lv = left[key];
    const rv = right[key];
    const inLeft = key in left;
    const inRight = key in right;

    const leftSecret = Boolean(lv?.isSecret);
    const rightSecret = Boolean(rv?.isSecret);
    const leftValue = leftSecret ? null : (lv?.value ?? '');
    const rightValue = rightSecret ? null : (rv?.value ?? '');

    let status: DiffStatus;
    if (!inLeft) {
      status = 'right-only';
    } else if (!inRight) {
      status = 'left-only';
    } else if (leftSecret && rightSecret) {
      status = 'both-secret';
    } else if (leftSecret !== rightSecret || leftValue !== rightValue) {
      status = 'changed';
    } else {
      status = 'identical';
    }

    return { key, leftValue, rightValue, leftSecret, rightSecret, status };
  });

  const counts: DiffCounts = {
    identical: rows.filter((r) => r.status === 'identical').length,
    changed: rows.filter((r) => r.status === 'changed').length,
    leftOnly: rows.filter((r) => r.status === 'left-only').length,
    rightOnly: rows.filter((r) => r.status === 'right-only').length,
    bothSecret: rows.filter((r) => r.status === 'both-secret').length,
    total: rows.length,
  };

  return { rows, counts };
}
