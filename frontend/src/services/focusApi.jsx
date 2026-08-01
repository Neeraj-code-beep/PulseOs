import API from './Api';

export const createFocusSessionApi = async (payload) => {
  const res = await API.post('api/focus/sessions', payload);
  return res.data;
};

export const getFocusSessionsApi = async (limit = 10) => {
  const res = await API.get(`api/focus/sessions?limit=${limit}`);
  return res.data;
};

export const getFocusSummaryApi = async () => {
  const res = await API.get('api/focus/summary');
  return res.data;
};
