import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle}>
          {theme === 'light' ? <Moon /> : <Sun />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Toggle light/dark theme</TooltipContent>
    </Tooltip>
  );
}
