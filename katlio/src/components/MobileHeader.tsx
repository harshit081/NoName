'use client';

import { Menu, Users } from './Icons';

interface Room {
  id: string;
  name: string;
  type: 'public' | 'private' | 'group';
  participants: string[];
}

interface MobileHeaderProps {
  currentRoom: Room | null;
  onMenuClick: () => void;
  onlineCount: number;
}

export default function MobileHeader({ 
  currentRoom, 
  onMenuClick, 
  onlineCount 
}: MobileHeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 bg-gray-800 border-b border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuClick}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {currentRoom && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                {currentRoom.type === 'public' ? (
                  <span className="text-white font-medium text-sm">#</span>
                ) : (
                  <img
                    src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`}
                    alt={currentRoom.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                )}
              </div>
              <div>
                <h3 className="text-white font-medium">{currentRoom.name}</h3>
                <p className="text-gray-400 text-xs">
                  {currentRoom.type === 'public' ? 'Public room' : 'Private chat'}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-gray-400">
            <Users className="w-4 h-4" />
            <span className="text-sm">{onlineCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
