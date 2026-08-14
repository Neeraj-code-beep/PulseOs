import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { loginApi, registerApi, getMeApi } from '../services/authApi';
import { toast } from 'react-toastify';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('pulse_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  const requestIdRef = useRef(0);

  // Restore and verify user session on mount or token change
  const restoreSession = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
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
      // Ignore if a newer request or explicit login/logout happened
      if (currentRequestId !== requestIdRef.current) return;

      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setToken(storedToken);
      } else {
        localStorage.removeItem('pulse_token');
        setUser(null);
        setToken(null);
      }
    } catch {
      if (currentRequestId !== requestIdRef.current) return;
      localStorage.removeItem('pulse_token');
      setUser(null);
      setToken(null);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    restoreSession();

    const handleUnauthorized = () => {
      requestIdRef.current++;
      localStorage.removeItem('pulse_token');
      setUser(null);
      setToken(null);
      toast.warn('Session expired. Please log in again.');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [restoreSession]);

  const login = async (credentials) => {
    requestIdRef.current++;
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
    requestIdRef.current++;
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
    requestIdRef.current++;
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
