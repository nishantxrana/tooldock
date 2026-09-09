/**
 * Helpers for the Azure App Service "App settings" string format used by the
 * "Application and Configuration Settings" field of the Azure App Service Deploy
 * task, e.g.:
 *
 *   -KEY1 "$(KEY1)" -KEY2 "$(KEY2)"
 *
 * Only KEY names are meaningful for ToolDock; values are ignored.
 */

export type AppSettingsFormat = 'multiline' | 'oneline';

/** Render an array of keys as the `-KEY "$(KEY)"` string. */
export function formatAppSettings(keys: string[], format: AppSettingsFormat): string {
  const parts = keys.map((k) => `-${k} "$(${k})"`);
  return format === 'oneline' ? parts.join(' ') : parts.join('\n');
}

/** A single parsed key with the (1-based) line number it appeared on. */
export interface ParsedKey {
  key: string;
  line: number;
}

/**
 * Extract keys from pasted App Settings text. Understands the common shapes:
 *   -KEY "$(KEY)"      →  KEY
 *   -KEY value         →  KEY
 *   KEY=value          →  KEY
 *   KEY                →  KEY
 * Whitespace-only lines are skipped. Keys are returned in appearance order,
 * one entry per occurrence (duplicates preserved) with their line numbers.
 */
export function parseAppSettingsKeys(text: string): ParsedKey[] {
  const result: ParsedKey[] = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) return;

    // A single line may contain multiple "-KEY ..." tokens (one-line format).
    // Colons are valid in Azure App Service key names (hierarchy separator on Windows).
    const dashMatches = line.match(/-([A-Za-z_][A-Za-z0-9_.:-]*)/g);
    if (dashMatches && line.startsWith('-')) {
      for (const m of dashMatches) {
        result.push({ key: m.slice(1), line: idx + 1 });
      }
      return;
    }

    // KEY=value
    const eq = line.indexOf('=');
    if (eq > 0) {
      const key = line.slice(0, eq).trim();
      if (/^[A-Za-z_][A-Za-z0-9_.:-]*$/.test(key)) {
        result.push({ key, line: idx + 1 });
        return;
      }
    }

    // Bare KEY (possibly "KEY value")
    const bare = line.split(/\s+/)[0];
    if (bare && /^[A-Za-z_][A-Za-z0-9_.:-]*$/.test(bare)) {
      result.push({ key: bare, line: idx + 1 });
    }
  });

  return result;
}

/** Distinct keys, in first-seen order. */
export function distinctKeys(parsed: ParsedKey[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const { key } of parsed) {
    if (!seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}

/** Groups of duplicated keys with the line numbers where each appeared. */
export interface DuplicateGroup {
  key: string;
  lines: number[];
}

export function findDuplicateKeys(parsed: ParsedKey[]): DuplicateGroup[] {
  const byKey = new Map<string, number[]>();
  for (const { key, line } of parsed) {
    const arr = byKey.get(key) ?? [];
    arr.push(line);
    byKey.set(key, arr);
  }
  const dupes: DuplicateGroup[] = [];
  for (const [key, lines] of byKey) {
    if (lines.length > 1) dupes.push({ key, lines });
  }
  return dupes.sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Sort the non-empty lines of pasted text alphabetically (case-insensitive),
 * preserving each line's original formatting. Blank lines are dropped.
 */
export function sortLines(text: string): string {
  return text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0)
    .sort((a, b) => a.trim().localeCompare(b.trim(), undefined, { sensitivity: 'base' }))
    .join('\n');
}

/** Count non-empty lines. */
export function countLines(text: string): number {
  return text.split(/\r?\n/).filter((l) => l.trim().length > 0).length;
}
