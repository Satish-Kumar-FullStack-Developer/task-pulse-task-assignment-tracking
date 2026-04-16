import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { LogOut, Plus, LayoutDashboard, ListTodo } from 'lucide-react';
import { USER_ROLES } from '../constants';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
            T
          </div>
          <h1 className="text-xl font-bold">TaskPulse</h1>
        </div>

        <nav className="flex items-center gap-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ListTodo className="w-4 h-4" />
            Tasks
          </button>

          {user?.role === USER_ROLES.MANAGER && (
            <>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => navigate('/tasks/new')}
                className="flex items-center gap-2 btn btn-primary btn-sm"
              >
                <Plus className="w-4 h-4" />
                New Task
              </button>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <NotificationBell />

          <div className="text-sm">
            <p className="font-medium">{user?.name}</p>
            <p className="text-gray-600 text-xs">{user?.role}</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
