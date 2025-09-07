'use client';

import { useState, useEffect } from 'react';
import ChatApp from '@/components/ChatApp';
import UserSetup from '@/components/UserSetup';

interface User {
  username: string;
  avatar: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user data exists in localStorage
    const savedUser = localStorage.getItem('katlio-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleUserSetup = (userData: User) => {
    localStorage.setItem('katlio-user', JSON.stringify(userData));
    setUser(userData);
  };

  if (!user) {
    return <UserSetup onUserSetup={handleUserSetup} />;
  }

  return <ChatApp user={user} />;
}
