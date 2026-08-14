import API from './Api';

export const getAnalyticsOverviewApi = async () => {
  const res = await API.get('api/analytics/overview');
  return res.data;
};

export const getFocusTrendApi = async (days = 7) => {
  const res = await API.get(`api/analytics/focus-trend?days=${days}`);
  return res.data;
};

export const getTaskPerformanceApi = async () => {
  const res = await API.get('api/analytics/task-performance');
  return res.data;
};

export const getAnalyticsDashboardApi = async (days = 7) => {
  const res = await API.get(`api/analytics/dashboard?days=${days}`);
  return res.data;
};
