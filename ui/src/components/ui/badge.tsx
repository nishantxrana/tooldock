import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors tabular-nums',
  {
    variants: {
      variant: {
        default: 'bg-primary/12 text-primary border-primary/25',
        secondary: 'bg-secondary text-secondary-foreground border-border',
        success: 'bg-success/10 text-success border-green-500/25',
        warning: 'bg-warning/10 text-warning border-amber-500/25',
        destructive: 'bg-destructive/10 text-destructive border-destructive/25',
        outline: 'text-foreground border-border',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
