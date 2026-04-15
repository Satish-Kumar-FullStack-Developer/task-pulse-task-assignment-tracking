import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTasks } from '../utils/api';
import { Task } from '../utils/api';
import { formatDate, getStatusColor, getPriorityColor, isOverdue } from '../utils/formatters';
import { Alert, Badge, Button } from '../components/Form';
import { AlertCircle } from 'lucide-react';

export default const TaskListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await getTasks();
      setTasks(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'overdue') {
      return isOverdue(task.dueDate) && ['PENDING', 'IN_PROGRESS'].includes(task.status);
    }
    if (filter !== 'all') {
      return task.status === filter;
    }
    return true;
  });

  if (loading) {
    return <div className="text-center py-12">Loading tasks...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {user?.role === 'MANAGER' ? 'All Tasks' : 'My Tasks'}
        </h1>
        {user?.role === 'MANAGER' && (
          <Button variant="primary" onClick={() => navigate('/tasks/new')}>
            New Task
          </Button>
        )}
      </div>

      {error && <Alert type="error" className="mb-6">{error}</Alert>}

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {['all', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'overdue'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : f === 'overdue' ? 'Overdue' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tasks Table */}
      {filteredTasks.length === 0 ? (
        <Alert type="info">No tasks found</Alert>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold">Title</th>
                {user?.role === 'MANAGER' && (
                  <th className="text-left px-6 py-3 text-sm font-semibold">Assignee</th>
                )}
                <th className="text-left px-6 py-3 text-sm font-semibold">Status</th>
                <th className="text-left px-6 py-3 text-sm font-semibold">Priority</th>
                <th className="text-left px-6 py-3 text-sm font-semibold">Due Date</th>
                <th className="text-left px-6 py-3 text-sm font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    isOverdue(task.dueDate) && ['PENDING', 'IN_PROGRESS'].includes(task.status)
                      ? 'bg-red-50'
                      : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-600">{task.description?.substring(0, 50)}</p>
                    </div>
                  </td>
                  {user?.role === 'MANAGER' && (
                    <td className="px-6 py-4 text-sm">{task.assignee.name}</td>
                  )}
                  <td className="px-6 py-4">
                    <Badge color={getStatusColor(task.status).split(' ')[0].replace('bg-', '')}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge color={getPriorityColor(task.priority).split(' ')[0].replace('bg-', '')}>
                      {task.priority}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {task.dueDate ? (
                      <div className="flex items-center gap-1">
                        {isOverdue(task.dueDate) && (
                          <AlertCircle className="w-4 h-4 text-danger-600" />
                        )}
                        {formatDate(task.dueDate)}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
