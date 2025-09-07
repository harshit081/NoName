'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Send, Paperclip, Smile, MoreVertical } from './Icons';
import { Socket } from 'socket.io-client';

interface User {
  username: string;
  avatar: string;
}

interface Room {
  id: string;
  name: string;
  type: 'public' | 'private' | 'group';
  participants: string[];
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

interface ChatPanelProps {
  room: Room;
  messages: Message[];
  user: User;
  typingUsers: string[];
  onSendMessage: (content: string, type?: 'text' | 'image' | 'file', fileUrl?: string) => void;
  onTyping: (isTyping: boolean) => void;
  socket: Socket | null;
}

export default function ChatPanel({
  room,
  messages,
  user,
  typingUsers,
  onSendMessage,
  onTyping
}: ChatPanelProps) {
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/';

  // Helper function to get full image URL
  const getImageUrl = (fileUrl: string) => {
    if (fileUrl.startsWith('http')) {
      return fileUrl; // Already a full URL
    }
    // Construct the backend base URL for static files
    const backendBase = 'http://localhost:5000';
    // Ensure fileUrl starts with / for proper URL construction
    const cleanFileUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    return `${backendBase}${cleanFileUrl}`;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      onSendMessage(messageInput);
      setMessageInput('');
      handleTypingStop();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      onTyping(true);
    }
    
    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 1000);
  };

  const handleTypingStop = () => {
    if (isTyping) {
      setIsTyping(false);
      onTyping(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BACKEND_URL}api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { fileUrl, filename } = await response.json();
        const fileType = file.type.startsWith('image/') ? 'image' : 'file';
        // Send the relative fileUrl, it will be converted to full URL when displaying
        onSendMessage(filename, fileType, fileUrl);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (timestamp: Date) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isOwnMessage = message.sender === user.username;
    const showAvatar = index === 0 || messages[index - 1]?.sender !== message.sender;
    const showDate = index === 0 || 
      new Date(message.timestamp).toDateString() !== new Date(messages[index - 1]?.timestamp).toDateString();

    return (
      <div key={message.id}>
        {showDate && (
          <div className="flex justify-center my-4">
            <span className="bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-3 py-1 rounded-full transition-colors duration-200">
              {formatDate(message.timestamp)}
            </span>
          </div>
        )}
        
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}>
          <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
            {!isOwnMessage && showAvatar && (
              <Image
                src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`}
                alt={message.sender}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover mt-1"
              />
            )}
            
            <div className={`${isOwnMessage ? 'mr-2' : 'ml-2'} ${!showAvatar && !isOwnMessage ? 'ml-10' : ''}`}>
              {!isOwnMessage && showAvatar && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{message.sender}</p>
              )}
              
              <div className={`p-3 rounded-lg ${
                isOwnMessage 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              }`}>
                {message.type === 'image' && message.fileUrl ? (
                  <div>
                    <Image
                      src={getImageUrl(message.fileUrl)}
                      alt="Shared image"
                      width={300}
                      height={300}
                      className="max-w-full h-auto rounded mb-2"
                      style={{ maxHeight: '300px' }}
                    />
                    {message.content && <p>{message.content}</p>}
                  </div>
                ) : message.type === 'file' && message.fileUrl ? (
                  <div className="flex items-center space-x-2">
                    <Paperclip className="w-4 h-4" />
                    <a
                      href={message.fileUrl}
                      download
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {message.content}
                    </a>
                  </div>
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
              
              <div className={`flex items-center mt-1 text-xs text-gray-500 dark:text-gray-500 ${
                isOwnMessage ? 'justify-end' : 'justify-start'
              }`}>
                <span>{formatTime(message.timestamp)}</span>
                {isOwnMessage && message.readBy.length > 0 && (
                  <span className="ml-2 text-green-400">✓</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-200 dark:bg-gray-800 p-4 border-b border-gray-300 dark:border-gray-700 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center transition-colors duration-200">
              {room.type === 'public' ? (
                <span className="text-gray-900 dark:text-white font-medium">#</span>
              ) : (
                <Image
                  src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face`}
                  alt={room.name}
                  width={40}
                  height={40}
                  className="w-full h-full rounded-full object-cover"
                />
              )}
            </div>
            <div>
              <h2 className="text-gray-900 dark:text-white font-medium text-lg">{room.name}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {room.type === 'public' ? 'Public room' : 'Private conversation'}
              </p>
            </div>
          </div>
          
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-900 transition-colors duration-200">
        <div className="space-y-1">
          {messages.map((message, index) => renderMessage(message, index))}
          
          {typingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-gray-300 dark:bg-gray-700 p-3 rounded-lg max-w-xs transition-colors duration-200">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 transition-colors duration-200">
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 border-t border-gray-300 dark:border-gray-700 transition-colors duration-200">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,*"
          />
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              placeholder={`Message ${room.name}`}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              maxLength={1000}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>
          
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
