'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUsers, faUserCheck, faSearch, faSpinner } from '@fortawesome/free-solid-svg-icons';
import FollowButton from '@/components/FollowButton';
import Sidebar from '@/components/Sidebar';

interface FollowerUser {
  id: number;
  firstName: string;
  lastName: string;
  otherNames?: string | null;
  profileImage?: string | null;
  bio?: string | null;
  location?: string | null;
  followersCount: number;
  followingCount: number;
  is_following?: boolean;
  role?: string;
}

export default function FollowersPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'followers'; // 'followers' or 'following'
  
  const [users, setUsers] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, [type]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
        credentials: 'include'
      });
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser({
          id: userData.user?.id || '',
          firstName: userData.user?.full_name?.split(" ")[0] || '',
          lastName: userData.user?.full_name?.split(" ").slice(1).join(" ") || '',
          role: userData.user?.role || 'Driver'
        });
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const endpoint = type === 'followers' 
        ? `${process.env.NEXT_PUBLIC_API_URL}/followers`
        : `${process.env.NEXT_PUBLIC_API_URL}/following`;
      
      const response = await fetch(endpoint, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`${type} data:`, data);
        
        const formattedUsers = data.data?.map((user: any) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          otherNames: user.otherNames,
          profileImage: user.profileImage,
          bio: user.bio,
          location: user.location,
          followersCount: user.followersCount || 0,
          followingCount: user.followingCount || 0,
          is_following: type === 'following' ? true : (user.is_following || false),
          role: user.role || 'User'
        })) || [];
        
        setUsers(formattedUsers);
      } else {
        setError(`Failed to load ${type}`);
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowSuccess = (targetUserId: string, isFollowing: boolean) => {
    if (type === 'followers') {
      // Update the is_following status for followers
      setUsers(prev => prev.map(user => 
        user.id.toString() === targetUserId 
          ? { ...user, is_following: isFollowing }
          : user
      ));
    } else if (type === 'following' && !isFollowing) {
      // Remove from list if unfollowed in following page
      setUsers(prev => prev.filter(user => user.id.toString() !== targetUserId));
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName} ${user.otherNames || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const getFullName = (user: FollowerUser) => {
    const mainName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return user.otherNames ? `${mainName} ${user.otherNames}` : mainName;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 md:mb-8">
              <Link 
                href="/dashboard" 
                className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-[#0A66C2] mb-4"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Back to Dashboard
              </Link>
              
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {type === 'followers' ? 'Your Followers' : 'Following'}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {type === 'followers' 
                      ? 'People who follow you' 
                      : 'People you follow'}
                  </p>
                </div>
                
                <div className="mt-4 md:mt-0 flex space-x-3">
                  <Link
                    href="/followers?type=followers"
                    className={`px-4 py-2 rounded-lg flex items-center ${
                      type === 'followers'
                        ? 'bg-[#0A66C2] text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <FontAwesomeIcon icon={faUsers} className="mr-2" />
                    Followers
                    {type === 'followers' && users.length > 0 && (
                      <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                        {users.length}
                      </span>
                    )}
                  </Link>
                  
                  <Link
                    href="/followers?type=following"
                    className={`px-4 py-2 rounded-lg flex items-center ${
                      type === 'following'
                        ? 'bg-[#0A66C2] text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <FontAwesomeIcon icon={faUserCheck} className="mr-2" />
                    Following
                    {type === 'following' && users.length > 0 && (
                      <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                        {users.length}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder={`Search ${type}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent"
                />
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-[#0A66C2]" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading {type}...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={fetchUsers}
                  className="mt-4 px-4 py-2 bg-[#0A66C2] text-white rounded-lg hover:bg-[#0056b3] transition"
                >
                  Try Again
                </button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                <FontAwesomeIcon 
                  icon={type === 'followers' ? faUsers : faUserCheck} 
                  className="text-4xl text-gray-300 dark:text-gray-600 mb-4"
                />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No {type} found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {type === 'followers' 
                    ? "You don't have any followers yet. Start engaging with others!"
                    : "You're not following anyone yet. Discover new people to follow!"}
                </p>
                {type === 'following' && (
                  <Link
                    href="/suggested-users"
                    className="inline-flex items-center px-4 py-2 bg-[#0A66C2] text-white rounded-lg hover:bg-[#0056b3] transition"
                  >
                    <FontAwesomeIcon icon={faUsers} className="mr-2" />
                    Discover People
                  </Link>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="p-4 md:p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <Link href={`/profile/${user.id}`} className="flex-shrink-0">
                            <Image
                              src={
                                user.profileImage
                                  ? `${process.env.NEXT_PUBLIC_FILE_URL}/${user.profileImage}`
                                  : '/avatar.png'
                              }
                              alt={getFullName(user)}
                              width={56}
                              height={56}
                              className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                              onError={(e) => {
                                e.currentTarget.src = '/avatar.png';
                              }}
                            />
                          </Link>
                          
                          <div className="min-w-0 flex-1">
                            <Link 
                              href={`/profile/${user.id}`}
                              className="group block"
                            >
                              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[#0A66C2] truncate">
                                {getFullName(user)}
                              </h3>
                            </Link>
                            
                            {user.location && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                                {user.location}
                              </p>
                            )}
                            
                            {user.bio && (
                              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 line-clamp-2">
                                {user.bio}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-semibold">{user.followersCount}</span> followers
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-semibold">{user.followingCount}</span> following
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4 flex-shrink-0">
                          {currentUser && user.id.toString() !== currentUser.id && (
                            <FollowButton
                              targetUserId={user.id.toString()}
                              currentUserId={currentUser.id}
                              initialFollowing={user.is_following || false}
                              followerCount={user.followersCount}
                              size="md"
                              showCount={false}
                              onFollowChange={(isFollowing) => handleFollowSuccess(user.id.toString(), isFollowing)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty search results message */}
            {!loading && !error && searchTerm && filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No {type} found matching "{searchTerm}"
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}