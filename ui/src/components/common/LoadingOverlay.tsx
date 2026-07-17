import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
}

/** Full-surface overlay shown during blocking mutations (e.g. CSV import). */
export function LoadingOverlay({ message = 'Working…' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-8 py-6 shadow-lg">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}
