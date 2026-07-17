import { useMemo, useState } from 'react';
import { GitCompareArrows } from 'lucide-react';
import { PageLayout } from '@/components/common/PageLayout';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { SearchBox } from '@/components/common/SearchBox';
import { CopyButton } from '@/components/common/CopyButton';
import { VariableGroupPicker } from '@/components/common/VariableGroupPicker';
import { RequireProject } from '@/components/common/RequireProject';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { compareKeys } from '@/lib/utils/diff';
import { parseAppSettingsKeys } from '@/lib/utils/appSettings';
import { variableNames } from '@/lib/utils/variables';
import { downloadText, safeFilename } from '@/lib/utils/download';
import { cn } from '@/lib/utils/cn';
import type { VariableGroup } from '@/types/ado';

interface CategoryProps {
  title: string;
  keys: string[];
  variant: BadgeProps['variant'];
  filter: string;
  emptyLabel: string;
}

function Category({ title, keys, variant, filter, emptyLabel }: CategoryProps) {
  const filtered = useMemo(
    () => keys.filter((k) => k.toLowerCase().includes(filter.toLowerCase())),
    [keys, filter],
  );

  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          {title}
          <Badge variant={variant}>{keys.length}</Badge>
        </span>
      }
      actions={keys.length > 0 && <CopyButton value={() => keys.join('\n')} iconOnly />}
      contentClassName="p-0"
    >
      {keys.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
      ) : filtered.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">No matches.</p>
      ) : (
        <ul className="max-h-64 divide-y divide-border overflow-auto scrollbar-thin">
          {filtered.map((k) => (
            <li key={k} className="px-4 py-1.5 font-mono text-sm">
              {k}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/** Tool 2 — compare a variable group's keys with pasted App Settings. */
export function CompareAppSettings() {
  const [group, setGroup] = useState<VariableGroup | null>(null);
  const [pasted, setPasted] = useState('');
  const [filter, setFilter] = useState('');

  const groupKeys = useMemo(() => (group ? variableNames(group) : []), [group]);
  const appKeys = useMemo(() => parseAppSettingsKeys(pasted).map((p) => p.key), [pasted]);
  const result = useMemo(() => compareKeys(groupKeys, appKeys), [groupKeys, appKeys]);

  const canCompare = group && pasted.trim().length > 0;

  const exportReport = () => {
    const lines = [
      `# Comparison: ${group?.name}`,
      '',
      `## Matched (${result.counts.matched})`,
      ...result.matched,
      '',
      `## Missing from App Settings (${result.counts.missingFromAppSettings})`,
      ...result.missingFromAppSettings,
      '',
      `## Extra in App Settings (${result.counts.extraInAppSettings})`,
      ...result.extraInAppSettings,
      '',
      `## Duplicate keys in App Settings (${result.counts.duplicatesInAppSettings})`,
      ...result.duplicatesInAppSettings,
    ];
    downloadText(`${safeFilename(group?.name ?? 'compare')}-comparison.txt`, lines.join('\n'));
  };

  return (
    <RequireProject>
      <PageLayout
        title="Compare Variable Group vs App Settings"
        description="Detect keys that are matched, missing, extra, or duplicated. Order is ignored."
        icon={GitCompareArrows}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Variable Group">
            <VariableGroupPicker value={group?.id ?? null} onChange={(_, g) => setGroup(g)} />
          </SectionCard>
          <SectionCard title="App Settings (pasted from Release Pipeline)">
            <Textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder={'-NODE_ENV "$(NODE_ENV)"\nJWT_SECRET=...\n…'}
              className="min-h-[140px]"
            />
          </SectionCard>
        </div>

        {canCompare ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SearchBox
                value={filter}
                onChange={setFilter}
                placeholder="Filter keys…"
                className="w-full sm:max-w-xs"
              />
              <Button variant="outline" size="sm" onClick={exportReport}>
                Export report
              </Button>
            </div>
            <div className={cn('grid gap-6 md:grid-cols-2 xl:grid-cols-4')}>
              <Category
                title="Matched"
                keys={result.matched}
                variant="success"
                filter={filter}
                emptyLabel="No matching keys."
              />
              <Category
                title="Missing from App Settings"
                keys={result.missingFromAppSettings}
                variant="warning"
                filter={filter}
                emptyLabel="Nothing missing."
              />
              <Category
                title="Extra in App Settings"
                keys={result.extraInAppSettings}
                variant="default"
                filter={filter}
                emptyLabel="No extra keys."
              />
              <Category
                title="Duplicates in App Settings"
                keys={result.duplicatesInAppSettings}
                variant="destructive"
                filter={filter}
                emptyLabel="No duplicates."
              />
            </div>
          </>
        ) : (
          <EmptyState
            icon={GitCompareArrows}
            title="Ready to compare"
            description="Select a variable group and paste App Settings to see the differences."
          />
        )}
      </PageLayout>
    </RequireProject>
  );
}
