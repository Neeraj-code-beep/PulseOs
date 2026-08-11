import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { loginApi, registerApi, getMeApi } from '../services/authApi';
import { toast } from 'react-toastify';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('pulse_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore and verify user session on mount or token change
  const restoreSession = useCallback(async () => {
    const storedToken = localStorage.getItem('pulse_token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await getMeApi();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setToken(storedToken);
      } else {
        localStorage.removeItem('pulse_token');
        setUser(null);
        setToken(null);
      }
    } catch {
      localStorage.removeItem('pulse_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (credentials) => {
    try {
      const res = await loginApi(credentials);
      if (res.success && res.data) {
        const { user: userData, token: jwtToken } = res.data;
        localStorage.setItem('pulse_token', jwtToken);
        setToken(jwtToken);
        setUser(userData);
        toast.success(`Welcome back, ${userData.name}!`);
        return res.data;
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to login.';
      toast.error(msg);
      throw err;
    }
  };

  const register = async (formData) => {
    try {
      const res = await registerApi(formData);
      if (res.success && res.data) {
        const { user: userData, token: jwtToken } = res.data;
        localStorage.setItem('pulse_token', jwtToken);
        setToken(jwtToken);
        setUser(userData);
        toast.success(`Account created! Welcome to PulseOS, ${userData.name}.`);
        return res.data;
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to register account.';
      toast.error(msg);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('pulse_token');
    setUser(null);
    setToken(null);
    toast.info('Logged out successfully.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        register,
        logout,
        restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
