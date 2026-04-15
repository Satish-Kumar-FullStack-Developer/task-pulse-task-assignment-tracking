import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createTask, getEmployees } from '../utils/api';
import { Alert, Button, Input, Select, Textarea } from '../components/Form';
import { ChevronLeft } from 'lucide-react';

export default const CreateTaskPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingEmployees, setFetchingEmployees] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await getEmployees();
      setEmployees(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load employees');
    } finally {
      setFetchingEmployees(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    if (!assigneeId) {
      setError('Please select an employee to assign this task');
      return;
    }

    setLoading(true);

    try {
      await createTask({
        title,
        description,
        assigneeId,
        dueDate,
        priority,
      });

      navigate('/');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create task';
      if (err.response?.status === 403) {
        setError('Only managers can create tasks. Please contact your manager.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6">
        <ChevronLeft className="w-4 h-4" />
        Back to Tasks
      </button>

      <div className="max-w-2xl card p-8">
        <h1 className="text-3xl font-bold mb-6">Create New Task</h1>

        {error && <Alert type="error" className="mb-6">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Task Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            required
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the task in detail..."
          />

          <Select
            label="Assign To"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            options={[
              { value: '', label: 'Select an employee...' },
              ...employees.map((emp) => ({
                value: emp.id,
                label: `${emp.name} (${emp.email})`,
              })),
            ]}
            required
            disabled={fetchingEmployees || loading}
          />

          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={[
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'CRITICAL', label: 'Critical' },
            ]}
          />

          <div className="flex gap-4 pt-4">
            <Button variant="primary" type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/')} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
