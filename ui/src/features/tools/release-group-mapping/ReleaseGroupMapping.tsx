import { useState } from 'react';
import { Download, GitBranch, Loader2, RefreshCw } from 'lucide-react';
import { Callout } from '@/components/common/Callout';
import { PageLayout } from '@/components/common/PageLayout';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { RequireProject } from '@/components/common/RequireProject';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { safeFilename } from '@/lib/utils/download';
import { exportReleaseMappingXlsx, type ReleaseMappingRow } from '@/lib/utils/xlsx';
import { useReleaseMapping } from '@/lib/hooks/useReleaseMapping';
import { useSessionStore } from '@/store/sessionStore';

export function ReleaseGroupMapping() {
  const organization = useSessionStore((s) => s.organization);
  const project = useSessionStore((s) => s.selectedProject);
  const { data, isLoading, isError, error, refetch, isFetching } = useReleaseMapping();

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const variableGroups = data?.variableGroups ?? [];
  const mapping = data?.mapping ?? new Map();
  const progress = data?.progress;

  const selectedUsages = selectedGroupId !== null ? (mapping.get(selectedGroupId) ?? []) : null;
  const selectedGroupName = variableGroups.find((g) => g.id === selectedGroupId)?.name ?? '';

  const handleExport = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const rows: ReleaseMappingRow[] = [];
      const sortedGroups = [...variableGroups].sort((a, b) => a.name.localeCompare(b.name));

      for (const vg of sortedGroups) {
        const usages = mapping.get(vg.id) ?? [];
        if (usages.length === 0) {
          rows.push({ groupName: vg.name, pipelineName: '—', stageName: '—', scope: 'Not used' });
        } else {
          const sorted = [...usages].sort((a, b) =>
            a.pipelineName.localeCompare(b.pipelineName),
          );
          for (const u of sorted) {
            rows.push({
              groupName: vg.name,
              pipelineName: u.pipelineName,
              stageName: u.stageName ?? '(all stages)',
              scope: u.scope,
            });
          }
        }
      }

      const orgPart = safeFilename(organization ?? '');
      const projectPart = safeFilename(project?.name ?? '');
      const filename = `${orgPart}-${projectPart}-release-pipeline-mapping.xlsx`;
      const title = `Release Pipeline Mapping — ${organization} / ${project?.name}`;
      await exportReleaseMappingXlsx(filename, title, rows);
    } finally {
      setExporting(false);
    }
  };

  return (
    <RequireProject>
      <PageLayout
        title="Release Pipeline Mapping"
        description="See which release pipelines (and stages) use each variable group. Export the full mapping to XLSX."
        icon={GitBranch}
      >
        {/* PAT scope notice */}
        <Callout variant="info">
          This tool requires a PAT with <strong>Release (read)</strong> scope in addition to
          Variable Groups (read). If you see a 403 error, regenerate your PAT and add the Release
          scope.
        </Callout>

        {isLoading && (
          <SectionCard title="Loading release pipelines…">
            <div className="space-y-2 p-1">
              {progress && progress.total > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Fetching pipelines… {progress.done} / {progress.total}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Fetching pipeline list…</p>
              )}
              <Skeleton className="h-2 w-full" />
            </div>
          </SectionCard>
        )}

        {isError && <ErrorBanner error={error} onRetry={() => refetch()} />}

        {!isLoading && !isError && data && (
          <>
            {variableGroups.length === 0 ? (
              <EmptyState
                icon={GitBranch}
                title="No variable groups"
                description="This project has no variable groups, or your PAT lacks read access."
              />
            ) : (
              <>
                {/* Group picker */}
                <SectionCard title="Find by variable group">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-muted-foreground">
                      Variable Group
                    </label>
                    <Select
                      value={selectedGroupId !== null ? String(selectedGroupId) : undefined}
                      onValueChange={(v) => setSelectedGroupId(Number(v))}
                    >
                      <SelectTrigger className="w-full max-w-sm">
                        <SelectValue placeholder="Select a variable group…" />
                      </SelectTrigger>
                      <SelectContent>
                        {variableGroups.map((g) => (
                          <SelectItem key={g.id} value={String(g.id)}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </SectionCard>

                {/* Results table */}
                {selectedUsages !== null && (
                  <SectionCard title={`Pipelines using "${selectedGroupName}"`}>
                    {selectedUsages.length === 0 ? (
                      <EmptyState
                        icon={GitBranch}
                        title="Not used in any pipeline"
                        description="This variable group is not attached to any release pipeline in this project."
                      />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                              <th className="px-4 py-2.5">Pipeline Name</th>
                              <th className="px-4 py-2.5">Stage</th>
                              <th className="px-4 py-2.5">Scope</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {[...selectedUsages]
                              .sort((a, b) => a.pipelineName.localeCompare(b.pipelineName))
                              .map((u, i) => (
                                <tr key={i} className="hover:bg-muted/50">
                                  <td className="px-4 py-2.5 font-medium">{u.pipelineName}</td>
                                  <td className="px-4 py-2.5 text-muted-foreground">
                                    {u.stageName ?? (
                                      <em className="not-italic text-muted-foreground">
                                        (all stages)
                                      </em>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span
                                      className={
                                        u.scope === 'Definition-level'
                                          ? 'text-muted-foreground'
                                          : 'text-foreground'
                                      }
                                    >
                                      {u.scope}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </SectionCard>
                )}

                {/* Export + refetch card */}
                <SectionCard title="Export full mapping">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Download className="h-5 w-5 flex-shrink-0" />
                      <span>
                        All variable groups × all release pipelines — one flat sheet, easy to
                        filter in Excel.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        title="Re-fetch pipeline data"
                      >
                        <RefreshCw className={isFetching ? 'animate-spin' : ''} />
                        Refresh
                      </Button>
                      <Button size="sm" onClick={handleExport} disabled={exporting || isFetching}>
                        {exporting ? <Loader2 className="animate-spin" /> : <Download />}
                        {exporting ? 'Preparing…' : 'Export .xlsx'}
                      </Button>
                    </div>
                  </div>
                </SectionCard>
              </>
            )}
          </>
        )}
      </PageLayout>
    </RequireProject>
  );
}
