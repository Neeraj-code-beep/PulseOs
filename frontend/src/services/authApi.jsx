import API from './Api';

export const registerApi = async (payload) => {
  const res = await API.post('api/auth/register', payload);
  return res.data;
};

export const loginApi = async (payload) => {
  const res = await API.post('api/auth/login', payload);
  return res.data;
};

export const getMeApi = async () => {
  const res = await API.get('api/auth/me');
  return res.data;
};
