/** Characters Excel forbids in a sheet name. */
const INVALID_SHEET_CHARS = /[:\\/?*[\]]/g;

/**
 * The OOXML/xlsx spec caps sheet names at 31 chars. This isn't just an Excel
 * UI restriction — the `xlsx` writer itself throws if given a longer name, so
 * this can't be raised without switching libraries. The full, untruncated
 * name is never actually lost though: it's written into the sheet content
 * itself (see buildKeyValueSheet) and it's also what the downloaded filename
 * is built from.
 */
export function safeSheetName(label: string): string {
  const cleaned = label.replace(INVALID_SHEET_CHARS, ' ').trim().slice(0, 31);
  return cleaned || 'Sheet1';
}

export interface XlsxRow {
  key: string;
  value: string;
}

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Build a Key/Value sheet with the full (untruncated) source name as a merged
 * title row above the table, so the tab-name length limit never loses
 * information — only where it's displayed.
 */
function buildKeyValueSheet(XLSX: typeof import('xlsx'), fullName: string, rows: XlsxRow[]) {
  const sheetData = [
    [`Variable Group Name = ${fullName}`],
    ['Key', 'Value'],
    ...rows.map((r) => [r.key, r.value]),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(sheetData);
  sheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  return sheet;
}

/**
 * Build a single-sheet Key/Value workbook and trigger its download. The
 * `xlsx` library (~700KB) is dynamically imported here so it only loads when
 * a user actually exports to XLSX, instead of bloating the main bundle for
 * everyone.
 */
export async function exportKeyValueXlsx(
  filename: string,
  sheetName: string,
  rows: XlsxRow[],
): Promise<void> {
  const XLSX = await import('xlsx');

  const sheet = buildKeyValueSheet(XLSX, sheetName, rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, safeSheetName(sheetName));

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  const blob = new Blob([buffer], { type: XLSX_MIME });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
