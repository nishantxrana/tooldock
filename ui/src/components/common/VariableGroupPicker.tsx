import { useMemo } from 'react';
import { Boxes } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBanner } from './ErrorBanner';
import { EmptyState } from './EmptyState';
import { useVariableGroups } from '@/lib/hooks/useVariableGroups';
import type { VariableGroup } from '@/types/ado';

interface VariableGroupPickerProps {
  value: number | null;
  onChange: (groupId: number, group: VariableGroup) => void;
  label?: string;
}

/** Searchable dropdown to select one of the project's variable groups. */
export function VariableGroupPicker({
  value,
  onChange,
  label = 'Variable Group',
}: VariableGroupPickerProps) {
  const { data: groups, isLoading, isError, error, refetch } = useVariableGroups();

  const options = useMemo(
    () => (groups ?? []).map((g) => ({ value: String(g.id), label: g.name })),
    [groups],
  );

  if (isLoading) return <Skeleton className="h-9 w-full max-w-sm" />;
  if (isError) return <ErrorBanner error={error} onRetry={() => refetch()} />;
  if (!groups || groups.length === 0) {
    return (
      <EmptyState
        icon={Boxes}
        title="No variable groups"
        description="This project has no variable groups, or your PAT lacks read access."
      />
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <Combobox
        options={options}
        value={value !== null ? String(value) : undefined}
        onChange={(v) => {
          const id = Number(v);
          const group = groups.find((g) => g.id === id);
          if (group) onChange(id, group);
        }}
        placeholder="Select a variable group…"
        searchPlaceholder="Search groups…"
        className="max-w-sm"
      />
    </div>
  );
}
