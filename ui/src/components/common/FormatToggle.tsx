import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface FormatToggleProps<T extends string> {
  formats: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}

export function FormatToggle<T extends string>({ formats, value, onChange }: FormatToggleProps<T>) {
  return (
    <div className="flex rounded-md border border-input bg-muted/30 p-0.5">
      {formats.map((f) => (
        <Button
          key={f.id}
          variant="ghost"
          size="sm"
          className={cn(
            'h-7 px-3 text-xs font-medium transition-all',
            value === f.id
              ? 'bg-background shadow-sm text-foreground hover:bg-background'
              : 'text-muted-foreground hover:text-foreground hover:bg-transparent',
          )}
          onClick={() => onChange(f.id)}
        >
          {f.label}
        </Button>
      ))}
    </div>
  );
}
