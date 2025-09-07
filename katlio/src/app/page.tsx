'use client';

import { useState, useEffect } from 'react';
import ChatApp from '@/components/ChatApp';
import Auth from '@/components/Auth';

interface User {
  id: string;
  username: string;
  email?: string;
  avatar: string;
  isGuest: boolean;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/';

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await fetch(`${API_URL}api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(tokenToVerify);
      } else {
        // Token invalid, clear localStorage
        localStorage.removeItem('katlio_user');
        localStorage.removeItem('katlio_token');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('katlio_user');
      localStorage.removeItem('katlio_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user data and token exist in localStorage
    const savedUser = localStorage.getItem('katlio_user');
    const savedToken = localStorage.getItem('katlio_token');

    if (savedUser && savedToken) {
      // Verify token with backend
      verifyToken(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const handleAuth = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch(`${API_URL}api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('katlio_user');
      localStorage.removeItem('katlio_token');
      setUser(null);
      setToken(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">K</span>
          </div>
          <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-white mt-4">Loading Katlio...</p>
        </div>
      </div>
    );
  }

  if (!user || !token) {
    return <Auth onAuth={handleAuth} />;
  }

  return <ChatApp user={user} token={token} onLogout={handleLogout} />;
}
