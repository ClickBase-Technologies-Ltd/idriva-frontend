'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  isFollowing?: boolean;
  followId?: string;
  followersCount?: number;
  followingCount?: number;
}

interface FollowersFollowingProps {
  currentUserId: string;
  onClose?: () => void;
  initialTab?: 'followers' | 'following';
}

const FollowersFollowing: React.FC<FollowersFollowingProps> = ({ 
  currentUserId,
  onClose,
  initialTab = 'followers'
}) => {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [followStats, setFollowStats] = useState({
    followersCount: 0,
    followingCount: 0
  });

  // Fetch users based on active tab
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        
        const endpoint = activeTab === 'followers' 
          ? `/users/${currentUserId}/followers` 
          : `/users/${currentUserId}/following`;
        
        const response = await api.get(endpoint);
        
        if (response.status === 200) {
          // Make sure we're getting the correct data structure
          const responseData = response.data;
          console.log('API Response:', responseData); // Debug log
          
          if (responseData.data && Array.isArray(responseData.data.users)) {
            setUsers(responseData.data.users);
          } else if (Array.isArray(responseData)) {
            setUsers(responseData);
          } else if (responseData.users && Array.isArray(responseData.users)) {
            setUsers(responseData.users);
          } else {
            setUsers([]);
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setError(`Failed to load ${activeTab}`);
        setUsers([]); // Ensure users is always an array
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUserId, activeTab]);

  // Fetch follow statistics
  useEffect(() => {
    const fetchFollowStats = async () => {
      try {
        const response = await api.get(`/users/${currentUserId}/follow-stats`);
        if (response.status === 200) {
          setFollowStats(response.data);
        }
      } catch (error) {
        console.error('Error fetching follow stats:', error);
      }
    };

    fetchFollowStats();
  }, [currentUserId]);

  const handleFollowToggle = async (userId: string, currentlyFollowing: boolean) => {
    try {
      // Optimistic update
      setUsers(prevUsers => 
        prevUsers?.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                isFollowing: !currentlyFollowing,
                followersCount: currentlyFollowing 
                  ? (user.followersCount || 1) - 1 
                  : (user.followersCount || 0) + 1
              } 
            : user
        ) || []
      );

      // Update follow stats
      if (activeTab === 'following' && currentlyFollowing) {
        setFollowStats(prev => ({ ...prev, followingCount: prev.followingCount - 1 }));
      } else if (activeTab === 'followers' && !currentlyFollowing) {
        setFollowStats(prev => ({ ...prev, followersCount: prev.followersCount + 1 }));
      }

      if (currentlyFollowing) {
        await api.post(`/users/${userId}/unfollow`);
      } else {
        await api.post(`/users/${userId}/follow`);
      }

    } catch (error) {
      console.error('Error toggling follow:', error);
      // Revert optimistic update
      setUsers(prevUsers => 
        prevUsers?.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                isFollowing: currentlyFollowing,
                followersCount: currentlyFollowing 
                  ? (user.followersCount || 0) + 1 
                  : Math.max(0, (user.followersCount || 1) - 1)
              } 
            : user
        ) || []
      );
      setError('Failed to update follow status');
    }
  };

  const handleRemoveFollower = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this follower?')) return;

    try {
      // Optimistic update
      setUsers(prevUsers => prevUsers?.filter(user => user.id !== userId) || []);
      setFollowStats(prev => ({ ...prev, followersCount: prev.followersCount - 1 }));

      await api.delete(`/users/${currentUserId}/followers/${userId}`);

    } catch (error) {
      console.error('Error removing follower:', error);
      setError('Failed to remove follower');
      // Reload users on error
      const endpoint = activeTab === 'followers' 
        ? `/users/${currentUserId}/followers` 
        : `/users/${currentUserId}/following`;
      
      const response = await api.get(endpoint);
      if (response.status === 200) {
        const responseData = response.data;
        if (responseData.data && Array.isArray(responseData.data.users)) {
          setUsers(responseData.data.users);
        } else if (Array.isArray(responseData)) {
          setUsers(responseData);
        } else if (responseData.users && Array.isArray(responseData.users)) {
          setUsers(responseData.users);
        }
      }
    }
  };

  // Filter users based on search - FIXED with null check
  const filteredUsers = (users || []).filter(user => {
    if (!searchQuery.trim()) return true;
    
    const fullName = `${user.firstName || ''} ${user.lastName || ''} ${user.otherNames || ''}`
      .toLowerCase()
      .trim();
    
    return fullName.includes(searchQuery.toLowerCase());
  });

  // Sort: following users first, then alphabetically
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (a.isFollowing && !b.isFollowing) return -1;
    if (!a.isFollowing && b.isFollowing) return 1;
    
    const nameA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
    const nameB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
    
    return nameA.localeCompare(nameB);
  });

  const getUserFullName = (user: User) => {
    return `${user.firstName || ''} ${user.lastName || ''}${user.otherNames ? ` ${user.otherNames}` : ''}`.trim();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {getUserFullName({ firstName: 'Your', lastName: 'Connections' })}
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex mb-4">
            <button
              onClick={() => setActiveTab('followers')}
              className={`cursor-pointer disabled:cursor-not-allowed flex-1 py-2 text-center font-medium rounded-l-lg transition-colors ${
                activeTab === 'followers'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>Followers</span>
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                  {followStats.followersCount}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`flex-1 py-2 text-center font-medium rounded-r-lg transition-colors ${
                activeTab === 'following'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>Following</span>
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                  {followStats.followingCount}
                </span>
              </div>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full px-4 py-2 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white text-sm"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Users List */}
        <div className="overflow-y-auto max-h-[calc(80vh-180px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading {activeTab}...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <svg className="w-12 h-12 text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13 1a6 6 0 01-12 0m12 0a6 6 0 00-12 0" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No {activeTab} yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {activeTab === 'followers' 
                  ? "When people follow you, they'll appear here."
                  : "Start following people to see them here."
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {sortedUsers.map(user => (
                <div key={user.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img
                          src={user.avatar || '/avatar.png'}
                          alt={getUserFullName(user)}
                          className="w-12 h-12 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                        />
                        {user.isFollowing && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {getUserFullName(user)}
                          </h4>
                          {user.followersCount !== undefined && user.followersCount > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              • {user.followersCount} follower{user.followersCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {user.bio && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 truncate mb-1">
                            {user.bio}
                          </p>
                        )}
                        {user.location && (
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{user.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      {activeTab === 'followers' ? (
                        <>
                          {user.isFollowing ? (
                            <button
                              onClick={() => handleFollowToggle(user.id, true)}
                              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              Following
                            </button>
                          ) : (
                            <button
                              onClick={() => handleFollowToggle(user.id, false)}
                              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Follow Back
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveFollower(user.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remove follower"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleFollowToggle(user.id, true)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            user.isFollowing
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {user.isFollowing ? 'Unfollow' : 'Follow'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>{sortedUsers.length} {activeTab.slice(0, -1)}{sortedUsers.length !== 1 ? 's' : ''}</span>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab(activeTab === 'followers' ? 'following' : 'followers');
                }}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Switch to {activeTab === 'followers' ? 'Following' : 'Followers'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowersFollowing;