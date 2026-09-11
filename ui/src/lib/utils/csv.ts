/** Minimal RFC-4180-ish CSV parsing/serialization for `Key,Value` files. */

export interface CsvRow {
  key: string;
  value: string;
}

export interface CsvParseResult {
  rows: CsvRow[];
  /** Non-fatal warnings (skipped blank lines, malformed rows). */
  warnings: string[];
}

/** Parse a full CSV record set, handling quoted fields and embedded newlines. */
function parseRecords(text: string): string[][] {
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;
  let i = 0;

  const pushField = () => {
    record.push(field);
    field = '';
  };
  const pushRecord = () => {
    pushField();
    records.push(record);
    record = [];
  };

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
    } else if (ch === ',') {
      pushField();
      i++;
    } else if (ch === '\r') {
      i++; // handled by \n
    } else if (ch === '\n') {
      pushRecord();
      i++;
    } else {
      field += ch;
      i++;
    }
  }
  // trailing field/record
  if (field.length > 0 || record.length > 0) {
    pushRecord();
  }
  return records;
}

/**
 * Parse a `Key,Value` CSV. A header row `Key,Value` (case-insensitive) is
 * detected and skipped. Later duplicate keys overwrite earlier ones.
 */
export function parseKeyValueCsv(text: string): CsvParseResult {
  const warnings: string[] = [];
  const records = parseRecords(text).filter((r) => r.some((c) => c.trim().length > 0));

  if (records.length === 0) {
    return { rows: [], warnings: ['The file is empty.'] };
  }

  let start = 0;
  const first = records[0];
  if (
    first &&
    first[0]?.trim().toLowerCase() === 'key' &&
    (first[1]?.trim().toLowerCase() === 'value' || first.length === 1)
  ) {
    start = 1;
  }

  const map = new Map<string, string>();
  for (let r = start; r < records.length; r++) {
    const rec = records[r]!;
    const key = (rec[0] ?? '').trim();
    const value = rec[1] ?? '';
    if (!key) {
      warnings.push(`Row ${r + 1}: missing key - skipped.`);
      continue;
    }
    if (map.has(key)) {
      warnings.push(`Row ${r + 1}: duplicate key "${key}" - last value wins.`);
    }
    map.set(key, value);
  }

  const rows: CsvRow[] = [...map.entries()].map(([key, value]) => ({ key, value }));
  return { rows, warnings };
}

/** Escape a single CSV field. */
function escapeField(field: string): string {
  if (/[",\r\n]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/** Serialize rows to a `Key,Value` CSV (with header). */
export function toKeyValueCsv(rows: CsvRow[]): string {
  const lines = ['Key,Value'];
  for (const { key, value } of rows) {
    lines.push(`${escapeField(key)},${escapeField(value)}`);
  }
  return lines.join('\n');
}
