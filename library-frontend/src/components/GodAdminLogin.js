import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const GodAdminLogin = () => {
  const { masterLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@library.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('Attempting master login with:', email); // Debug log
    const res = await masterLogin(email, password);
    console.log('Master login result:', res); // Debug log
    
    setLoading(false);
    if (!res.success) {
      setError(res.error);
      console.error('Master login failed:', res.error); // Debug log
    } else {
      console.log('Master login successful, redirecting to /master-admin'); // Debug log
      navigate('/master-admin');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Master Admin Login</h1>
        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full border rounded px-3 py-2" placeholder="admin@library.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-1 w-full border rounded px-3 py-2" placeholder="••••••••" />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GodAdminLogin;


