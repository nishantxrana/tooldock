import { useEffect, useState } from 'react';
import { Lock, LockOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { lockPat, unlockPat } from '@/lib/utils/patVault';
import { useSessionStore } from '@/store/sessionStore';

const EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

/** Lock/unlock button in the header — voluntarily persists the PAT to encrypted IndexedDB. */
export function PersistButton() {
  const pat = useSessionStore((s) => s.pat);
  const organization = useSessionStore((s) => s.organization);
  const isPatPersisted = useSessionStore((s) => s.isPatPersisted);
  const lockedAt = useSessionStore((s) => s.lockedAt);
  const setPatPersisted = useSessionStore((s) => s.setPatPersisted);

  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  // Update countdown every minute; auto-expire when time runs out.
  useEffect(() => {
    if (!isPatPersisted || lockedAt === null) {
      setMinutesLeft(null);
      return;
    }

    const tick = () => {
      const remaining = EXPIRY_MS - (Date.now() - lockedAt);
      if (remaining <= 0) {
        unlockPat().catch(() => {});
        setPatPersisted(false, null);
        setMinutesLeft(null);
        return;
      }
      setMinutesLeft(Math.ceil(remaining / 60_000));
    };

    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [isPatPersisted, lockedAt, setPatPersisted]);

  const handleToggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (isPatPersisted) {
        await unlockPat();
        setPatPersisted(false, null);
      } else {
        const { lockedAt: newLockedAt } = await lockPat(pat!, organization!);
        setPatPersisted(true, newLockedAt);
      }
    } catch {
      toast.error('Storage unavailable', {
        description: 'Encrypted storage is not available in this browser or mode.',
      });
    } finally {
      setBusy(false);
    }
  };

  const tooltipText = isPatPersisted
    ? minutesLeft !== null && minutesLeft <= 1
      ? 'PAT persisted encrypted — expires in less than a minute. Click to remove.'
      : `PAT persisted encrypted — expires in ${minutesLeft ?? '…'} min. Click to remove from storage.`
    : 'PAT is in memory only — click to persist encrypted (survives refresh).';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          disabled={busy}
          aria-label={isPatPersisted ? 'Remove persisted PAT' : 'Persist PAT encrypted'}
        >
          {isPatPersisted ? (
            <Lock className="h-4 w-4 text-primary" />
          ) : (
            <LockOpen className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-64">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}
