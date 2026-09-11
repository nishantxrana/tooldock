import { useMemo, useState } from 'react';
import { CopyCheck } from 'lucide-react';
import { PageLayout } from '@/components/common/PageLayout';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { CopyButton } from '@/components/common/CopyButton';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  findDuplicateKeys,
  formatAppSettings,
  parseAppSettingsKeys,
} from '@/lib/utils/appSettings';
import { cn } from '@/lib/utils/cn';

/** Tool 5 - find duplicate keys in pasted App Settings (one-line or multiline). */
export function DuplicateFinder() {
  const [input, setInput] = useState('');

  const parsed = useMemo(() => parseAppSettingsKeys(input), [input]);
  const duplicates = useMemo(() => findDuplicateKeys(parsed), [parsed]);
  const duplicateKeySet = useMemo(() => new Set(duplicates.map((d) => d.key)), [duplicates]);

  // Unique keys in first-seen order (deduplication result)
  const dedupedKeys = useMemo(() => {
    const seen = new Set<string>();
    const keys: string[] = [];
    for (const { key } of parsed) {
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    }
    return keys;
  }, [parsed]);

  const totalKeys = parsed.length;
  const uniqueKeys = dedupedKeys.length;

  return (
    <PageLayout
      title="Duplicate Finder"
      description="Paste App Settings (one-line or multiline) to find keys that appear more than once."
      icon={CopyCheck}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Input"
          actions={
            input.trim() && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="tabular-nums font-medium text-foreground">{totalKeys}</span> total
                <span className="mx-1 text-border">·</span>
                <span className="tabular-nums font-medium text-foreground">{uniqueKeys}</span>{' '}
                unique
                {duplicates.length > 0 && (
                  <>
                    <span className="mx-1 text-border">·</span>
                    <span className="tabular-nums font-medium text-destructive">
                      {duplicates.length}
                    </span>{' '}
                    duplicated
                  </>
                )}
              </div>
            )
          }
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              '-JWT_SECRET "$(JWT_SECRET)" -NODE_ENV "$(NODE_ENV)" -JWT_SECRET "$(JWT_SECRET)"'
            }
            className="min-h-[360px]"
            autoFocus
          />
        </SectionCard>

        <SectionCard
          title="Duplicated Keys"
          actions={
            <div className="flex items-center gap-2">
              {duplicates.length > 0 && (
                <CopyButton
                  value={() => formatAppSettings(dedupedKeys, 'oneline')}
                  label="Copy deduplicated"
                  size="sm"
                />
              )}
              <Badge variant={duplicates.length > 0 ? 'destructive' : 'success'}>
                {duplicates.length} duplicate{duplicates.length === 1 ? '' : 's'}
              </Badge>
            </div>
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
              description="Every key appears exactly once."
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {duplicates.map((d) => (
                <li
                  key={d.key}
                  className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2"
                >
                  <code className="font-mono text-sm font-medium text-destructive">{d.key}</code>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {d.lines.length}× repeated
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Tokenized source view - one token per row, works for both one-liner and multiline */}
      {parsed.length > 0 && (
        <SectionCard title="All tokens (duplicates highlighted)" contentClassName="p-0">
          <div className="max-h-[360px] overflow-auto scrollbar-thin rounded-b-lg font-mono text-sm">
            {parsed.map((token, idx) => {
              const isDup = duplicateKeySet.has(token.key);
              return (
                <div
                  key={idx}
                  className={cn('flex gap-3 px-4 py-0.5', isDup && 'bg-destructive/10')}
                >
                  <span className="w-8 flex-shrink-0 select-none text-right tabular-nums text-muted-foreground">
                    {idx + 1}
                  </span>
                  <span className={cn(isDup ? 'text-destructive' : 'text-foreground')}>
                    {token.key}
                  </span>
                  {isDup && (
                    <span className="ml-auto text-xs text-destructive/60 select-none">
                      duplicate
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </PageLayout>
  );
}
