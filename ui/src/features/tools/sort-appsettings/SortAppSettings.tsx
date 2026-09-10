import { useMemo, useState } from 'react';
import { ArrowDownAZ } from 'lucide-react';
import { PageLayout } from '@/components/common/PageLayout';
import { SectionCard } from '@/components/common/SectionCard';
import { OutputBlock } from '@/components/common/OutputBlock';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  distinctKeys,
  formatAppSettings,
  parseAppSettingsKeys,
  type AppSettingsFormat,
} from '@/lib/utils/appSettings';

/** Tool 6 — paste App Settings (one-line or multiline) and get them sorted alphabetically. */
export function SortAppSettings() {
  const [input, setInput] = useState('');
  const [oneLine, setOneLine] = useState(true);

  const parsed = useMemo(() => parseAppSettingsKeys(input), [input]);
  const sortedKeys = useMemo(() => {
    const keys = distinctKeys(parsed);
    return [...keys].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [parsed]);

  const format: AppSettingsFormat = oneLine ? 'oneline' : 'multiline';
  const output = useMemo(
    () => (sortedKeys.length > 0 ? formatAppSettings(sortedKeys, format) : ''),
    [sortedKeys, format],
  );

  return (
    <PageLayout
      title="Sort App Settings"
      description="Paste App Settings (one-line or multiline) and get them back sorted alphabetically."
      icon={ArrowDownAZ}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Input"
          actions={
            <Badge variant="secondary">{sortedKeys.length} vars</Badge>
          }
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'-NODE_ENV "$(NODE_ENV)" -JWT_SECRET "$(JWT_SECRET)" -API_URL "$(API_URL)"'}
            className="min-h-[360px]"
            autoFocus
          />
        </SectionCard>

        <OutputBlock
          title="Sorted"
          value={output}
          downloadName="app-settings-sorted.txt"
          emptyHint="Paste App Settings on the left to see the sorted result."
          actions={
            <label className="flex items-center gap-2 pr-1 text-sm">
              <Switch checked={oneLine} onCheckedChange={setOneLine} id="oneline-sort" />
              <Label htmlFor="oneline-sort" className="cursor-pointer text-muted-foreground">
                One line
              </Label>
            </label>
          }
        />
      </div>
    </PageLayout>
  );
}
