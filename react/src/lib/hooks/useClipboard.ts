import { useCallback, useEffect, useRef, useState } from 'react';
import { copyToClipboard } from '@/lib/utils/clipboard';

/** Copy helper with a transient "copied" flag for button feedback. */
export function useClipboard(resetMs = 1500) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const copy = useCallback(
    async (text: string) => {
      const ok = await copyToClipboard(text);
      if (ok) {
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), resetMs);
      }
      return ok;
    },
    [resetMs],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return { copied, copy };
}
