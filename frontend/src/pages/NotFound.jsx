import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-8 max-w-sm w-full flex flex-col items-center gap-3 shadow-xs">
        <span className="text-3xl font-bold text-[var(--primary)] font-mono">
          404
        </span>
        <h1 className="text-base font-bold text-[var(--text-primary)]">Page not found</h1>
        <p className="text-xs text-[var(--text-muted)]">
          The requested route does not exist.
        </p>
        <Button variant="primary" size="sm" onClick={() => navigate('/app')} className="mt-2">
          Back to Today
        </Button>
      </div>
    </div>
  );
};
