import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { PageLayout } from '@/components/common/PageLayout';
import { SectionCard } from '@/components/common/SectionCard';
import { OutputBlock } from '@/components/common/OutputBlock';
import { EmptyState } from '@/components/common/EmptyState';
import { VariableGroupPicker } from '@/components/common/VariableGroupPicker';
import { RequireProject } from '@/components/common/RequireProject';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toKeyValueCsv } from '@/lib/utils/csv';
import { safeFilename } from '@/lib/utils/download';
import { variableCount, variableEntries } from '@/lib/utils/variables';
import { cn } from '@/lib/utils/cn';
import type { VariableGroup } from '@/types/ado';

type Format = 'csv' | 'json' | 'txt';

const FORMATS: { id: Format; label: string; mime: string; ext: string }[] = [
  { id: 'csv', label: 'CSV', mime: 'text/csv', ext: 'csv' },
  { id: 'json', label: 'JSON', mime: 'application/json', ext: 'json' },
  { id: 'txt', label: 'TXT', mime: 'text/plain', ext: 'txt' },
];

/** Secret values cannot be read back from ADO; represented as a placeholder. */
const SECRET_PLACEHOLDER = '';

function buildOutput(group: VariableGroup, format: Format): string {
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

/** Tool 4 — export a variable group as CSV / JSON / TXT. */
export function ExportGroup() {
  const [group, setGroup] = useState<VariableGroup | null>(null);
  const [format, setFormat] = useState<Format>('csv');

  const output = useMemo(() => (group ? buildOutput(group, format) : ''), [group, format]);
  const active = FORMATS.find((f) => f.id === format)!;
  const hasSecrets = useMemo(
    () => (group ? variableEntries(group).some((e) => e.isSecret) : false),
    [group],
  );

  return (
    <RequireProject>
      <PageLayout
        title="Export Variable Group"
        description="Export a variable group as CSV, JSON, or TXT."
        icon={Download}
      >
        <SectionCard
          title="Source"
          actions={
            <div className="flex rounded-md border border-input p-0.5">
              {FORMATS.map((f) => (
                <Button
                  key={f.id}
                  variant={format === f.id ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn('h-7 px-3', format === f.id && 'shadow-sm')}
                  onClick={() => setFormat(f.id)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          }
        >
          <VariableGroupPicker value={group?.id ?? null} onChange={(_, g) => setGroup(g)} />
        </SectionCard>

        {group ? (
          <>
            {hasSecrets && (
              <div className="rounded-md border border-warning/30 bg-warning/10 px-4 py-2 text-sm text-warning">
                Secret variables cannot be read from Azure DevOps; their values are exported empty.
              </div>
            )}
            <OutputBlock
              title={`${active.label} export`}
              value={output}
              downloadName={`${safeFilename(group.name)}.${active.ext}`}
              downloadMime={active.mime}
              actions={<Badge variant="secondary">{variableCount(group)} vars</Badge>}
            />
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
