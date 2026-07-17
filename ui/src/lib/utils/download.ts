/** Trigger a browser download of the given text content. */
export function downloadText(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Make a filesystem-safe slug from an arbitrary label. */
export function safeFilename(label: string): string {
  return label.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '') || 'export';
}
