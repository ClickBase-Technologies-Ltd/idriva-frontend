'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  profile_picture?: string;
  lastSeen?: string;
  unread_count?: number;
  last_message?: string;
  last_message_time?: string;
  title?: string;
  lastMessageSenderId?: string;
}

interface ChatComponentProps {
  currentUser: {
    id: string;
    firstName: string;
    lastName: string;
    profile_picture?: string;
    title?: string;
  };
  isOpen?: boolean;
  onClose?: () => void;
  initialReceiver?: ChatUser | null;
}

// Component for individual chat window
const ChatWindow: React.FC<{
  user: ChatUser;
  currentUser: ChatComponentProps['currentUser'];
  onClose: () => void;
  onNewMessage: (userId: string, message: string, timestamp: string) => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  position: number;
  isMobile?: boolean;
}> = ({ user, currentUser, onClose, onNewMessage, isMinimized, onToggleMinimize, position, isMobile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [user.id]);

  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom();
    }
  }, [messages, isMinimized]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/chat/messages/${user.id}`);
      if (response.status === 200) {
        const messagesData = response.data.messages || response.data;
        const sortedMessages = messagesData.sort((a: ChatMessage, b: ChatMessage) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        setMessages(sortedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      senderId: currentUser.id,
      receiverId: user.id,
      message: newMessage,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    setMessages(prev => [...prev, tempMessage]);
    const messageToSend = newMessage;
    setNewMessage('');

    try {
      const response = await api.post('/chat/send', {
        receiverId: user.id,
        message: messageToSend
      });

      if (response.status === 201 || response.status === 200) {
        const savedMessage = response.data.message || response.data;
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id ? savedMessage : msg
        ));
        onNewMessage(user.id, newMessage, savedMessage.timestamp);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      if (isToday) {
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }).toLowerCase();
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }
    } catch (e) {
      console.error('Error formatting message time:', e);
      return '';
    }
  };

  if (isMinimized) {
    return (
      <div 
        className={`fixed ${isMobile ? 'bottom-20 left-2 right-2' : 'bottom-16 right-4'} z-60 ${
          isMobile ? 'w-[calc(100%-1rem)]' : 'w-64'
        } bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 overflow-hidden`}
        style={!isMobile ? { right: `${20 + (position * 20)}px` } : {}}
      >
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={user.profile_picture || '/avatar.png'}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-sm font-medium truncate">
              {user.firstName}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={onToggleMinimize}
              className="p-0.5 hover:bg-blue-700 rounded"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-0.5 hover:bg-blue-700 rounded"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`fixed ${isMobile ? 'bottom-20 left-2 right-2' : 'bottom-16 right-4'} z-60 ${
        isMobile ? 'h-[70vh] w-[calc(100%-1rem)]' : 'w-80 h-96'
      } bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 flex flex-col`}
      style={!isMobile ? { right: `${20 + (position * 20)}px` } : {}}
    >
      {/* Chat Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img
            src={user.profile_picture || '/avatar.png'}
            alt={`${user.firstName} ${user.lastName}`}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div>
            <div className="font-semibold text-gray-900 dark:text-white text-sm">
              {user.firstName} {user.lastName}
            </div>
            {user.title && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {user.title}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onToggleMinimize}
            className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-800/50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map(message => {
            const isOwnMessage = message.senderId === currentUser.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  isOwnMessage
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                }`}>
                  <div className="text-sm break-words">{message.message}</div>
                  <div className={`text-xs mt-1 ${
                    isOwnMessage ? 'text-blue-200 text-right' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {formatMessageTime(message.timestamp)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`px-3 py-2 text-sm rounded-full transition-colors ${
              newMessage.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

const ChatComponent: React.FC<ChatComponentProps> = ({ 
  currentUser, 
  isOpen = true,
  onClose,
  initialReceiver = null
}) => {
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [openChats, setOpenChats] = useState<{user: ChatUser, isMinimized: boolean}[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showUserList, setShowUserList] = useState(true);
  const [selectedUserForMobile, setSelectedUserForMobile] = useState<ChatUser | null>(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-open initial receiver if provided
  useEffect(() => {
    if (initialReceiver && isOpen) {
      handleUserClick(initialReceiver);
    }
  }, [initialReceiver, isOpen]);

  // Fetch chat users
  useEffect(() => {
    const fetchChatUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await api.get('/chat/users');
        if (response.status === 200) {
          const users = response.data.users || response.data;
          
          // Sort by last message time (most recent first) or alphabetically
          const sortedUsers = users.sort((a: ChatUser, b: ChatUser) => {
            const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
            const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
            
            // If both have messages, sort by most recent
            if (timeA > 0 && timeB > 0) {
              return timeB - timeA;
            }
            
            // If only one has messages, put it first
            if (timeA > 0) return -1;
            if (timeB > 0) return 1;
            
            // Otherwise sort alphabetically by first name
            return a.firstName.localeCompare(b.firstName);
          });
          
          setChatUsers(sortedUsers);
        }
      } catch (error) {
        console.error('Error fetching chat users:', error);
        setError('Failed to load chat users');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchChatUsers();
  }, []);

  const handleUserClick = (user: ChatUser) => {
    // On mobile, show chat view instead of user list
    if (isMobile) {
      setSelectedUserForMobile(user);
      setShowUserList(false);
    }
    
    // Check if chat is already open
    const existingChatIndex = openChats.findIndex(chat => chat.user.id === user.id);
    
    if (existingChatIndex >= 0) {
      // Chat exists, bring it to front and maximize it
      const updatedChats = [...openChats];
      updatedChats[existingChatIndex].isMinimized = false;
      // Move to end (front) of array
      const [chat] = updatedChats.splice(existingChatIndex, 1);
      updatedChats.push(chat);
      setOpenChats(updatedChats);
    } else {
      // Open new chat (automatically pops out)
      setOpenChats(prev => [...prev, { user, isMinimized: false }]);
    }
  };

  const handleCloseChat = (userId: string) => {
    setOpenChats(prev => prev.filter(chat => chat.user.id !== userId));
  };

  const handleToggleMinimize = (userId: string) => {
    setOpenChats(prev => prev.map(chat => 
      chat.user.id === userId ? { ...chat, isMinimized: !chat.isMinimized } : chat
    ));
  };

  const handleNewMessage = (userId: string, message: string, timestamp: string) => {
    // Update user's last message in the list
    setChatUsers(prev => prev.map(user => 
      user.id === userId 
        ? { 
            ...user, 
            last_message: message,
            last_message_time: timestamp,
            unread_count: user.id !== userId ? (user.unread_count || 0) + 1 : 0
          }
        : user
    ));
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    
    try {
      // Handle different timestamp formats
      let date: Date;
      
      // Try parsing as ISO string first
      date = new Date(timestamp);
      
      // If invalid, try parsing as other formats
      if (isNaN(date.getTime())) {
        // Try removing any timezone adjustments
        const cleanedTimestamp = timestamp.replace(/\s*\(.*\)$/, '');
        date = new Date(cleanedTimestamp);
      }
      
      // If still invalid, return empty string
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', timestamp);
        return '';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
      if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d`;
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      console.error('Error formatting time:', e, 'Timestamp:', timestamp);
      return '';
    }
  };

  // Filter users based on search
  const filteredUsers = chatUsers.filter(user => {
    if (!searchQuery.trim()) return true;
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  if (!isOpen) return null;

  // Mobile layout - Single view (either user list or chat)
  if (isMobile) {
    return (
      <>
        {/* Mobile Chat Container */}
        <div className="fixed inset-0 z-50 bg-white dark:bg-gray-800 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {showUserList ? (
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Messages
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {filteredUsers.length} conversations
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => {
                    setShowUserList(true);
                    setSelectedUserForMobile(null);
                  }}
                  className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center space-x-2">
                  <img
                    src={selectedUserForMobile?.profile_picture || '/avatar.png'}
                    alt={`${selectedUserForMobile?.firstName} ${selectedUserForMobile?.lastName}`}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                      {selectedUserForMobile?.firstName} {selectedUserForMobile?.lastName}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {showUserList ? (
              <>
                {/* Search Bar */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search conversations..."
                      className="w-full px-4 py-2.5 pl-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Users List */}
                <div className="h-full overflow-y-auto">
                  {loadingUsers ? (
                    <div className="flex flex-col items-center justify-center h-full p-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Loading conversations...</p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {searchQuery ? 'No matches found' : 'No conversations yet'}
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
                        {searchQuery ? 'Try searching with different keywords' : 'Start connecting with others'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredUsers.map(user => (
                        <button
                          key={user.id}
                          onClick={() => handleUserClick(user)}
                          className="w-full p-4 text-left transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <div className="flex items-start space-x-3">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              <img
                                src={user.profile_picture || '/avatar.png'}
                                alt={`${user.firstName} ${user.lastName}`}
                                className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-800"
                              />
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <div>
                                  <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                    {user.firstName} {user.lastName}
                                  </div>
                                  {user.title && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                      {user.title}
                                    </div>
                                  )}
                                </div>
                                {user.last_message_time && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                                    {formatTime(user.last_message_time)}
                                  </span>
                                )}
                              </div>
                              
                              {/* Last Message Preview */}
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {user.last_message ? (
                                    user.last_message.length > 40 
                                      ? `${user.last_message.substring(0, 40)}...` 
                                      : user.last_message
                                  ) : 'Start conversation'}
                                </p>
                                {(user.unread_count && user.unread_count > 0) && (
                                  <span className="bg-blue-600 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                    {user.unread_count > 9 ? '9+' : user.unread_count}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : selectedUserForMobile && (
              // Mobile Chat View
              <div className="h-full flex flex-col">
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-800/50">
                  {/* Fetch messages for selected user */}
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
                    Loading messages...
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-full">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pop-out chat windows for mobile (minimized state only) */}
        {openChats.filter(chat => chat.isMinimized).map((chat, index) => (
          <ChatWindow
            key={chat.user.id}
            user={chat.user}
            currentUser={currentUser}
            onClose={() => handleCloseChat(chat.user.id)}
            onNewMessage={handleNewMessage}
            isMinimized={chat.isMinimized}
            onToggleMinimize={() => handleToggleMinimize(chat.user.id)}
            position={index}
            isMobile={true}
          />
        ))}
      </>
    );
  }

  // Desktop layout
  return (
    <>
      {/* Main Chat Window */}
      <div className="fixed bottom-4 right-4 z-50 w-[400px] h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col border border-gray-300 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Messages
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {filteredUsers.length} contacts • {openChats.length} open
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full px-4 py-2.5 pl-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-400"
              />
              <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Users List */}
          <div className="h-full overflow-y-auto">
            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center h-full p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading conversations...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchQuery ? 'No matches found' : 'No contacts yet'}
                </h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
                  {searchQuery ? 'Try searching with different keywords' : 'Start connecting with others'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUsers.map(user => {
                  const isChatOpen = openChats.some(chat => chat.user.id === user.id);
                  
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleUserClick(user)}
                      className={`w-full p-4 text-left transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                        isChatOpen ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <img
                            src={user.profile_picture || '/avatar.png'}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-800"
                          />
                          {isChatOpen && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white dark:border-gray-800" />
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                {user.firstName} {user.lastName}
                              </div>
                              {user.title && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                  {user.title}
                                </div>
                              )}
                            </div>
                            {user.last_message_time && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                                {formatTime(user.last_message_time)}
                              </span>
                            )}
                          </div>
                          
                          {/* Last Message Preview */}
                          <div className="flex items-center justify-between mt-2">
                            <p className={`text-sm truncate ${
                              user.unread_count && user.unread_count > 0
                                ? 'text-gray-900 dark:text-white font-medium'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {user.last_message ? (
                                user.last_message.length > 40 
                                  ? `${user.last_message.substring(0, 40)}...` 
                                  : user.last_message
                              ) : 'Click to start chatting'}
                            </p>
                            {(user.unread_count && user.unread_count > 0) && (
                              <span className="bg-blue-600 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                {user.unread_count > 9 ? '9+' : user.unread_count}
                              </span>
                            )}
                          </div>
                          
                          {/* Chat Status Indicator */}
                          {isChatOpen && (
                            <div className="mt-2 flex items-center">
                              <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mr-1.5 animate-pulse"></div>
                                Chat is open
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Open Chats Indicator */}
        {openChats.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {openChats.length} chat{openChats.length !== 1 ? 's' : ''} open
                </span>
                <div className="flex -space-x-1">
                  {openChats.slice(0, 3).map((chat, index) => (
                    <div key={chat.user.id} className="w-4 h-4 rounded-full border border-white dark:border-gray-800 overflow-hidden">
                      <img
                        src={chat.user.profile_picture || '/avatar.png'}
                        alt={chat.user.firstName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {openChats.length > 3 && (
                    <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 border border-white dark:border-gray-800 flex items-center justify-center">
                      <span className="text-[8px] text-gray-600 dark:text-gray-400">+{openChats.length - 3}</span>
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setOpenChats([])}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Close all
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Individual Chat Windows - Fixed positioning */}
      {openChats.map((chat, index) => (
        <ChatWindow
          key={chat.user.id}
          user={chat.user}
          currentUser={currentUser}
          onClose={() => handleCloseChat(chat.user.id)}
          onNewMessage={handleNewMessage}
          isMinimized={chat.isMinimized}
          onToggleMinimize={() => handleToggleMinimize(chat.user.id)}
          position={index}
          isMobile={false}
        />
      ))}
    </>
  );
};

export default ChatComponent;