import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, GitCompareArrows, X } from 'lucide-react';
import { PageLayout } from '@/components/common/PageLayout';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { SearchBox } from '@/components/common/SearchBox';
import { CopyButton } from '@/components/common/CopyButton';
import { Callout } from '@/components/common/Callout';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { RequireProject } from '@/components/common/RequireProject';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Combobox } from '@/components/ui/combobox';
import { compareKeys } from '@/lib/utils/diff';
import { formatAppSettings, mergeGroups, parseAppSettingsKeys } from '@/lib/utils/appSettings';
import { variableCount, variableNames } from '@/lib/utils/variables';
import { useVariableGroups } from '@/lib/hooks/useVariableGroups';
import { downloadText, safeFilename } from '@/lib/utils/download';
import { cn } from '@/lib/utils/cn';
import type { VariableGroup } from '@/types/ado';

interface CategoryProps {
  title: string;
  keys: string[];
  variant: BadgeProps['variant'];
  filter: string;
  emptyLabel: string;
  extraAction?: React.ReactNode;
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

/** Tool 2 — compare one or more variable groups' keys with pasted App Settings. */
export function CompareAppSettings() {
  const [groups, setGroups] = useState<VariableGroup[]>([]);
  const [pasted, setPasted] = useState('');
  const [filter, setFilter] = useState('');
  const [selectKey, setSelectKey] = useState(0);

  const { data: allGroups, isLoading, isError, error, refetch } = useVariableGroups();

  const addedIds = useMemo(() => new Set(groups.map((g) => g.id)), [groups]);
  const available = useMemo(
    () => (allGroups ?? []).filter((g) => !addedIds.has(g.id)),
    [allGroups, addedIds],
  );

  const addGroup = (id: number) => {
    const g = allGroups?.find((g) => g.id === id);
    if (g) {
      setGroups((prev) => [...prev, g]);
      setSelectKey((k) => k + 1);
    }
  };
  const removeGroup = (id: number) => setGroups((prev) => prev.filter((g) => g.id !== id));

  const merged = useMemo(
    () => mergeGroups(groups.map((g) => ({ name: g.name, keys: variableNames(g) }))),
    [groups],
  );

  const appKeys = useMemo(() => parseAppSettingsKeys(pasted).map((p) => p.key), [pasted]);
  const result = useMemo(() => compareKeys(merged.keys, appKeys), [merged.keys, appKeys]);

  const canCompare = groups.length > 0 && pasted.trim().length > 0;

  const groupLabel =
    groups.length === 1
      ? (groups[0]?.name ?? '')
      : groups.length > 1
        ? `${groups.length} groups`
        : '';

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
      `# ToolDock — Variable Group(s) vs App Settings`,
      `Groups  : ${groups.map((g) => g.name).join(', ')}`,
      `Date    : ${now}`,
      `Status  : ${isHealthy ? 'PASS' : 'FAIL'} — ${status}`,
      '',
      `Matched            : ${result.counts.matched}`,
      `Missing from App   : ${result.counts.missingFromAppSettings}`,
      `Extra in App       : ${result.counts.extraInAppSettings}`,
      `Duplicates in App  : ${result.counts.duplicatesInAppSettings}`,
      ...(merged.duplicates.length > 0
        ? [
            '',
            `Duplicate keys across groups (${merged.duplicates.length}):`,
            ...merged.duplicates.map((d) => `  ${d.key} → ${d.groups.join(', ')}`),
          ]
        : []),
      '',
      '─'.repeat(60),
      '',
      `## Missing from App Settings (${result.counts.missingFromAppSettings})`,
      result.counts.missingFromAppSettings === 0
        ? 'None'
        : [
            'Keys in the variable group(s) absent from App Settings.',
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
            'Keys present in App Settings but not in the variable group(s).',
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

    downloadText(`${safeFilename(groupLabel || 'compare')}-comparison.txt`, lines.join('\n'));
  };

  const exportCsv = () => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

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
        note: 'Present in App Settings but not in variable group(s)',
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
      `# Groups: ${groups.map((g) => g.name).join(', ')} | Date: ${now} | Status: ${isHealthy ? 'PASS' : 'FAIL'}`,
      ['Key', 'Status', 'Action / Note'].map(escape).join(','),
      ...rows.map((r) => [r.key, r.status, r.note].map(escape).join(',')),
    ];

