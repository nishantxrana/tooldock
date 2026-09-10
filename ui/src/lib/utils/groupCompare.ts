import type { VariableGroup, VariableMap } from '@/types/ado';

export type CellStatus = 'value' | 'secret' | 'missing';

export interface CompareCell {
  status: CellStatus;
  value: string; // '' when secret or missing
}

/** same = all present + identical non-secret values
 *  conflict = present in all but values differ or any secret
 *  partial = missing in ≥1 group */
export type RowStatus = 'same' | 'conflict' | 'partial';

export interface CompareRow {
  key: string;
  cells: CompareCell[]; // one per group, in input order
  rowStatus: RowStatus;
}

export interface CompareCounts {
  same: number;
  conflict: number;
  partial: number;
  total: number;
}

export interface CompareResult {
  rows: CompareRow[];
  counts: CompareCounts;
}

export function compareGroups(groups: VariableGroup[]): CompareResult {
  const maps: VariableMap[] = groups.map((g) => g.variables ?? {});

  const allKeys = [
    ...new Set(maps.flatMap((m) => Object.keys(m))),
  ].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  const rows: CompareRow[] = allKeys.map((key) => {
    const cells: CompareCell[] = maps.map((m) => {
      if (!(key in m)) return { status: 'missing', value: '' };
      const v = m[key];
      if (v?.isSecret) return { status: 'secret', value: '' };
      return { status: 'value', value: v?.value ?? '' };
    });

    let rowStatus: RowStatus;
    const hasMissing = cells.some((c) => c.status === 'missing');
    if (hasMissing) {
      rowStatus = 'partial';
    } else {
      const hasSecret = cells.some((c) => c.status === 'secret');
      if (hasSecret) {
        rowStatus = 'conflict'; // can't verify equality
      } else {
        const values = cells.map((c) => c.value);
        rowStatus = values.every((v) => v === values[0]) ? 'same' : 'conflict';
      }
    }

    return { key, cells, rowStatus };
  });

  const counts: CompareCounts = {
    same: rows.filter((r) => r.rowStatus === 'same').length,
    conflict: rows.filter((r) => r.rowStatus === 'conflict').length,
    partial: rows.filter((r) => r.rowStatus === 'partial').length,
    total: rows.length,
  };

  return { rows, counts };
}
