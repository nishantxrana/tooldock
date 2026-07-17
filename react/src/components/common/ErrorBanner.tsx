import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { errorMessage, errorTitle } from '@/lib/api/errors';

interface ErrorBannerProps {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}

/** Inline, actionable error banner for failed API calls. */
export function ErrorBanner({ error, onRetry, className }: ErrorBannerProps) {
  return (
    <div
      className={
        'flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 ' +
        (className ?? '')
      }
      role="alert"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
      <div className="flex-1">
        <p className="font-medium text-destructive">{errorTitle(error)}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{errorMessage(error)}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw />
          Retry
        </Button>
      )}
    </div>
  );
}
