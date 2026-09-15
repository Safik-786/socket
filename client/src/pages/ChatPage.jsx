import React, { useState } from 'react';
import { SocketProvider } from '../contexts/SocketContext';
import { loginUser } from '../services/api';
import GroupDashboard from '../components/chat/GroupDashboard';

export default function ChatPage() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setIsLoading(true);
    try {
      const data = await loginUser(username);
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Failed to login. Make sure the backend server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (user && token) {
    return (
      <SocketProvider token={token}>
        <GroupDashboard user={user} onLogout={handleLogout} />
      </SocketProvider>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-surface p-8 rounded-2xl shadow-xl w-full max-w-md border border-primary-200">
        <h1 className="text-3xl font-bold text-center text-primary-900 mb-8">Login</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-primary-800 mb-2">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-background border border-primary-300 text-primary-900 focus:bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
              placeholder="Enter your username"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-surface font-semibold py-3 px-4 rounded-lg transition-colors shadow-md disabled:opacity-70"
          >
            {isLoading ? 'Connecting...' : 'Login & Chat'}
          </button>
        </form>
      </div>
    </div>
  );
}
