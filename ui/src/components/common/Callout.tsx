import type { LucideIcon } from 'lucide-react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CalloutProps {
  variant: 'info' | 'warning' | 'danger' | 'success';
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  info: 'border-blue-500/25 border-l-blue-500 bg-blue-500/8 text-blue-700 dark:text-blue-400',
  warning: 'border-warning/25 border-l-warning bg-warning/8 text-warning',
  danger: 'border-destructive/25 border-l-destructive bg-destructive/8 text-destructive',
  success: 'border-success/25 border-l-success bg-success/8 text-success',
};

const defaultIcons: Record<CalloutProps['variant'], LucideIcon> = {
  info: Info,
  warning: AlertTriangle,
  danger: AlertCircle,
  success: CheckCircle2,
};

export function Callout({ variant, icon, children, className }: CalloutProps) {
  const Icon = icon ?? defaultIcons[variant];
  return (
    <div
      className={cn(
        'rounded-md border border-l-4 px-4 py-2.5 text-sm flex items-start gap-2.5',
        variantStyles[variant],
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  );
}
