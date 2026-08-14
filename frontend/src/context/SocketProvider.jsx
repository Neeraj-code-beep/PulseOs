import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { SocketContext } from './SocketContext';
import { useAuth } from './useAuth';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect socket if user is authenticated with a valid JWT token
    if (!isAuthenticated || !token) {
      setSocket((prevSocket) => {
        if (prevSocket) {
          prevSocket.disconnect();
        }
        return null;
      });
      setIsConnected(false);
      return;
    }

    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: {
        token,
      },
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
      setIsConnected(false);
    });

    socketInstance.on('auth:expired', () => {
      localStorage.removeItem('pulse_token');
      window.dispatchEvent(new Event('auth:unauthorized'));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
