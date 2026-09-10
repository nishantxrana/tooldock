import { useNavigate } from 'react-router-dom';
import { ConnectForm } from './ConnectForm';
import { useSessionStore } from '@/store/sessionStore';
import { Navigate } from 'react-router-dom';

export function ConnectPage() {
  const isConnected = useSessionStore((s) => s.isConnected);
  const navigate = useNavigate();

  // Already connected — no need to be here
  if (isConnected) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-start justify-center px-6 pt-[14vh] pb-24">
      <div className="w-full max-w-sm">
        <ConnectForm onConnected={() => navigate('/', { replace: true })} />
      </div>
    </div>
  );
}
