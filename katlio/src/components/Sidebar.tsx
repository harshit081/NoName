'use client';

import { useState } from 'react';
import { Hash, Plus, X, Moon, Sun, Settings } from './Icons';

interface User {
  id: string;
  username: string;
  email?: string;
  avatar: string;
  isGuest: boolean;
}

interface Room {
  id: string;
  name: string;
  type: 'public' | 'private' | 'group';
  participants: string[];
  unreadCount?: number;
}

interface SidebarProps {
  user: User;
  rooms: Room[];
  currentRoom: Room | null;
  onlineUsers: User[];
  onRoomSelect: (room: Room) => void;
  onCreateRoom: (room: Room) => void;
  onCreateDM: (targetUser: string) => void;
  onLogout: () => void;
  isMobile: boolean;
  onClose: () => void;
}

export default function Sidebar({
  user,
  rooms,
  currentRoom,
  onlineUsers,
  onRoomSelect,
  onCreateRoom,
  onCreateDM,
  onLogout,
  isMobile,
  onClose
}: SidebarProps) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const handleCreateRoom = () => {
    if (newRoomName.trim()) {
      const newRoom: Room = {
        id: `room-${Date.now()}`,
        name: newRoomName.trim(),
        type: 'public',
        participants: [user.username]
      };
      
      onCreateRoom(newRoom);
      setNewRoomName('');
      setShowCreateRoom(false);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Katlio</h1>
              <p className="text-gray-400 text-sm">{onlineUsers.length} online</p>
            </div>
          </div>
          
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <img
            src={user.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face`}
            alt={user.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <p className="text-white font-medium">{user.username}</p>
            <p className="text-green-400 text-sm flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Online {user.isGuest && '(Guest)'}
            </p>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button 
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-red-400 hover:text-red-300 transition-colors"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Guest Banner */}
        {user.isGuest && (
          <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-400 text-xs">
              💡 You're browsing as a guest. <span className="underline cursor-pointer">Create an account</span> to save your data!
            </p>
          </div>
        )}
      </div>

      {/* Rooms Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* Public Rooms */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">
                Public Rooms
              </h3>
              <button
                onClick={() => setShowCreateRoom(true)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {/* Create Room Form */}
            {showCreateRoom && (
              <div className="mb-3 p-3 bg-gray-700 rounded-lg">
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Room name"
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateRoom}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateRoom(false);
                      setNewRoomName('');
                    }}
                    className="px-3 py-1 bg-gray-600 text-gray-300 rounded text-sm hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            <div className="space-y-1">
              {rooms.filter(room => room.type === 'public').map((room) => (
                <button
                  key={room.id}
                  onClick={() => onRoomSelect(room)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentRoom?.id === room.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Hash className="w-5 h-5 text-gray-400" />
                    <span className="flex-1 font-medium">{room.name}</span>
                    {room.unreadCount && room.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                        {room.unreadCount > 99 ? '99+' : room.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Direct Messages */}
          <div className="mb-6">
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-3">
              Direct Messages
            </h3>
            <div className="space-y-1">
              {onlineUsers.filter(u => u.username !== user.username).map((onlineUser) => (
                <button
                  key={onlineUser.username}
                  onClick={() => {
                    // Use the new DM creation handler
                    onCreateDM(onlineUser.username);
                  }}
                  className="w-full text-left p-3 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={onlineUser.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`}
                        alt={onlineUser.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-gray-800 rounded-full"></div>
                    </div>
                    <span className="flex-1 font-medium">{onlineUser.username}</span>
                  </div>
                </button>
              ))}
              
              {onlineUsers.filter(u => u.username !== user.username).length === 0 && (
                <p className="text-gray-500 text-sm italic p-3">No other users online</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-center">
          <p className="text-gray-500 text-xs">
            Katlio Chat v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
