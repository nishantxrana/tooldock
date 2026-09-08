import { Download } from 'lucide-react';
import { CopyButton } from './CopyButton';
import { Button } from '@/components/ui/button';
import { SectionCard } from './SectionCard';
import { downloadText } from '@/lib/utils/download';

interface OutputBlockProps {
  title?: string;
  value: string;
  downloadName?: string;
  downloadMime?: string;
  actions?: React.ReactNode;
  emptyHint?: string;
}

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
        <pre className="max-h-[560px] overflow-auto scrollbar-thin whitespace-pre-wrap break-words rounded-b-[calc(var(--radius)+2px)] bg-code-bg border-t border-border/60 p-4 font-mono text-[13px] leading-relaxed">
          {value}
        </pre>
      ) : (
        <p className="p-4 text-sm text-muted-foreground">{emptyHint}</p>
      )}
    </SectionCard>
  );
}
