import type { VariableGroup, VariableMap } from '@/types/ado';

/** Variable names sorted alphabetically (case-insensitive). */
export function variableNames(group: Pick<VariableGroup, 'variables'>): string[] {
  return Object.keys(group.variables).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );
}

/** Entries [key, value] sorted by key. Secret values are surfaced as null. */
export function variableEntries(
  group: Pick<VariableGroup, 'variables'>,
): Array<{ key: string; value: string | null; isSecret: boolean }> {
  return variableNames(group).map((key) => {
    const v = group.variables[key];
    return {
      key,
      value: v?.isSecret ? null : (v?.value ?? ''),
      isSecret: Boolean(v?.isSecret),
    };
  });
}

/** Count of variables in a group. */
export function variableCount(group: Pick<VariableGroup, 'variables'>): number {
  return Object.keys(group.variables).length;
}

/** Build a plain VariableMap from key/value pairs (non-secret, writable). */
export function toVariableMap(pairs: Array<{ key: string; value: string }>): VariableMap {
  const map: VariableMap = {};
  for (const { key, value } of pairs) {
    map[key] = { value };
  }
  return map;
}
