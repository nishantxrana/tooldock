import { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/common/PageLayout';
import { SectionCard } from '@/components/common/SectionCard';
import { OutputBlock } from '@/components/common/OutputBlock';
import { EmptyState } from '@/components/common/EmptyState';
import { VariableGroupPicker } from '@/components/common/VariableGroupPicker';
import { RequireProject } from '@/components/common/RequireProject';
import { FormatToggle } from '@/components/common/FormatToggle';
import { Callout } from '@/components/common/Callout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toKeyValueCsv } from '@/lib/utils/csv';
import { safeFilename } from '@/lib/utils/download';
import { exportKeyValueXlsx } from '@/lib/utils/xlsx';
import { variableCount, variableEntries } from '@/lib/utils/variables';
import { useSessionStore } from '@/store/sessionStore';
import { toast } from 'sonner';
import type { VariableGroup } from '@/types/ado';

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

/** Secret values cannot be read back from ADO; represented as a placeholder. */
const SECRET_PLACEHOLDER = '';

/** Text formats only — xlsx is binary and built separately. */
function buildOutput(group: VariableGroup, format: Exclude<Format, 'xlsx'>): string {
  const entries = variableEntries(group);
  if (format === 'csv') {
    return toKeyValueCsv(
      entries.map((e) => ({ key: e.key, value: e.value ?? SECRET_PLACEHOLDER })),
    );
  }
  if (format === 'txt') {
    return entries.map((e) => `${e.key}=${e.value ?? SECRET_PLACEHOLDER}`).join('\n');
  }
  // JSON — Azure DevOps compatible `variables` structure.
  const variables: Record<string, { value: string; isSecret?: boolean }> = {};
  for (const e of entries) {
    variables[e.key] = e.isSecret
      ? { value: SECRET_PLACEHOLDER, isSecret: true }
      : { value: e.value ?? '' };
  }
  return JSON.stringify({ name: group.name, type: group.type, variables }, null, 2);
}

/** Tool 4 — export a variable group as CSV / JSON / TXT / XLSX. */
export function ExportGroup() {
  const organization = useSessionStore((s) => s.organization);
  const [group, setGroup] = useState<VariableGroup | null>(null);
  const [format, setFormat] = useState<Format>('csv');
  const [xlsxExporting, setXlsxExporting] = useState(false);

  const output = useMemo(
    () => (group && format !== 'xlsx' ? buildOutput(group, format) : ''),
    [group, format],
  );
  const active = FORMATS.find((f) => f.id === format)!;
  const hasSecrets = useMemo(
    () => (group ? variableEntries(group).some((e) => e.isSecret) : false),
    [group],
  );

  const exportFilename = group
    ? safeFilename(organization ? `${organization}-${group.name}` : group.name)
    : '';

  const handleXlsxDownload = async () => {
    if (!group) return;
    setXlsxExporting(true);
    try {
      const entries = variableEntries(group);
      await exportKeyValueXlsx(
        `${exportFilename}.xlsx`,
        group.name,
        entries.map((e) => ({ key: e.key, value: e.value ?? SECRET_PLACEHOLDER })),
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
        title="Export Variable Group"
        description="Export a variable group as CSV, JSON, TXT, or XLSX."
        icon={Download}
      >
        <SectionCard
          title="Source"
          actions={<FormatToggle formats={FORMATS} value={format} onChange={setFormat} />}
        >
          <VariableGroupPicker value={group?.id ?? null} onChange={(_, g) => setGroup(g)} />
        </SectionCard>

        {group ? (
          <>
            {hasSecrets && (
              <Callout variant="warning">
                Secret variables cannot be read from Azure DevOps; their values are exported empty.
              </Callout>
            )}
            {format === 'xlsx' ? (
              <SectionCard
                title="XLSX export"
                actions={<Badge variant="secondary">{variableCount(group)} vars</Badge>}
              >
                <div className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <FileSpreadsheet className="h-5 w-5" />
                    <span>
                      <span className="font-medium text-foreground">{exportFilename}.xlsx</span> —
                      sheet "{group.name}", {variableCount(group)} variables.
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
                actions={<Badge variant="secondary">{variableCount(group)} vars</Badge>}
              />
            )}
          </>
        ) : (
          <EmptyState
            icon={Download}
            title="Select a variable group"
            description="Pick a group above to export it."
          />
        )}
      </PageLayout>
    </RequireProject>
  );
}
