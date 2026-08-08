import { useState, useEffect, useCallback } from 'react';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { getAnalyticsOverviewApi, getFocusTrendApi, getTaskPerformanceApi } from '../services/analyticsApi';
import { getFocusSessionsApi } from '../services/focusApi';
import { AnalyticsHeader } from '../components/analytics/AnalyticsHeader';
import { AnalyticsMetricStrip } from '../components/analytics/AnalyticsMetricStrip';
import { FocusTrendChart } from '../components/analytics/FocusTrendChart';
import { TaskPerformance } from '../components/analytics/TaskPerformance';
import { RecentFocusSessions } from '../components/analytics/RecentFocusSessions';
import { InsightSummary } from '../components/analytics/InsightSummary';

export const Analytics = () => {
  const shouldReduceMotion = useReducedMotion();

  // Period state for trend chart (7, 14, 30 days)
  const [period, setPeriod] = useState(7);
  const [lastUpdated, setLastUpdated] = useState(false);

  // Section states
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(null);

  const [trendData, setTrendData] = useState(null);
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendError, setTrendError] = useState(null);

  const [performance, setPerformance] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const [performanceError, setPerformanceError] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(null);

  // Fetch Overview
  const fetchOverview = useCallback(async () => {
    try {
      setOverviewLoading(true);
      setOverviewError(null);
      const res = await getAnalyticsOverviewApi();
      if (res.success && res.data) {
        setOverview(res.data);
        setLastUpdated(true);
      } else {
        setOverviewError(res.message || 'Unable to load productivity overview.');
      }
    } catch (err) {
      setOverviewError(err.response?.data?.message || err.message || 'Unable to connect to analytics service.');
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  // Fetch Focus Trend for current period
  const fetchTrend = useCallback(async (days) => {
    try {
      setTrendLoading(true);
      setTrendError(null);
      const res = await getFocusTrendApi(days);
      if (res.success && res.data) {
        setTrendData(res.data);
      } else {
        setTrendError(res.message || 'Unable to load study rhythm chart.');
      }
    } catch (err) {
      setTrendError(err.response?.data?.message || err.message || 'Unable to connect to trend service.');
    } finally {
      setTrendLoading(false);
    }
  }, []);

  // Fetch Task Performance
  const fetchPerformance = useCallback(async () => {
    try {
      setPerformanceLoading(true);
      setPerformanceError(null);
      const res = await getTaskPerformanceApi();
      if (res.success && res.data) {
        setPerformance(res.data);
      } else {
        setPerformanceError(res.message || 'Unable to load workload performance metrics.');
      }
    } catch (err) {
      setPerformanceError(err.response?.data?.message || err.message || 'Unable to connect to performance service.');
    } finally {
      setPerformanceLoading(false);
    }
  }, []);

  // Fetch Recent Sessions
  const fetchSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      setSessionsError(null);
      const res = await getFocusSessionsApi(10);
      if (res.success && Array.isArray(res.data)) {
        setSessions(res.data);
      } else {
        setSessionsError(res.message || 'Unable to load recent focus activity.');
      }
    } catch (err) {
      setSessionsError(err.response?.data?.message || err.message || 'Unable to connect to focus service.');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  // Initial mount data fetching
  useEffect(() => {
    fetchOverview();
    fetchPerformance();
    fetchSessions();
  }, [fetchOverview, fetchPerformance, fetchSessions]);

  // Refetch trend whenever period changes
  useEffect(() => {
    fetchTrend(period);
  }, [period, fetchTrend]);

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
        loading={overviewLoading}
        error={overviewError}
      />

      {/* Main Focus Trend Visualization */}
      <FocusTrendChart
        trendData={trendData}
        period={period}
        loading={trendLoading}
        error={trendError}
        onRetry={() => fetchTrend(period)}
      />

      {/* Secondary Insight Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskPerformance
          performance={performance}
          loading={performanceLoading}
          error={performanceError}
          onRetry={fetchPerformance}
        />

        <RecentFocusSessions
          sessions={sessions}
          loading={sessionsLoading}
          error={sessionsError}
          onRetry={fetchSessions}
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
