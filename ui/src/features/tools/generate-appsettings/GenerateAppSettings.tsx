import { useMemo, useState } from 'react';
import { Terminal, X } from 'lucide-react';
import { PageLayout } from '@/components/common/PageLayout';
import { SectionCard } from '@/components/common/SectionCard';
import { OutputBlock } from '@/components/common/OutputBlock';
import { EmptyState } from '@/components/common/EmptyState';
import { Callout } from '@/components/common/Callout';
import { RequireProject } from '@/components/common/RequireProject';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { Combobox } from '@/components/ui/combobox';
import { formatAppSettings, mergeGroups, type AppSettingsFormat } from '@/lib/utils/appSettings';
import { safeFilename } from '@/lib/utils/download';
import { variableCount, variableNames } from '@/lib/utils/variables';
import { useVariableGroups } from '@/lib/hooks/useVariableGroups';
import type { VariableGroup } from '@/types/ado';

/**
 * Tool 1 — generate the App Service Deploy "App settings" string from one or
 * more variable groups. Keys are merged and deduplicated; duplicates are
 * surfaced as a warning with the source group listed for each conflict.
 */
export function GenerateAppSettings() {
  const [groups, setGroups] = useState<VariableGroup[]>([]);
  const [oneLine, setOneLine] = useState(true);
  const [selectKey, setSelectKey] = useState(0);

  const { data: allGroups, isLoading, isError, error, refetch } = useVariableGroups();

  // Groups not yet added — available for selection
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

  const format: AppSettingsFormat = oneLine ? 'oneline' : 'multiline';
  const output = useMemo(() => formatAppSettings(merged.keys, format), [merged.keys, format]);

  const downloadName = useMemo(() => {
    if (groups.length === 0) return 'appsettings.txt';
    if (groups.length === 1) return `${safeFilename(groups[0]?.name ?? '')}-appsettings.txt`;
    return 'combined-appsettings.txt';
  }, [groups]);

  const totalVars = useMemo(() => groups.reduce((sum, g) => sum + variableCount(g), 0), [groups]);

  return (
    <RequireProject>
      <PageLayout
        title="Generate App Service Settings"
        description='Turn one or more variable groups into the -KEY "$(KEY)" string for the App Service Deploy task.'
        icon={Terminal}
      >
        {/* Source card */}
        <SectionCard title="Source variable groups">
          {isLoading && <Skeleton className="h-9 w-full" />}
          {isError && <ErrorBanner error={error} onRetry={() => refetch()} />}

          {!isLoading && !isError && (
            <div className="space-y-2">
              {/* Added groups list */}
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

              {/* Add picker — hidden when all groups added */}
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
                    groups.length === 0 ? 'Select a variable group…' : 'Add another variable group…'
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

        {/* Duplicate warning */}
        {merged.duplicates.length > 0 && (
          <Callout variant="warning">
            <div className="space-y-1.5">
              <p className="font-medium">
                {merged.duplicates.length} key{merged.duplicates.length === 1 ? '' : 's'} appear in
                multiple groups — the first group's key is used.
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

        {/* Output */}
        {groups.length > 0 ? (
          <OutputBlock
            title={
              groups.length === 1
                ? 'App settings'
                : `App settings — ${groups.length} groups, ${merged.keys.length} unique keys`
            }
            value={output}
            downloadName={downloadName}
            actions={
              <>
                <Badge variant="secondary">
                  {groups.length > 1
                    ? `${merged.keys.length} / ${totalVars} vars`
                    : `${merged.keys.length} vars`}
                </Badge>
                <label className="flex items-center gap-2 pr-1 text-sm">
                  <Switch checked={oneLine} onCheckedChange={setOneLine} id="oneline" />
                  <Label htmlFor="oneline" className="cursor-pointer text-muted-foreground">
                    One line
                  </Label>
                </label>
              </>
            }
            emptyHint="The selected group(s) have no variables."
          />
        ) : (
          <EmptyState
            icon={Terminal}
            title="Select a variable group"
            description="Pick one or more groups above to generate their App Service settings string."
          />
        )}
      </PageLayout>
    </RequireProject>
  );
}
