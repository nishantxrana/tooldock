import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

interface SectionCardProps {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/** A titled card section with optional right-aligned actions. */
export function SectionCard({
  title,
  actions,
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <Card className={className}>
      {(title || actions) && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b py-3">
          {title ? <CardTitle className="text-sm">{title}</CardTitle> : <span />}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </CardHeader>
      )}
      <CardContent className={cn('pt-4', contentClassName)}>{children}</CardContent>
    </Card>
  );
}