    downloadText(
      `${safeFilename(groupLabel || 'compare')}-comparison.csv`,
      csvLines.join('\n'),
      'text/csv',
    );
  };

  return (
    <RequireProject>
      <PageLayout
        title="Compare Variable Group vs App Settings"
        description="Detect keys that are matched, missing, extra, or duplicated. Supports multiple variable groups."
        icon={GitCompareArrows}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Multi-group picker */}
          <SectionCard title="Variable Groups">
            {isLoading && <Skeleton className="h-9 w-full" />}
            {isError && <ErrorBanner error={error} onRetry={() => refetch()} />}
            {!isLoading && !isError && (
              <div className="space-y-2">
                {groups.length > 0 && (
                  <ul className="space-y-1.5 pb-1">
                    {groups.map((g, i) => (
                      <li
                        key={g.id}
                        className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs tabular-nums text-muted-foreground w-4 shrink-0">
                            {i + 1}.
                          </span>
                          <span className="truncate font-medium text-sm">{g.name}</span>
                          <Badge variant="secondary" className="shrink-0">
                            {variableCount(g)} vars
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeGroup(g.id)}
                          aria-label={`Remove ${g.name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}

                {available.length > 0 ? (
                  <Combobox
                    key={selectKey}
                    options={available.map((g) => ({
                      value: String(g.id),
                      label: g.name,
                      description: `${variableCount(g)} vars`,
                    }))}
                    onChange={(v) => addGroup(Number(v))}
                    placeholder={
                      groups.length === 0
                        ? 'Select a variable group…'
                        : 'Add another variable group…'
                    }
                    searchPlaceholder="Search groups…"
                  />
                ) : (
                  groups.length > 0 && (
                    <p className="text-xs text-muted-foreground">All variable groups added.</p>
                  )
                )}
              </div>
            )}
          </SectionCard>

          {/* App settings paste area */}
          <SectionCard title="App Settings (pasted from Release Pipeline)">
            <Textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder={'-NODE_ENV "$(NODE_ENV)"\nJWT_SECRET=...\n…'}
              className="min-h-[140px]"
            />
          </SectionCard>
        </div>

        {/* Cross-group duplicate warning */}
        {merged.duplicates.length > 0 && (
          <Callout variant="warning">
            <div className="space-y-1.5">
              <p className="font-medium">
                {merged.duplicates.length} key{merged.duplicates.length === 1 ? '' : 's'} appear in
                multiple groups — the first group's key is used for comparison.
              </p>
              <ul className="space-y-0.5 font-mono text-xs">
                {merged.duplicates.map(({ key, groups: gs }) => (
                  <li key={key}>
                    <span className="font-medium">{key}</span>
                    <span className="text-warning/70"> → </span>
                    {gs.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          </Callout>
        )}

        {canCompare ? (
          <>
            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-4 py-2.5 text-sm">
              <span
                className={cn('font-semibold', isHealthy ? 'text-success' : 'text-destructive')}
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
                <span className="tabular-nums font-medium">{result.counts.extraInAppSettings}</span>
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
              {groups.length > 1 && (
                <>
                  <span className="h-4 w-px bg-border" />
                  <span className="text-muted-foreground">
                    {merged.keys.length} unique keys across {groups.length} groups
                  </span>
                </>
              )}
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
              <Category
                title="Matched"
                keys={result.matched}
                variant="success"
                filter={filter}
                emptyLabel="No matching keys."
                defaultCollapsed={result.counts.matched > 0}
              />
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
            description="Select one or more variable groups and paste App Settings to see the differences."
          />
        )}
      </PageLayout>
    </RequireProject>
  );
}
