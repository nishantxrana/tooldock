import { useMemo, useState } from 'react';
import { ArrowDownAZ } from 'lucide-react';
import { PageLayout } from '@/components/common/PageLayout';
import { SectionCard } from '@/components/common/SectionCard';
import { OutputBlock } from '@/components/common/OutputBlock';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { countLines, distinctKeys, parseAppSettingsKeys, sortLines } from '@/lib/utils/appSettings';

/** Tool 6 — paste App Settings and get an alphabetically sorted copy. */
export function SortAppSettings() {
  const [input, setInput] = useState('');

  const output = useMemo(() => sortLines(input), [input]);
  const lineCount = useMemo(() => countLines(output), [output]);
  const varCount = useMemo(() => distinctKeys(parseAppSettingsKeys(input)).length, [input]);

  return (
    <PageLayout
      title="Sort App Settings"
      description="Paste App Settings and get them back sorted alphabetically, with formatting preserved."
      icon={ArrowDownAZ}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Input"
          actions={
            <div className="flex gap-2">
              <Badge variant="secondary">{lineCount} lines</Badge>
              <Badge variant="secondary">{varCount} vars</Badge>
            </div>
          }
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'-NODE_ENV "$(NODE_ENV)"\n-JWT_SECRET "$(JWT_SECRET)"\n…'}
            className="min-h-[360px]"
            autoFocus
          />
        </SectionCard>

        <OutputBlock
          title="Sorted"
          value={output}
          downloadName="app-settings-sorted.txt"
          emptyHint="Paste text on the left to see the sorted result."
        />
      </div>
    </PageLayout>
  );
}
