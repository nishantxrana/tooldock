import { useMemo, useState } from 'react';
import { FileSpreadsheet, RotateCcw, Upload } from 'lucide-react';
import { Callout } from '@/components/common/Callout';
import { toast } from 'sonner';
import { PageLayout } from '@/components/common/PageLayout';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { VariableGroupPicker } from '@/components/common/VariableGroupPicker';
import { RequireProject } from '@/components/common/RequireProject';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CsvDropzone } from './CsvDropzone';
import { ImportPreviewTable, ImportPreviewTableWithControls } from './ImportPreviewTable';
import { buildImportPlan } from './importDiff';
import { parseKeyValueCsv } from '@/lib/utils/csv';
import { useUpdateVariableGroup } from '@/lib/hooks/useUpdateVariableGroup';
import { AdoError, errorMessage, errorTitle } from '@/lib/api/errors';
import { useSessionStore } from '@/store/sessionStore';
import type { VariableGroup } from '@/types/ado';

/**
 * Tool 3 - import variables from a CSV into a variable group. Shows a full
 * per-key diff and requires explicit confirmation before writing. Existing
 * variables not present in the CSV are preserved.
 */
export function CsvImport() {
  const [group, setGroup] = useState<VariableGroup | null>(null);
  const [csvText, setCsvText] = useState('');
  const [csvName, setCsvName] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const mutation = useUpdateVariableGroup();
  const writable = useSessionStore((s) => s.variableGroupsWritable);
  const writeDenied = writable === false;

  const parsed = useMemo(() => (csvText ? parseKeyValueCsv(csvText) : null), [csvText]);
  const plan = useMemo(
    () => (group && parsed ? buildImportPlan(group, parsed.rows) : null),
    [group, parsed],
  );

  const reset = () => {
    setCsvText('');
    setCsvName('');
    mutation.reset();
  };

  const runImport = () => {
    if (!group || !plan) return;
    mutation.mutate(
      { groupId: group.id, nextVariables: plan.nextVariables },
      {
        onSuccess: (updated) => {
          setConfirmOpen(false);
          setGroup(updated);
          reset();
          // Report only the changes, not the total CSV row count.
          const parts = [
            plan.counts.new > 0 && `${plan.counts.new} added`,
            plan.counts.overwrite > 0 && `${plan.counts.overwrite} updated`,
          ].filter(Boolean);
          toast.success(
            `Imported into "${updated.name}" - ${parts.length > 0 ? parts.join(', ') : 'no changes'}`,
          );
        },
        onError: (err) => {
          setConfirmOpen(false);
          const scopeDenied =
            err instanceof AdoError && (err.kind === 'unauthorized' || err.kind === 'forbidden');
          toast.error(scopeDenied ? 'Insufficient PAT scope' : errorTitle(err), {
            description: errorMessage(err),
          });
        },
      },
    );
  };

  // Only changed rows shown in the confirm dialog - same rows are noise there.
  const dialogRows = useMemo(
    () => (plan ? plan.rows.filter((r) => r.status !== 'same') : []),
    [plan],
  );

  return (
    <RequireProject>
      <PageLayout
        title="CSV Import"
        description="Import Key,Value pairs into a variable group. You review every change before anything is written."
        icon={FileSpreadsheet}
        actions={
          (csvText || group) && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw />
              Reset
            </Button>
          )
        }
      >
        <SectionCard title="Target variable group">
          <VariableGroupPicker value={group?.id ?? null} onChange={(_, g) => setGroup(g)} />
        </SectionCard>

        <SectionCard title="CSV file">
          {csvText ? (
            <div className="flex items-center justify-between rounded-md border bg-muted/30 px-4 py-3">
              <span className="font-mono text-sm">{csvName || 'pasted.csv'}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{parsed?.rows.length ?? 0} rows</Badge>
                <Button variant="ghost" size="sm" onClick={reset}>
                  Change file
                </Button>
              </div>
            </div>
          ) : (
            <CsvDropzone
              onFile={(text, name) => {
                setCsvText(text);
                setCsvName(name);
              }}
            />
          )}
        </SectionCard>

        {parsed && parsed.warnings.length > 0 && (
          <Callout variant="warning">
            <div>
              <p className="mb-1 font-medium">CSV warnings</p>
              <ul className="list-inside list-disc space-y-0.5">
                {parsed.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          </Callout>
        )}

        {mutation.isError && <ErrorBanner error={mutation.error} />}

        {group && plan ? (
          plan.rows.length === 0 ? (
            <EmptyState
              icon={FileSpreadsheet}
              title="No rows to import"
              description="The CSV did not contain any valid Key,Value rows."
            />
          ) : (
            <SectionCard
              title="Preview"
              actions={
                <div className="flex items-center gap-2">
                  <Badge variant="warning">{plan.counts.overwrite} overwrite</Badge>
                  <Badge variant="success">{plan.counts.new} new</Badge>
                  <Badge variant="secondary">{plan.counts.same} same</Badge>
                  {writeDenied ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={0}>
                          <Button size="sm" disabled>
                            <Upload />
                            Import…
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Your PAT can read but not write variable groups. Reconnect with a PAT that
                        has the "Variable Groups (Read, create, &amp; manage)" scope to import.
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button size="sm" onClick={() => setConfirmOpen(true)}>
                      <Upload />
                      Import…
                    </Button>
                  )}
                </div>
              }
            >
              {writeDenied && (
                <Callout variant="warning" className="mb-3">
                  Import is disabled - your PAT lacks the Variable Groups <strong>manage</strong>{' '}
                  scope. You can still preview changes below.
                </Callout>
              )}
              <ImportPreviewTableWithControls rows={plan.rows} />
            </SectionCard>
          )
        ) : (
          <EmptyState
            icon={FileSpreadsheet}
            title="Select a group and a CSV"
            description="Choose a target variable group and upload a CSV to preview the changes."
          />
        )}
      </PageLayout>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Import into "${group?.name}"?`}
        description="This writes to Azure DevOps and cannot be undone from ToolDock."
        confirmLabel={`Yes, import`}
        destructive={(plan?.counts.overwrite ?? 0) > 0}
        confirmDisabled={mutation.isPending}
        confirmLoading={mutation.isPending}
        onConfirm={runImport}
      >
        {plan && (
          <div className="min-w-0 space-y-3">
            {plan.counts.overwrite > 0 && (
              <Callout variant="warning">
                <strong>{plan.counts.overwrite}</strong> existing variable
                {plan.counts.overwrite === 1 ? '' : 's'} will be overwritten.
              </Callout>
            )}
            <div className="flex gap-2 text-sm">
              <Badge variant="warning">{plan.counts.overwrite} overwrite</Badge>
              <Badge variant="success">{plan.counts.new} new</Badge>
              <Badge variant="secondary">{plan.counts.same} unchanged</Badge>
            </div>
            {/* Only show changed rows in the dialog - same rows add noise here. */}
            {dialogRows.length > 0 && <ImportPreviewTable rows={dialogRows} />}
          </div>
        )}
      </ConfirmDialog>
    </RequireProject>
  );
}
