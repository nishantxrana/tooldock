import { Link } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

/** Brand mark: icon + app name, linking back to the home page. */
export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <LayoutGrid className="h-4 w-4" />
      </span>
      <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
    </Link>
  );
}
