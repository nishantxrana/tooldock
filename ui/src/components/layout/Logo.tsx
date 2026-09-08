import { Link } from 'react-router-dom';
import { APP_NAME } from '@/lib/constants';

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20 p-1">
        <img src="/favicon.svg" alt="ToolDock" className="h-full w-full" />
      </span>
      <span className="text-sm font-bold tracking-tight">{APP_NAME}</span>
    </Link>
  );
}
