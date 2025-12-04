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
}

interface ChatComponentProps {
  currentUser: {
    id: string;
    firstName: string;
    lastName: string;
    profile_picture?: string;
  };
  isOpen?: boolean;
  onClose?: () => void;
  initialReceiver?: ChatUser | null;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ 
  currentUser, 
  isOpen = true,
  onClose,
  initialReceiver = null
}) => {
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(initialReceiver);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch chat users
  useEffect(() => {
    const fetchChatUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await api.get('/chat/users');
        if (response.status === 200) {
          setChatUsers(response.data.users || response.data);
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

  // Fetch messages when a user is selected
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/chat/messages/${selectedUser.id}`);
        if (response.status === 200) {
          setMessages(response.data.messages || response.data);
          // Mark messages as read when opening chat
          if (selectedUser.unread_count && selectedUser.unread_count > 0) {
            setChatUsers(prev => prev.map(user => 
              user.id === selectedUser.id ? { ...user, unread_count: 0 } : user
            ));
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedUser]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      message: newMessage,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    setMessages(prev => [...prev, tempMessage]);
    const messageToSend = newMessage;
    setNewMessage('');

    try {
      const response = await api.post('/chat/send', {
        receiverId: selectedUser.id,
        message: messageToSend
      });

      if (response.status === 201 || response.status === 200) {
        const savedMessage = response.data.message || response.data;
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id ? savedMessage : msg
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return '';
    }
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (e) {
      return '';
    }
  };

  const isUserOnline = (lastSeen?: string) => {
    if (!lastSeen) return false;
    try {
      const lastSeenDate = new Date(lastSeen);
      const now = new Date();
      const diffMs = now.getTime() - lastSeenDate.getTime();
      return diffMs < 300000; // 5 minutes
    } catch (e) {
      return false;
    }
  };

  // Filter users based on search
  const filteredUsers = chatUsers.filter(user => {
    if (!searchQuery.trim()) return true;
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[400px] h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Messages
          </h3>
          {selectedUser && (
            <div className="flex items-center space-x-2 ml-2">
              <span className="text-gray-400">•</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {selectedUser.firstName}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Users List - Simple and Clean */}
        <div className={`w-2/5 border-r border-gray-200 dark:border-gray-700 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full px-3 py-2 pl-9 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white text-sm"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto">
            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center h-full p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13 1a6 6 0 01-12 0m12 0a6 6 0 00-12 0" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {searchQuery ? 'No users found' : 'No contacts yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUsers.map(user => {
                  const isOnline = isUserOnline(user.lastSeen);
                  return (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        selectedUser?.id === user.id 
                          ? 'bg-blue-50 dark:bg-blue-900/20' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Avatar with Online Status */}
                        <div className="relative flex-shrink-0">
                          <img
                            src={user.profile_picture || '/avatar.png'}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          {isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900 dark:text-white truncate">
                              {user.firstName} {user.lastName}
                            </span>
                            {user.unread_count && user.unread_count > 0 && (
                              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                                {user.unread_count > 9 ? '9+' : user.unread_count}
                              </span>
                            )}
                          </div>
                          
                          {/* Status and Last Message */}
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                            <span className={isOnline ? 'text-green-600 dark:text-green-400' : ''}>
                              {isOnline ? 'Online' : 'Offline'}
                            </span>
                            {user.last_message && (
                              <>
                                <span>•</span>
                                <span className="truncate">
                                  {user.last_message.length > 20 
                                    ? `${user.last_message.substring(0, 20)}...` 
                                    : user.last_message}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className={`flex-1 flex flex-col ${selectedUser ? 'block' : 'hidden md:flex'}`}>
          {selectedUser ? (
            <>
              {/* Selected User Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="relative">
                    <img
                      src={selectedUser.profile_picture || '/avatar.png'}
                      alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {isUserOnline(selectedUser.lastSeen) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {isUserOnline(selectedUser.lastSeen) ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No messages yet
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Start a conversation with {selectedUser.firstName}
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
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                          }`}
                        >
                          <div className="text-sm">{message.message}</div>
                          <div
                            className={`text-xs mt-1 text-right ${
                              isOwnMessage
                                ? 'text-blue-200'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {formatMessageTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input - Fixed to not be cut */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message ${selectedUser.firstName}...`}
                    className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || !selectedUser}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <svg className="w-20 h-20 text-gray-300 dark:text-gray-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                Your Messages
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-6">
                Select a conversation from the list to start chatting
              </p>
              <div className="text-sm text-gray-400 dark:text-gray-500">
                {filteredUsers.length} contact{filteredUsers.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute bottom-20 left-4 right-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-3">
          <div className="flex items-center">
            <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatComponent;