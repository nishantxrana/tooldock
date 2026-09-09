import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, GitCompareArrows } from 'lucide-react';
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
import { formatAppSettings, parseAppSettingsKeys } from '@/lib/utils/appSettings';
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
  /** Extra action shown in the card header alongside the default copy button. */
  extraAction?: React.ReactNode;
  /** Start collapsed — useful for large matched lists. */
  defaultCollapsed?: boolean;
}

function Category({
  title,
  keys,
  variant,
  filter,
  emptyLabel,
  extraAction,
  defaultCollapsed = false,
}: CategoryProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const filtered = useMemo(
    () => keys.filter((k) => k.toLowerCase().includes(filter.toLowerCase())),
    [keys, filter],
  );

  return (
    <SectionCard
      title={
        <button
          className="flex w-full items-center gap-2 text-left"
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span>{title}</span>
          <Badge variant={variant}>{keys.length}</Badge>
        </button>
      }
      actions={
        keys.length > 0 && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {extraAction}
            <CopyButton value={() => keys.join('\n')} iconOnly />
          </div>
        )
      }
      contentClassName="p-0"
    >
      {!collapsed && (
        <>
          {keys.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
          ) : filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No matches.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-border overflow-auto scrollbar-thin">
              {filtered.map((k) => (
                <li key={k} className="px-4 py-1.5 font-mono text-sm">
                  {k}
                </li>
              ))}
            </ul>
          )}
        </>
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

  const isHealthy =
    result.counts.missingFromAppSettings === 0 &&
    result.counts.extraInAppSettings === 0 &&
    result.counts.duplicatesInAppSettings === 0;

  const exportReport = () => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    const status = isHealthy
      ? 'PASS — all keys matched'
      : [
          result.counts.missingFromAppSettings > 0 &&
            `${result.counts.missingFromAppSettings} missing`,
          result.counts.extraInAppSettings > 0 && `${result.counts.extraInAppSettings} extra`,
          result.counts.duplicatesInAppSettings > 0 &&
            `${result.counts.duplicatesInAppSettings} duplicate`,
        ]
          .filter(Boolean)
          .join(', ');

    const missingAsAppSettings =
      result.missingFromAppSettings.length > 0
        ? formatAppSettings(result.missingFromAppSettings, 'multiline')
        : null;

    const lines = [
      `# ToolDock — Variable Group vs App Settings`,
      `Group   : ${group?.name}`,
      `Date    : ${now}`,
      `Status  : ${isHealthy ? 'PASS' : 'FAIL'} — ${status}`,
      '',
      `Matched            : ${result.counts.matched}`,
      `Missing from App   : ${result.counts.missingFromAppSettings}`,
      `Extra in App       : ${result.counts.extraInAppSettings}`,
      `Duplicates in App  : ${result.counts.duplicatesInAppSettings}`,
      '',
      '─'.repeat(60),
      '',
      `## Missing from App Settings (${result.counts.missingFromAppSettings})`,
      result.counts.missingFromAppSettings === 0
        ? 'None'
        : [
            'Keys in the variable group that are absent from App Settings.',
            'Add the lines below to the App Service Deploy task:',
            '',
            missingAsAppSettings ?? '',
          ].join('\n'),
      '',
      '─'.repeat(60),
      '',
      `## Extra in App Settings (${result.counts.extraInAppSettings})`,
      result.counts.extraInAppSettings === 0
        ? 'None'
        : [
            'Keys present in App Settings but not in the variable group.',
            'Consider removing these unless they are set elsewhere:',
            '',
            ...result.extraInAppSettings,
          ].join('\n'),
      '',
      '─'.repeat(60),
      '',
      `## Duplicates in App Settings (${result.counts.duplicatesInAppSettings})`,
      result.counts.duplicatesInAppSettings === 0
        ? 'None'
        : result.duplicatesInAppSettings.join('\n'),
      '',
      '─'.repeat(60),
      '',
      `## Matched (${result.counts.matched})`,
      result.counts.matched === 0 ? 'None' : result.matched.join('\n'),
    ];

    downloadText(`${safeFilename(group?.name ?? 'compare')}-comparison.txt`, lines.join('\n'));
  };

  const exportCsv = () => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

    // Status priority order: actionable issues first, matched last.
    type Row = { key: string; status: string; note: string };
    const rows: Row[] = [
      ...result.missingFromAppSettings.map((k) => ({
        key: k,
        status: 'Missing from App Settings',
        note: `-${k} "$(${k})"`,
      })),
      ...result.extraInAppSettings.map((k) => ({
        key: k,
        status: 'Extra in App Settings',
        note: 'Present in App Settings but not in variable group',
      })),
      ...result.duplicatesInAppSettings.map((k) => ({
        key: k,
        status: 'Duplicate in App Settings',
        note: 'Key appears more than once in App Settings',
      })),
      ...result.matched.map((k) => ({
        key: k,
        status: 'Matched',
        note: '',
      })),
    ];

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csvLines = [
      `# Group: ${group?.name} | Date: ${now} | Status: ${isHealthy ? 'PASS' : 'FAIL'}`,
      ['Key', 'Status', 'Action / Note'].map(escape).join(','),
      ...rows.map((r) => [r.key, r.status, r.note].map(escape).join(',')),
    ];

    downloadText(
      `${safeFilename(group?.name ?? 'compare')}-comparison.csv`,
      csvLines.join('\n'),
      'text/csv',
    );
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
            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-4 py-2.5 text-sm">
              <span
                className={cn(
                  'font-semibold',
                  isHealthy ? 'text-success' : 'text-destructive',
                )}
              >
                {isHealthy ? 'All matched' : 'Issues found'}
              </span>
              <span className="h-4 w-px bg-border" />
              <span>
                <span className="tabular-nums font-medium">{result.counts.matched}</span>
                <span className="ml-1 text-muted-foreground">matched</span>
              </span>
              <span>
                <span
                  className={cn(
                    'tabular-nums font-medium',
                    result.counts.missingFromAppSettings > 0 && 'text-warning',
                  )}
                >
                  {result.counts.missingFromAppSettings}
                </span>
                <span className="ml-1 text-muted-foreground">missing</span>
              </span>
              <span>
                <span
                  className={cn(
                    'tabular-nums font-medium',
                    result.counts.extraInAppSettings > 0 && 'text-foreground',
                  )}
                >
                  {result.counts.extraInAppSettings}
                </span>
                <span className="ml-1 text-muted-foreground">extra</span>
              </span>
              <span>
                <span
                  className={cn(
                    'tabular-nums font-medium',
                    result.counts.duplicatesInAppSettings > 0 && 'text-destructive',
                  )}
                >
                  {result.counts.duplicatesInAppSettings}
                </span>
                <span className="ml-1 text-muted-foreground">duplicates</span>
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SearchBox
                value={filter}
                onChange={setFilter}
                placeholder="Filter keys…"
                className="w-full sm:max-w-xs"
              />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={exportReport}>
                  Export TXT
                </Button>
                <Button variant="outline" size="sm" onClick={exportCsv}>
                  Export CSV
                </Button>
              </div>
            </div>

            <div className={cn('grid gap-6 md:grid-cols-2 xl:grid-cols-4')}>
              {/* Matched — collapsed by default since it's rarely the focus */}
              <Category
                title="Matched"
                keys={result.matched}
                variant="success"
                filter={filter}
                emptyLabel="No matching keys."
                defaultCollapsed={result.counts.matched > 0}
              />
              {/* Missing — copy as app settings format for direct paste into release task */}
              <Category
                title="Missing from App Settings"
                keys={result.missingFromAppSettings}
                variant="warning"
                filter={filter}
                emptyLabel="Nothing missing."
                extraAction={
                  result.missingFromAppSettings.length > 0 && (
                    <CopyButton
                      value={() => formatAppSettings(result.missingFromAppSettings, 'multiline')}
                      label="Copy as app settings"
                      size="sm"
                      title="Copy as -KEY &quot;$(KEY)&quot; format"
                    />
                  )
                }
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
