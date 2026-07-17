import { useMemo, useState } from 'react';
import { CopyCheck } from 'lucide-react';
import { PageLayout } from '@/components/common/PageLayout';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { findDuplicateKeys, parseAppSettingsKeys } from '@/lib/utils/appSettings';
import { cn } from '@/lib/utils/cn';

/** Tool 5 — find duplicate keys in pasted App Settings, with line numbers. */
export function DuplicateFinder() {
  const [input, setInput] = useState('');

  const parsed = useMemo(() => parseAppSettingsKeys(input), [input]);
  const duplicates = useMemo(() => findDuplicateKeys(parsed), [parsed]);
  const duplicateLineSet = useMemo(
    () => new Set(duplicates.flatMap((d) => d.lines)),
    [duplicates],
  );

  const lines = useMemo(() => input.split(/\r?\n/), [input]);

  return (
    <PageLayout
      title="Duplicate Finder"
      description="Paste App Settings to find keys that appear more than once."
      icon={CopyCheck}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Input">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'-JWT_SECRET "$(JWT_SECRET)"\n-NODE_ENV "$(NODE_ENV)"\n-JWT_SECRET "$(JWT_SECRET)"'}
            className="min-h-[360px]"
            autoFocus
          />
        </SectionCard>

        <SectionCard
          title="Duplicate Keys"
          actions={
            <Badge variant={duplicates.length > 0 ? 'destructive' : 'success'}>
              {duplicates.length} duplicate{duplicates.length === 1 ? '' : 's'}
            </Badge>
          }
        >
          {input.trim().length === 0 ? (
            <EmptyState
              icon={CopyCheck}
              title="Nothing to analyze"
              description="Paste App Settings on the left."
            />
          ) : duplicates.length === 0 ? (
            <EmptyState
              icon={CopyCheck}
              title="No duplicates found"
              description="Every key appears at most once."
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {duplicates.map((d) => (
                <li
                  key={d.key}
                  className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2"
                >
                  <code className="font-mono text-sm font-medium text-destructive">{d.key}</code>
                  <span className="text-xs text-muted-foreground">
                    lines {d.lines.join(', ')} ({d.lines.length}×)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {input.trim().length > 0 && (
        <SectionCard title="Source (duplicates highlighted)" contentClassName="p-0">
          <div className="max-h-[360px] overflow-auto scrollbar-thin rounded-b-lg font-mono text-sm">
            {lines.map((line, idx) => {
              const lineNo = idx + 1;
              const isDup = duplicateLineSet.has(lineNo);
              return (
                <div
                  key={lineNo}
                  className={cn(
                    'flex gap-3 px-4 py-0.5',
                    isDup && 'bg-destructive/10',
                  )}
                >
                  <span className="w-10 flex-shrink-0 select-none text-right text-muted-foreground">
                    {lineNo}
                  </span>
                  <span className={cn('whitespace-pre-wrap break-all', isDup && 'text-destructive')}>
                    {line || ' '}
                  </span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </PageLayout>
  );
}
