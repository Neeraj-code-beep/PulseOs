import { useState, useEffect, useCallback, useRef } from 'react';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { getAnalyticsDashboardApi } from '../services/analyticsApi';
import { useSocket } from '../context/useSocket';
import { AnalyticsHeader } from '../components/analytics/AnalyticsHeader';
import { AnalyticsMetricStrip } from '../components/analytics/AnalyticsMetricStrip';
import { FocusTrendChart } from '../components/analytics/FocusTrendChart';
import { TaskPerformance } from '../components/analytics/TaskPerformance';
import { RecentFocusSessions } from '../components/analytics/RecentFocusSessions';
import { InsightSummary } from '../components/analytics/InsightSummary';

export const Analytics = () => {
  const shouldReduceMotion = useReducedMotion();
  const { socket } = useSocket();

  // Period state for trend chart (7, 14, 30 days)
  const [period, setPeriod] = useState(7);
  const [lastUpdated, setLastUpdated] = useState(false);

  // Section states derived from consolidated dashboard endpoint
  const [overview, setOverview] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [sessions, setSessions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const debounceTimerRef = useRef(null);

  // Fetch Consolidated Dashboard
  const fetchDashboard = useCallback(async (days) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAnalyticsDashboardApi(days);
      if (res.success && res.data) {
        setOverview(res.data.overview || null);
        setTrendData({ days, points: res.data.trend || [] });
        setPerformance(res.data.taskPerformance || null);
        setSessions(res.data.recentSessions || []);
        setLastUpdated(true);
      } else {
        setError(res.message || 'Unable to load analytics dashboard.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to connect to analytics service.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch dashboard when period changes or on mount
  useEffect(() => {
    fetchDashboard(period);
  }, [period, fetchDashboard]);

  // Realtime Socket.IO listener for productivity:updated event
  useEffect(() => {
    if (!socket) return;

    const handleProductivityUpdate = () => {
      // Small debounce (300ms) to prevent multiple rapid network requests
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        fetchDashboard(period);
      }, 300);
    };

    socket.on('productivity:updated', handleProductivityUpdate);

    return () => {
      socket.off('productivity:updated', handleProductivityUpdate);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [socket, period, fetchDashboard]);

  return (
    <Motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="flex flex-col gap-6 max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8"
    >
      {/* Header with period toggle & fetch indicator */}
      <AnalyticsHeader
        period={period}
        onPeriodChange={setPeriod}
        lastUpdated={lastUpdated}
      />

      {/* Top Metric Strip */}
      <AnalyticsMetricStrip
        overview={overview}
        loading={loading}
        error={error}
      />

      {/* Main Focus Trend Visualization */}
      <FocusTrendChart
        trendData={trendData}
        period={period}
        loading={loading}
        error={error}
        onRetry={() => fetchDashboard(period)}
      />

      {/* Secondary Insight Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskPerformance
          performance={performance}
          loading={loading}
          error={error}
          onRetry={() => fetchDashboard(period)}
        />

        <RecentFocusSessions
          sessions={sessions}
          loading={loading}
          error={error}
          onRetry={() => fetchDashboard(period)}
        />
      </div>

      {/* Deterministic Insight Summary */}
      <InsightSummary
        overview={overview}
        performance={performance}
        trendData={trendData}
      />
    </Motion.div>
  );
};
