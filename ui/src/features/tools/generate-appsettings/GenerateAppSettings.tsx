import { useMemo, useState } from 'react';
import { Terminal } from 'lucide-react';
import { PageLayout } from '@/components/common/PageLayout';
import { SectionCard } from '@/components/common/SectionCard';
import { OutputBlock } from '@/components/common/OutputBlock';
import { EmptyState } from '@/components/common/EmptyState';
import { VariableGroupPicker } from '@/components/common/VariableGroupPicker';
import { RequireProject } from '@/components/common/RequireProject';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { formatAppSettings, type AppSettingsFormat } from '@/lib/utils/appSettings';
import { safeFilename } from '@/lib/utils/download';
import { variableCount, variableNames } from '@/lib/utils/variables';
import type { VariableGroup } from '@/types/ado';

/**
 * Tool 1 — generate the App Service Deploy "App settings" string from a variable
 * group's variable NAMES (values are ignored).
 */
export function GenerateAppSettings() {
  const [group, setGroup] = useState<VariableGroup | null>(null);
  const [oneLine, setOneLine] = useState(false);

  const keys = useMemo(() => (group ? variableNames(group) : []), [group]);
  const format: AppSettingsFormat = oneLine ? 'oneline' : 'multiline';
  const output = useMemo(() => formatAppSettings(keys, format), [keys, format]);

  return (
    <RequireProject>
      <PageLayout
        title="Generate App Service Settings"
        description={
          'Turn a variable group into the -KEY "$(KEY)" string for the App Service Deploy task.'
        }
        icon={Terminal}
      >
        <SectionCard title="Source">
          <VariableGroupPicker value={group?.id ?? null} onChange={(_, g) => setGroup(g)} />
        </SectionCard>

        {group ? (
          <OutputBlock
            title="App settings"
            value={output}
            downloadName={`${safeFilename(group.name)}-appsettings.txt`}
            actions={
              <>
                <Badge variant="secondary">{variableCount(group)} vars</Badge>
                <label className="flex items-center gap-2 pr-1 text-sm">
                  <Switch checked={oneLine} onCheckedChange={setOneLine} id="oneline" />
                  <Label htmlFor="oneline" className="cursor-pointer text-muted-foreground">
                    One line
                  </Label>
                </label>
              </>
            }
            emptyHint="This variable group has no variables."
          />
        ) : (
          <EmptyState
            icon={Terminal}
            title="Select a variable group"
            description="Pick a group above to generate its App Service settings string."
          />
        )}
      </PageLayout>
    </RequireProject>
  );
}
