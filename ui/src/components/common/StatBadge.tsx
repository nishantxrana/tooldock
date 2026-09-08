import { Badge } from '@/components/ui/badge';

interface StatBadgeProps {
  count: number;
  label: string;
}

export function StatBadge({ count, label }: StatBadgeProps) {
  return (
    <Badge variant="secondary" className="font-mono text-xs tabular-nums">
      {count} {label}
    </Badge>
  );
}
