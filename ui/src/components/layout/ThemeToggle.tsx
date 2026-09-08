import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { applyTheme, getStoredTheme, type Theme } from '@/lib/utils/theme';

/** Theme toggle. The choice persists across refreshes via localStorage. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    setTheme(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      title="Toggle light/dark theme"
      onClick={toggle}
    >
      {theme === 'light' ? <Moon /> : <Sun />}
    </Button>
  );
}
