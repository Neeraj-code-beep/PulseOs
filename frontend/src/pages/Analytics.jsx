import { useEffect, useState, useCallback } from 'react';
import { Clock, CheckCircle2, Flame, RefreshCw, AlertCircle } from 'lucide-react';
import { getAnalyticsOverviewApi } from '../services/analyticsApi';

export const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAnalyticsOverviewApi();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load analytics overview.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Network error fetching analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto py-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Analytics & Insights
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Backend API data verification
          </p>
        </div>
        <button
          onClick={fetchOverview}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] transition-colors disabled:opacity-50"
          title="Refresh metrics"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-8 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <RefreshCw size={24} className="animate-spin text-[var(--accent)]" />
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            Loading analytics foundation data...
          </span>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-[var(--bg-surface)] border border-red-500/20 rounded-[var(--radius-lg)] p-6 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <div className="p-2.5 bg-red-500/10 text-red-500 rounded-full">
            <AlertCircle size={22} />
          </div>
          <span className="text-sm font-bold text-[var(--text-primary)]">
            Unable to load analytics data
          </span>
          <p className="text-xs text-[var(--text-secondary)] max-w-md leading-relaxed">
            {error}
          </p>
          <button
            onClick={fetchOverview}
            className="mt-1 px-4 py-2 text-xs font-semibold text-white bg-[var(--accent)] rounded-[var(--radius-md)] hover:brightness-110 transition-all shadow-xs"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Verification Data Grid */}
      {!loading && !error && data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Focus Today */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 flex items-center justify-between shadow-xs">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Focus Today
              </span>
              <span className="text-2xl font-bold text-[var(--text-primary)]">
                {data.focusTodayMinutes}m
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Total focus time today
              </span>
            </div>
            <div className="p-3 bg-[var(--bg-surface-elevated)] text-[var(--accent)] rounded-full">
              <Clock size={22} />
            </div>
          </div>

          {/* Focus This Week */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 flex items-center justify-between shadow-xs">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Focus This Week
              </span>
              <span className="text-2xl font-bold text-[var(--text-primary)]">
                {data.focusWeekMinutes}m
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Mon - Sun accumulated
              </span>
            </div>
            <div className="p-3 bg-[var(--bg-surface-elevated)] text-amber-500 rounded-full">
              <Flame size={22} />
            </div>
          </div>

          {/* Sessions Today */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 flex items-center justify-between shadow-xs">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Sessions Today
              </span>
              <span className="text-2xl font-bold text-[var(--text-primary)]">
                {data.sessionsToday}
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Completed focus blocks
              </span>
            </div>
            <div className="p-3 bg-[var(--bg-surface-elevated)] text-indigo-500 rounded-full">
              <Clock size={22} />
            </div>
          </div>

          {/* Completed Tasks Today */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 flex items-center justify-between shadow-xs">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Completed Tasks Today
              </span>
              <span className="text-2xl font-bold text-[var(--text-primary)]">
                {data.completedTasksToday}
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Finished study items
              </span>
            </div>
            <div className="p-3 bg-[var(--bg-surface-elevated)] text-emerald-500 rounded-full">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
