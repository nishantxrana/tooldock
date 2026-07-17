import { Download } from 'lucide-react';
import { CopyButton } from './CopyButton';
import { Button } from '@/components/ui/button';
import { SectionCard } from './SectionCard';
import { downloadText } from '@/lib/utils/download';

interface OutputBlockProps {
  title?: string;
  value: string;
  /** Filename for the download button (omit to hide download). */
  downloadName?: string;
  downloadMime?: string;
  /** Extra actions rendered before copy/download. */
  actions?: React.ReactNode;
  emptyHint?: string;
}

/**
 * A read-only monospace output panel with copy + download actions. Reused by
 * the App Settings generation / sort / export tools.
 */
export function OutputBlock({
  title = 'Output',
  value,
  downloadName,
  downloadMime = 'text/plain',
  actions,
  emptyHint = 'Nothing to show yet.',
}: OutputBlockProps) {
  const hasValue = value.trim().length > 0;

  return (
    <SectionCard
      title={title}
      actions={
        <>
          {actions}
          {downloadName && (
            <Button
              variant="outline"
              size="sm"
              disabled={!hasValue}
              onClick={() => downloadText(downloadName, value, downloadMime)}
            >
              <Download />
              Download
            </Button>
          )}
          <CopyButton value={value} />
        </>
      }
      contentClassName="p-0"
    >
      {hasValue ? (
        <pre className="max-h-[420px] overflow-auto scrollbar-thin whitespace-pre-wrap break-words rounded-b-lg bg-muted/40 p-4 font-mono text-sm leading-relaxed">
          {value}
        </pre>
      ) : (
        <p className="p-4 text-sm text-muted-foreground">{emptyHint}</p>
      )}
    </SectionCard>
  );
}
