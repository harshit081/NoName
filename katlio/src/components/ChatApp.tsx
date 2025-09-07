'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import Sidebar from './Sidebar';
import ChatPanel from './ChatPanel';
import MobileHeader from './MobileHeader';
import GuestConversion from './GuestConversion';

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

interface Message {
  id: string;
  content: string;
  sender: string;
  roomId: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  readBy: Array<{ user: string; timestamp: Date }>;
}

interface ChatAppProps {
  user: User;
  token: string;
  onLogout: () => void;
}
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/';

export default function ChatApp({ user, token, onLogout }: ChatAppProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [currentRoomMessages, setCurrentRoomMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showGuestConversion, setShowGuestConversion] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentRoomRef = useRef<Room | null>(null);

  // Update ref whenever currentRoom changes
  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);
  
  
  const loadRooms = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}api/rooms`);
      if (response.ok) {
        const publicRooms = await response.json();
        setRooms(publicRooms);
        console.log('Loaded rooms:', publicRooms);
      } else {
        console.error('Failed to fetch rooms');
        setRooms([]);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      setRooms([]);
    }
  }, []);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setShowSidebar(window.innerWidth >= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Initialize socket connection
    console.log('Initializing socket connection...');
    const newSocket = io(API_URL);
    setSocket(newSocket);

    // Join with user data
    console.log('Emitting user-join with:', user);
    newSocket.emit('user-join', user);

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Add a catch-all listener to debug all events
    newSocket.onAny((eventName, ...args) => {
      console.log('Received socket event:', eventName, args);
    });

    newSocket.on('online-users', (users: User[]) => {
      console.log('Received online users:', users);
      setOnlineUsers(users);
    });

    newSocket.on('user-online', (userData: User) => {
      setOnlineUsers(prev => [...prev, userData]);
    });

    newSocket.on('user-offline', (username: string) => {
      setOnlineUsers(prev => prev.filter(u => u.username !== username));
    });

    newSocket.on('room-messages', (roomMessages: Message[]) => {
      console.log('Received room messages:', roomMessages);
      console.log('Number of room messages received:', roomMessages.length);
      setCurrentRoomMessages(roomMessages);
      
      // Also add to allMessages if they're not already there
      setAllMessages(prev => {
        const existingIds = new Set(prev.map(msg => msg.id));
        const newMessages = roomMessages.filter(msg => !existingIds.has(msg.id));
        return [...prev, ...newMessages];
      });
    });

    newSocket.on('new-message', (message: Message) => {
      console.log('Received new message:', message);
      const currentRoomId = currentRoomRef.current?.id;
      console.log('Current room ID (from ref):', currentRoomId);
      console.log('Message room ID:', message.roomId);
      console.log('Room match:', currentRoomId === message.roomId);
      
      setAllMessages(prev => [...prev, message]);
      
      // If it's for the current room, add to current room messages
      if (currentRoomId === message.roomId) {
        console.log('Adding message to current room messages');
        setCurrentRoomMessages(prev => {
          console.log('Previous current room messages:', prev.length);
          const newMessages = [...prev, message];
          console.log('New current room messages:', newMessages.length);
          return newMessages;
        });
      } else {
        console.log('Message not for current room, skipping');
      }
      
      // Update unread count for rooms that aren't currently active
      if (currentRoomId !== message.roomId) {
        setRooms(prev => prev.map(room => 
          room.id === message.roomId 
            ? { ...room, unreadCount: (room.unreadCount || 0) + 1 }
            : room
        ));
      }
    });

    newSocket.on('user-typing', ({ username, roomId }: { username: string; roomId: string }) => {
      if (currentRoom?.id === roomId) {
        setTypingUsers(prev => [...prev.filter(u => u !== username), username]);
      }
    });

    newSocket.on('user-stopped-typing', ({ username, roomId }: { username: string; roomId: string }) => {
      if (currentRoom?.id === roomId) {
        setTypingUsers(prev => prev.filter(u => u !== username));
      }
    });

    newSocket.on('message-read', ({ messageId, username }: { messageId: string; username: string }) => {
      setCurrentRoomMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              readBy: [...msg.readBy.filter(r => r.user !== username), { user: username, timestamp: new Date() }]
            }
          : msg
      ));
    });

    // Listen for room creation events
    newSocket.on('room-created', (room: Room) => {
      console.log('Room created via socket:', room);
      setRooms(prev => {
        // Check if room already exists to avoid duplicates
        if (prev.find(r => r.id === room.id)) {
          return prev;
        }
        return [...prev, room];
      });
    });

    // Load rooms
    loadRooms();

    return () => {
      newSocket.close();
    };
  }, [user.username, user.avatar, loadRooms]); // Include loadRooms dependency

  // Auto-join first room when socket and rooms are ready
  useEffect(() => {
    if (socket && socket.connected && rooms.length > 0 && !currentRoom) {
      const defaultRoom = rooms[0];
      console.log('Auto-joining default room after socket ready:', defaultRoom.id);
      setCurrentRoom(defaultRoom);
      setCurrentRoomMessages([]);
      
      setTimeout(() => {
        socket.emit('join-room', defaultRoom.id);
      }, 200);
    }
  }, [socket?.connected, rooms, currentRoom?.id, socket, user]);

  // Update current room messages when room changes
  useEffect(() => {
    if (currentRoom) {
      const roomMessages = allMessages.filter(msg => msg.roomId === currentRoom.id);
      console.log('Current room changed:', allMessages);
      console.log(`Room changed to ${currentRoom.id}`);
      console.log(`AllMessages count: ${allMessages.length}`);
      console.log(`Filtered messages for room: ${roomMessages.length}`);
      // Don't override if currentRoomMessages already has messages (from room-messages event)
      if (currentRoomMessages.length === 0 && roomMessages.length > 0) {
        setCurrentRoomMessages(roomMessages);
        console.log(`Updated currentRoomMessages with ${roomMessages.length} messages from allMessages`);
      }
    }
  }, [currentRoom, allMessages, currentRoomMessages.length]);

  const handleRoomSelect = (room: Room) => {
    if (socket && socket.connected && room.id !== currentRoom?.id) {
      console.log('Selecting room:', room);
      console.log('Socket connected:', socket.connected);
      setCurrentRoom(room);
      setCurrentRoomMessages([]); // Clear current room messages, will be populated by room-messages event
      
      // Add a small delay to ensure socket is ready
      setTimeout(() => {
        console.log('Emitting join-room for:', room.id);
        socket.emit('join-room', room.id);
      }, 100);
      
      // Clear unread count
      setRooms(prev => prev.map(r => 
        r.id === room.id ? { ...r, unreadCount: 0 } : r
      ));
      
      // Hide sidebar on mobile
      if (isMobile) {
        setShowSidebar(false);
      }
    }
  };

  const handleSendMessage = (content: string, type: 'text' | 'image' | 'file' = 'text', fileUrl?: string) => {
    if (socket && currentRoom && content.trim()) {
      const messageData = {
        content: content.trim(),
        sender: user.username,
        roomId: currentRoom.id,
        type,
        fileUrl
      };
      
      console.log('Sending message:', messageData);
      socket.emit('send-message', messageData);
    }
  };

  const handleCreateRoom = async (room: Room) => {
    try {
      // First, try to create the room via API
      const response = await fetch(`${API_URL}api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: room.name,
          type: room.type,
          participants: room.participants,
          createdBy: user.username
        }),
      });

      if (response.ok) {
        const createdRoom = await response.json();
        console.log('Room created via API:', createdRoom);
        
        // Add room to local state
        setRooms(prev => [...prev, createdRoom]);
        
        // If socket is connected, emit create-room event for real-time updates
        if (socket && socket.connected) {
          socket.emit('create-room', createdRoom);
        }
        
        // Automatically select the new room
        handleRoomSelect(createdRoom);
      } else {
        console.error('Failed to create room via API');
        // Fallback: just emit socket event
        if (socket && socket.connected) {
          socket.emit('create-room', room);
        }
      }
    } catch (error) {
      console.error('Error creating room:', error);
      // Fallback: just emit socket event
      if (socket && socket.connected) {
        socket.emit('create-room', room);
      }
    }
  };

  const handleCreateDM = async (targetUser: string) => {
    try {
      // Generate DM room ID
      const dmId = `dm-${[user.username, targetUser].sort().join('-')}`;
      
      // Check if DM room already exists
      const existingDM = rooms.find(room => room.id === dmId);
      if (existingDM) {
        handleRoomSelect(existingDM);
        return;
      }

      // Create DM via API
      const response = await fetch(`${API_URL}api/rooms/dm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participants: [user.username, targetUser]
        }),
      });

      if (response.ok) {
        const dmRoom = await response.json();
        console.log('DM created via API:', dmRoom);
        
        // Add DM room to local state
        setRooms(prev => [...prev, dmRoom]);
        
        // If socket is connected, emit create-room event for real-time updates
        if (socket && socket.connected) {
          socket.emit('create-room', dmRoom);
        }
        
        // Automatically select the new DM
        handleRoomSelect(dmRoom);
      } else {
        console.error('Failed to create DM via API');
        // Fallback: create local DM room
        const dmRoom: Room = {
          id: dmId,
          name: targetUser,
          type: 'private',
          participants: [user.username, targetUser]
        };
        setRooms(prev => [...prev, dmRoom]);
        handleRoomSelect(dmRoom);
      }
    } catch (error) {
      console.error('Error creating DM:', error);
      // Fallback: create local DM room
      const dmId = `dm-${[user.username, targetUser].sort().join('-')}`;
      const dmRoom: Room = {
        id: dmId,
        name: targetUser,
        type: 'private',
        participants: [user.username, targetUser]
      };
      setRooms(prev => [...prev, dmRoom]);
      handleRoomSelect(dmRoom);
    }
  };

  const handleGuestConversionSuccess = () => {
    // Update user in parent component
    window.location.reload(); // Simple approach - reload to update everything
  };

  const handleTyping = (isTyping: boolean) => {
    if (socket && currentRoom) {
      if (isTyping) {
        socket.emit('typing-start', { username: user.username, roomId: currentRoom.id });
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set timeout to stop typing after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('typing-stop', { username: user.username, roomId: currentRoom.id });
        }, 3000);
      } else {
        socket.emit('typing-stop', { username: user.username, roomId: currentRoom.id });
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader
          currentRoom={currentRoom}
          onMenuClick={() => setShowSidebar(!showSidebar)}
          onlineCount={onlineUsers.length}
        />
      )}
      
      {/* Sidebar */}
      <div className={`${
        isMobile 
          ? `fixed inset-y-0 left-0 z-50 transform ${showSidebar ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`
          : 'relative'
      } ${isMobile ? 'w-full' : 'w-80'} bg-gray-800 border-r border-gray-700`}>
        <Sidebar
          user={user}
          rooms={rooms}
          currentRoom={currentRoom}
          onlineUsers={onlineUsers}
          onRoomSelect={handleRoomSelect}
          onCreateRoom={handleCreateRoom}
          onCreateDM={handleCreateDM}
          onLogout={onLogout}
          onShowGuestConversion={() => setShowGuestConversion(true)}
          isMobile={isMobile}
          onClose={() => setShowSidebar(false)}
        />
      </div>

      {/* Overlay for mobile */}
      {isMobile && showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowSidebar(false)}
        />
      )}
      
      {/* Chat Panel */}
      <div className={`flex-1 flex flex-col ${isMobile ? 'mt-16' : ''}`}>
        {currentRoom ? (
          <ChatPanel
            room={currentRoom}
            messages={currentRoomMessages}
            user={user}
            typingUsers={typingUsers}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            socket={socket}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Welcome to Katlio</h2>
              <p className="text-gray-400">Select a room to start chatting</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Guest Conversion Modal */}
      {showGuestConversion && user.isGuest && (
        <GuestConversion
          user={user}
          token={token}
          onConversionSuccess={handleGuestConversionSuccess}
          onClose={() => setShowGuestConversion(false)}
        />
      )}
    </div>
  );
}
