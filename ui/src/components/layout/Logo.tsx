import { Link } from 'react-router-dom';
import { APP_NAME } from '@/lib/constants';

/** Brand mark: icon + app name, linking back to the home page. */
export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <img src="/favicon.svg" alt="ToolDock" className="h-7 w-7" />
      <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
    </Link>
  );
}
