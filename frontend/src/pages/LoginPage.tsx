import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, Button, Input } from '../components/Form';

export default const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with:', { email, password });
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login...');
      await login(email, password);
      console.log('Login successful!');
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md card p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">TaskPulse</h1>
          <p className="text-gray-600 mt-2">Task Assignment & Real-Time Tracking</p>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="manager1@test.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password123"
            required
          />

          <button 
            type="submit" 
            disabled={loading} 
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: loading ? '#999' : '#2563eb',
              color: 'white',
              fontWeight: '600',
              borderRadius: '8px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              transition: 'background-color 0.2s',
              opacity: loading ? 0.5 : 1,
            }}
            onClick={(e) => {
              console.log('Button clicked! Event:', e);
            }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <hr className="my-6" />

        <div className="text-sm text-gray-600 space-y-2">
          <p className="font-semibold mb-3">Test Credentials:</p>
          <p><strong>Manager:</strong> manager1@test.com / password123</p>
          <p><strong>Employee:</strong> employee1@test.com / password123</p>
        </div>
      </div>
    </div>
  );
}
