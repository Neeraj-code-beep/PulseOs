import { lazy, Suspense } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute';

// Route-level code-split pages for performance optimization
const Landing = lazy(() => import('./pages/Landing'));
const Today = lazy(() => import('./pages/Today'));
const Tasks = lazy(() => import('./pages/Tasks').then((m) => ({ default: m.Tasks })));
const Focus = lazy(() => import('./pages/Focus').then((m) => ({ default: m.Focus })));
const Analytics = lazy(() => import('./pages/Analytics').then((m) => ({ default: m.Analytics })));
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

// Polished Warm Editorial route loading indicator
const RouteLoadingFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-8">
    <div className="w-7 h-7 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
    <span className="text-xs font-mono text-[var(--text-muted)] tracking-wider">
      Loading workspace…
    </span>
  </div>
);

const App = () => {
  return (
    <Router>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<Landing />} />

          {/* Public Authentication Routes */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />

          {/* Protected Application Workspace Routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Today />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Tasks />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/focus"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Focus />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Analytics />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
