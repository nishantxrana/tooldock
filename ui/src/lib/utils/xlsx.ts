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

/**
 * Sheet name for one sheet of a multi-group export: a zero-padded ordinal
 * prefix (width matches the total sheet count, e.g. "01 - ", "02 - " for
 * 10-99 sheets) followed by as much of the sanitized name as fits in 31
 * chars. The prefix alone guarantees uniqueness, so no collision/dedupe
 * logic is needed even if two group names happened to be identical.
 */
export function indexedSheetName(index: number, total: number, label: string): string {
  const width = String(total).length;
  const prefix = `${String(index).padStart(width, '0')} - `;
  const maxNameLen = Math.max(31 - prefix.length, 1);
  const cleaned = label.replace(INVALID_SHEET_CHARS, ' ').trim().slice(0, maxNameLen);
  return `${prefix}${cleaned || 'Sheet'}`;
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

/** Serialize a workbook and trigger its download as a .xlsx file. */
function downloadWorkbook(
  XLSX: typeof import('xlsx'),
  workbook: ReturnType<(typeof import('xlsx'))['utils']['book_new']>,
  filename: string,
): void {
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
  options: { titleRow?: boolean } = {},
): Promise<void> {
  const { titleRow = true } = options;
  const XLSX = await import('xlsx');

  let sheet;
  if (titleRow) {
    sheet = buildKeyValueSheet(XLSX, sheetName, rows);
  } else {
    const sheetData = [['Key', 'Value'], ...rows.map((r) => [r.key, r.value])];
    sheet = XLSX.utils.aoa_to_sheet(sheetData);
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, safeSheetName(sheetName));

  downloadWorkbook(XLSX, workbook, filename);
}

export interface ReleaseMappingRow {
  groupName: string;
  pipelineName: string;
  stageName: string;
  scope: string;
}

/**
 * Build and download a single-sheet release pipeline mapping workbook.
 * Columns: Variable Group | Pipeline Name | Stage | Scope
 * Title row merges across all 4 columns.
 */
export async function exportReleaseMappingXlsx(
  filename: string,
  title: string,
  rows: ReleaseMappingRow[],
): Promise<void> {
  const XLSX = await import('xlsx');

  const sheetData = [
    [title, '', '', ''],
    ['Variable Group', 'Pipeline Name', 'Stage', 'Scope'],
    ...rows.map((r) => [r.groupName, r.pipelineName, r.stageName, r.scope]),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(sheetData);
  sheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Pipeline Mapping');
  downloadWorkbook(XLSX, workbook, filename);
}

export interface XlsxSheetInput {
  name: string;
  rows: XlsxRow[];
}

/**
 * Build a multi-sheet workbook, one sheet per variable group, and trigger its
 * download. Sheet tabs get an ordinal prefix (see indexedSheetName) so
 * multiple groups never collide once truncated to Excel's 31-char limit.
 */
export async function exportVariableGroupWorkbook(
  filename: string,
  sheets: XlsxSheetInput[],
): Promise<void> {
  const XLSX = await import('xlsx');

  const workbook = XLSX.utils.book_new();
  sheets.forEach((s, i) => {
    const sheet = buildKeyValueSheet(XLSX, s.name, s.rows);
    const tabName = indexedSheetName(i + 1, sheets.length, s.name);
    XLSX.utils.book_append_sheet(workbook, sheet, tabName);
  });

  downloadWorkbook(XLSX, workbook, filename);
}
