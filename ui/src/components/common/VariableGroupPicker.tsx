import { Boxes } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

/** Dropdown to select one of the project's variable groups. */
export function VariableGroupPicker({
  value,
  onChange,
  label = 'Variable Group',
}: VariableGroupPickerProps) {
  const { data: groups, isLoading, isError, error, refetch } = useVariableGroups();

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
      <Select
        value={value !== null ? String(value) : undefined}
        onValueChange={(v) => {
          const id = Number(v);
          const group = groups.find((g) => g.id === id);
          if (group) onChange(id, group);
        }}
      >
        <SelectTrigger className="w-full max-w-sm">
          <SelectValue placeholder="Select a variable group…" />
        </SelectTrigger>
        <SelectContent>
          {groups.map((g) => (
            <SelectItem key={g.id} value={String(g.id)}>
              {g.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
