import { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, GitBranch, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/common/PageLayout';
import { SectionCard } from '@/components/common/SectionCard';
import { OutputBlock } from '@/components/common/OutputBlock';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { RequireProject } from '@/components/common/RequireProject';
import { FormatToggle } from '@/components/common/FormatToggle';
import { Callout } from '@/components/common/Callout';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toKeyValueCsv } from '@/lib/utils/csv';
import { safeFilename } from '@/lib/utils/download';
import { exportKeyValueXlsx } from '@/lib/utils/xlsx';
import { getReleaseDefinition } from '@/lib/api/releaseDefinitions';
import { useReleaseDefinitions } from '@/lib/hooks/useReleaseDefinitions';
import { useSessionStore } from '@/store/sessionStore';
import type { ReleaseDefinition } from '@/types/ado';

type Format = 'csv' | 'json' | 'txt' | 'xlsx';

const FORMATS: { id: Format; label: string; mime: string; ext: string }[] = [
  { id: 'csv', label: 'CSV', mime: 'text/csv', ext: 'csv' },
  { id: 'json', label: 'JSON', mime: 'application/json', ext: 'json' },
  { id: 'txt', label: 'TXT', mime: 'text/plain', ext: 'txt' },
  {
    id: 'xlsx',
    label: 'XLSX',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ext: 'xlsx',
  },
];

const SECRET_PLACEHOLDER = '';
const DEFINITION_SCOPE = '__definition__';

interface KV {
  key: string;
  value: string;
  isSecret: boolean;
}

function extractVars(def: ReleaseDefinition, scopeId: string): KV[] {
  const source =
    scopeId === DEFINITION_SCOPE
      ? def.variables
      : def.environments.find((e) => String(e.id) === scopeId)?.variables ?? {};

  return Object.entries(source ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      key,
      value: v.isSecret ? SECRET_PLACEHOLDER : (v.value ?? ''),
      isSecret: v.isSecret ?? false,
    }));
}

function buildOutput(vars: KV[], format: Exclude<Format, 'xlsx'>, scopeLabel: string): string {
  if (format === 'csv') return toKeyValueCsv(vars.map((v) => ({ key: v.key, value: v.value })));
  if (format === 'txt') return vars.map((v) => `${v.key}=${v.value}`).join('\n');
  // JSON — ADO-compatible variables object, ready to paste into a new variable group
  const variables: Record<string, { value: string; isSecret?: boolean }> = {};
  for (const v of vars) {
    variables[v.key] = v.isSecret ? { value: '', isSecret: true } : { value: v.value };
  }
  return JSON.stringify({ name: scopeLabel, variables }, null, 2);
}

