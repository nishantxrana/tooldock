import { useState } from 'react';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { listProjects } from '@/lib/api/projects';
import { useSessionStore } from '@/store/sessionStore';
import { REQUIRED_PAT_SCOPES } from '@/lib/constants';
import { useCtrlEnter } from '@/lib/hooks/useHotkeys';

interface ConnectFormProps {
  /** Card title. Defaults to a generic "Connect to Azure DevOps". */
  title?: string;
  /** Called after the session store has isConnected: true. */
  onConnected: () => void;
}

/**
 * The connect form itself: org + PAT inputs, scope hints, validation and
 * submit. Shared between the standalone /connect route and the inline gate
 * shown in place of a locked tool.
 */
export function ConnectForm({ title = 'Connect to Azure DevOps', onConnected }: ConnectFormProps) {
  const connect = useSessionStore((s) => s.connect);
  const selectProject = useSessionStore((s) => s.selectProject);

  const [organization, setOrganization] = useState('');
  const [pat, setPat] = useState('');
  const [showPat, setShowPat] = useState(false);
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
      // Convenience: auto-select if the org has exactly one project.
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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Your PAT is used only for Azure DevOps requests and is kept in memory. It is never
          stored — refreshing the page clears it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            The name in <code className="font-mono">dev.azure.com/&lt;organization&gt;</code>.
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPat ? 'Hide token' : 'Show token'}
            >
              {showPat ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="rounded-md border border-border bg-muted/40 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Required PAT scopes
          </p>
          <ul className="space-y-1.5">
            {REQUIRED_PAT_SCOPES.map((scope) => (
              <li key={scope.name} className="text-xs">
                <span className="font-medium">{scope.name}</span>
                <span className="block text-muted-foreground">{scope.detail}</span>
              </li>
            ))}
          </ul>
        </div>

        {error != null && <ErrorBanner error={error} />}

        <Button className="w-full" disabled={!canSubmit} onClick={handleConnect}>
          {validating && <Loader2 className="animate-spin" />}
          {validating ? 'Connecting…' : 'Connect'}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Press <kbd className="rounded border px-1">Ctrl</kbd> +{' '}
          <kbd className="rounded border px-1">Enter</kbd> to connect
        </p>
      </CardContent>
    </Card>
  );
}
