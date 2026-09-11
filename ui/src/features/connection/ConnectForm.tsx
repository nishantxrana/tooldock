import { useState } from 'react';
import { ChevronDown, Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { listProjects } from '@/lib/api/projects';
import { useSessionStore } from '@/store/sessionStore';
import { REQUIRED_PAT_SCOPES } from '@/lib/constants';
import { useCtrlEnter } from '@/lib/hooks/useHotkeys';
import { cn } from '@/lib/utils/cn';

interface ConnectFormProps {
  title?: string;
  onConnected: () => void;
}

export function ConnectForm({ title = 'Connect to Azure DevOps', onConnected }: ConnectFormProps) {
  const connect = useSessionStore((s) => s.connect);
  const selectProject = useSessionStore((s) => s.selectProject);

  const [organization, setOrganization] = useState('');
  const [pat, setPat] = useState('');
  const [showPat, setShowPat] = useState(false);
  const [scopesOpen, setScopesOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const canSubmit = organization.trim().length > 0 && pat.trim().length > 0 && !validating;

  const handleConnect = async () => {
    if (!canSubmit) return;
    setValidating(true);
    setError(null);
    try {
      const org = organization.trim();
      const projects = await listProjects(org, { patOverride: pat });
      connect(pat, org);
      if (projects.length === 1) selectProject(projects[0]!);
      onConnected();
    } catch (err) {
      setError(err);
    } finally {
      setValidating(false);
    }
  };

  useCtrlEnter(handleConnect, canSubmit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your organization name and a Personal Access Token.
        </p>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="org">Organization</Label>
          <Input
            id="org"
            placeholder="my-organization"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            autoFocus
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            The name in <code>dev.azure.com/&lt;organization&gt;</code>
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pat">Personal Access Token</Label>
          <div className="relative">
            <Input
              id="pat"
              type={showPat ? 'text' : 'password'}
              placeholder="••••••••••••••••••••"
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              autoComplete="off"
              className="pr-9 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPat((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPat ? 'Hide token' : 'Show token'}
            >
              {showPat ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Security note - inline, unobtrusive */}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3 shrink-0" />
            Kept in memory only - never stored, cleared on refresh
          </p>
        </div>
      </div>

      {error != null && <ErrorBanner error={error} />}

      {/* Submit - stable, never moves */}
      <div className="space-y-2">
        <Button className="w-full h-10" disabled={!canSubmit} onClick={handleConnect}>
          {validating && <Loader2 className="animate-spin" />}
          {validating ? 'Connecting…' : 'Connect'}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to connect
        </p>
      </div>

      {/* PAT scopes - below the fold, expands downward, never disrupts the form */}
      <div className="border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setScopesOpen((o) => !o)}
          className="flex w-full items-center justify-between text-left transition-colors"
        >
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Required PAT scopes
          </span>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground transition-transform duration-150',
              scopesOpen && 'rotate-180',
            )}
          />
        </button>
        {scopesOpen && (
          <ul className="mt-3 space-y-3">
            {REQUIRED_PAT_SCOPES.map((scope) => (
              <li key={scope.name} className="text-xs">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  {scope.name}
                  {!scope.required && (
                    <span className="rounded bg-muted px-1 py-0.5 text-[10px] font-normal text-muted-foreground">
                      optional
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-muted-foreground">{scope.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