export function ExportReleaseVars() {
  const organization = useSessionStore((s) => s.organization);
  const project = useSessionStore((s) => s.selectedProject);

  const {
    data: definitions,
    isLoading: defsLoading,
    isError: defsError,
    error: defsErr,
    refetch: defsRefetch,
  } = useReleaseDefinitions();

  const [selectedDefId, setSelectedDefId] = useState<number | null>(null);
  const [scopeId, setScopeId] = useState<string>(DEFINITION_SCOPE);
  const [format, setFormat] = useState<Format>('csv');
  const [xlsxExporting, setXlsxExporting] = useState(false);

  // Fetch full definition when one is selected
  const {
    data: def,
    isLoading: defLoading,
    isFetching: defFetching,
    isError: defError,
    error: defErr,
    refetch: defRefetch,
  } = useQuery({
    queryKey: ['releaseDefinition', organization, project?.id, selectedDefId],
    queryFn: ({ signal }) =>
      getReleaseDefinition(organization!, project!.name, selectedDefId!, signal),
    enabled: !!organization && !!project && selectedDefId !== null,
    staleTime: 5 * 60_000,
  });

  // Reset scope when pipeline changes
  const handleDefChange = (id: number) => {
    setSelectedDefId(id);
    setScopeId(DEFINITION_SCOPE);
  };

  const scopes = useMemo(() => {
    if (!def) return [];
    const varCount = (vars: Record<string, unknown> | undefined) =>
      Object.keys(vars ?? {}).length;
    return [
      {
        id: DEFINITION_SCOPE,
        label: 'Definition-level (all stages)',
        count: varCount(def.variables),
      },
      ...def.environments.map((e) => ({
        id: String(e.id),
        label: `Stage: ${e.name}`,
        count: varCount(e.variables),
      })),
    ];
  }, [def]);

  const vars = useMemo(() => (def ? extractVars(def, scopeId) : []), [def, scopeId]);
  const hasSecrets = vars.some((v) => v.isSecret);

  const selectedDef = definitions?.find((d) => d.id === selectedDefId);
  const scopeLabel = scopes.find((s) => s.id === scopeId)?.label ?? '';
  const active = FORMATS.find((f) => f.id === format)!;

  const exportFilename = selectedDef
    ? safeFilename(
        organization
          ? `${organization}-${selectedDef.name}-${scopeLabel}`
          : `${selectedDef.name}-${scopeLabel}`,
      )
    : '';

  const output = useMemo(
    () => (def && format !== 'xlsx' ? buildOutput(vars, format, scopeLabel) : ''),
    [def, vars, format, scopeLabel],
  );

  const handleXlsxDownload = async () => {
    if (!def) return;
    setXlsxExporting(true);
    try {
      await exportKeyValueXlsx(
        `${exportFilename}.xlsx`,
        scopeLabel,
        vars.map((v) => ({ key: v.key, value: v.value })),
        { titleRow: false },
      );
    } catch (err) {
      toast.error('XLSX export failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setXlsxExporting(false);
    }
  };

  return (
    <RequireProject>
      <PageLayout
        title="Export Release Pipeline Variables"
        description="Export inline variables from a release pipeline to CSV, JSON, TXT, or XLSX for easy migration to a variable group."
        icon={GitBranch}
      >
        {/* Pipeline picker */}
        <SectionCard
          title="Source"
          actions={<FormatToggle formats={FORMATS} value={format} onChange={setFormat} />}
        >
          <div className="space-y-3">
            {defsLoading && <Skeleton className="h-9 w-full" />}
            {defsError && <ErrorBanner error={defsErr} onRetry={() => defsRefetch()} />}
            {!defsLoading && !defsError && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  Release Pipeline
                </label>
                {!definitions || definitions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No release pipelines found in this project.
                  </p>
                ) : (
                  <Select
                    value={selectedDefId !== null ? String(selectedDefId) : undefined}
                    onValueChange={(v) => handleDefChange(Number(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a release pipeline…" />
                    </SelectTrigger>
                    <SelectContent>
                      {definitions.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Scope picker — shown after a pipeline is selected */}
            {defLoading && <Skeleton className="h-9 w-full" />}
            {defError && <ErrorBanner error={defErr} onRetry={() => defRefetch()} />}
            {def && scopes.length > 0 && (
              <div className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Scope</label>
                  <Select value={scopeId} onValueChange={setScopeId}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scopes.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="flex w-full items-center justify-between gap-4">
                            <span>{s.label}</span>
                            <span className="tabular-nums text-muted-foreground">
                              {s.count} var{s.count === 1 ? '' : 's'}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => defRefetch()}
                      disabled={defFetching}
                    >
                      <RefreshCw className={defFetching ? 'animate-spin' : ''} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh pipeline definition</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Results */}
        {def && (
          <>
            {hasSecrets && (
              <Callout variant="warning">
                Secret variables cannot be read from Azure DevOps; their values are exported empty.
              </Callout>
            )}

            {vars.length === 0 ? (
              <EmptyState
                icon={GitBranch}
                title="No inline variables"
                description="This scope has no inline variables. Variables may come entirely from attached variable groups — use Release Pipeline Mapping to see which groups are linked."
              />
            ) : format === 'xlsx' ? (
              <SectionCard
                title="XLSX export"
                actions={<Badge variant="secondary">{vars.length} vars</Badge>}
              >
                <div className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <FileSpreadsheet className="h-5 w-5" />
                    <span>
                      <span className="font-medium text-foreground">{exportFilename}.xlsx</span>{' '}
                      — {vars.length} variable{vars.length === 1 ? '' : 's'}.
                    </span>
                  </div>
                  <Button size="sm" onClick={handleXlsxDownload} disabled={xlsxExporting}>
                    {xlsxExporting ? <Loader2 className="animate-spin" /> : <Download />}
                    {xlsxExporting ? 'Preparing…' : 'Download'}
                  </Button>
                </div>
              </SectionCard>
            ) : (
              <OutputBlock
                title={`${active.label} export`}
                value={output}
                downloadName={`${exportFilename}.${active.ext}`}
                downloadMime={active.mime}
                actions={<Badge variant="secondary">{vars.length} vars</Badge>}
              />
            )}
          </>
        )}

        {!def && !defLoading && !defError && selectedDefId === null && (
          <EmptyState
            icon={Download}
            title="Select a release pipeline"
            description="Pick a pipeline above to export its inline variables."
          />
        )}
      </PageLayout>
    </RequireProject>
  );
}
