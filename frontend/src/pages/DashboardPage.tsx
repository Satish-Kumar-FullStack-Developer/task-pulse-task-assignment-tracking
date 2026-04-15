import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Alert } from '../components/Form';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/tasks/manager/stats');
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  if (!stats) {
    return <Alert type="error">Failed to load dashboard data</Alert>;
  }

  const statusData = [
    { name: 'Pending', value: stats.pending, color: '#9CA3AF' },
    { name: 'In Progress', value: stats.inProgress, color: '#3B82F6' },
    { name: 'Completed', value: stats.completed, color: '#FBBF24' },
    { name: 'Approved', value: stats.approved, color: '#22C55E' },
    { name: 'Returned', value: stats.returned, color: '#EF4444' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="card p-6">
          <p className="text-gray-600 text-sm">Total Tasks</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="card p-6">
          <p className="text-gray-600 text-sm">Pending</p>
          <p className="text-3xl font-bold text-gray-600">{stats.pending}</p>
        </div>
        <div className="card p-6">
          <p className="text-gray-600 text-sm">In Progress</p>
          <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="card p-6">
          <p className="text-gray-600 text-sm">Completed</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.completed}</p>
        </div>
        <div className="card p-6 border-danger-200">
          <p className="text-gray-600 text-sm">Overdue</p>
          <p className="text-3xl font-bold text-danger-600">{stats.overdue}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Task Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Task Count by Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
