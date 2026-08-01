import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { ToastContainer } from 'react-toastify';
import TodoProvider from './context/TodoProvider.jsx';
import ThemeProvider from './context/ThemeProvider.jsx';
import SocketProvider from './context/SocketProvider.jsx';
import FocusProvider from './context/FocusProvider.jsx';
import { ReminderListener } from './components/notifications/ReminderListener.jsx';

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <TodoProvider>
      <SocketProvider>
        <FocusProvider>
          <ReminderListener />
          <App />
          <ToastContainer position="top-center" />
        </FocusProvider>
      </SocketProvider>
    </TodoProvider>
  </ThemeProvider>,
);
