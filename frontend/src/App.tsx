import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import TaskListPage from './pages/TaskListPage';
import TaskDetailPage from './pages/TaskDetailPage';
import CreateTaskPage from './pages/CreateTaskPage';
import DashboardPage from './pages/DashboardPage';
import Header from './components/Header';
import './index.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Header />
                <div className="container mx-auto px-4 py-6">
                  <Routes>
                    <Route path="/" element={<TaskListPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/tasks/new" element={<CreateTaskPage />} />
                    <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
