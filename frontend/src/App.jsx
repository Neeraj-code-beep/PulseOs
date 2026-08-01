import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { Today } from './pages/Today';
import { Tasks } from './pages/Tasks';
import { Focus } from './pages/Focus';
import { Analytics } from './pages/Analytics';
import { NotFound } from './pages/NotFound';

const App = () => {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="/app" element={<Today />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </Router>
  );
};

export default App;
