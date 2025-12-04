'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUsers, faUserCheck, faSearch, faSpinner } from '@fortawesome/free-solid-svg-icons';
import FollowButton from '@/components/FollowButton';
import Sidebar from '@/components/Sidebar';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';
import RightbarRecruiters from "@/components/Rightbar";

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
        ? `${process.env.NEXT_PUBLIC_API_URL}/suggested-followers`
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

  if (loading) {
    return (
      <>
        <HeaderLoggedIn />
        <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white pt-16">
          <div className="max-w-[1360px] mx-auto px-4 lg:px-6 flex gap-6 mt-[-70px] min-h-screen">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading {type}...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HeaderLoggedIn />
      <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white pt-16">
        <div className="max-w-[1360px] mx-auto px-4 lg:px-6 flex gap-6 mt-[-70px]">
          {/* LEFT SIDEBAR */}
          <aside className="w-[280px] hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
            <Sidebar />
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1 space-y-6 mt-6 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {type === 'followers' ? 'Your Followers' : 'Following'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {type === 'followers' 
                    ? 'People who follow you' 
                    : 'People you follow'}
                  {users.length > 0 && (
                    <span className="ml-2 text-[#00639C]">
                      • {users.length} {type}
                    </span>
                  )}
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Link
                  href="/dashboard/followers?type=followers"
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    type === 'followers'
                      ? 'bg-[#00639C] text-white'
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
                  href="/dashboard/followers?type=following"
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    type === 'following'
                      ? 'bg-[#00639C] text-white'
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

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder={`Search ${type} by name...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00639C] focus:border-transparent"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-red-600 dark:text-red-400 font-medium">{error}</div>
                  <button 
                    onClick={() => setError('')}
                    className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Content */}
            {filteredUsers.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
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
                    href="/dashboard/suggested-users"
                    className="inline-flex items-center px-4 py-2 bg-[#00639C] text-white rounded-lg hover:bg-[#005080] transition"
                  >
                    <FontAwesomeIcon icon={faUsers} className="mr-2" />
                    Discover People
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    currentUserId={currentUser?.id}
                    type={type}
                    onFollowSuccess={handleFollowSuccess}
                  />
                ))}
              </div>
            )}

            {/* Empty search results message */}
            {!loading && !error && searchTerm && filteredUsers.length === 0 && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No {type} found matching "{searchTerm}"
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-[#00639C] hover:text-[#005080] text-sm font-medium"
                >
                  Clear search
                </button>
              </div>
            )}
          </main>

          {/* RIGHT SIDEBAR */}
          <aside className="w-[320px] hidden xl:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden scrollbar-hide">
            <RightbarRecruiters />
          </aside>
        </div>
      </div>
    </>
  );
}

// UserCard Component
function UserCard({ 
  user, 
  currentUserId,
  type,
  onFollowSuccess
}: {
  user: FollowerUser;
  currentUserId: string;
  type: string;
  onFollowSuccess: (targetUserId: string, isFollowing: boolean) => void;
}) {
  const getFullName = (user: FollowerUser) => {
    const mainName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return user.otherNames ? `${mainName} ${user.otherNames}` : mainName;
  };

  const fullName = getFullName(user);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <Link href={`/dashboard/profile/${user.id}`} className="flex-shrink-0">
            <Image
              src={
                user.profileImage
                  ? `${process.env.NEXT_PUBLIC_FILE_URL}/${user.profileImage}`
                  : '/avatar.png'
              }
              alt={fullName}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
              onError={(e) => {
                e.currentTarget.src = '/avatar.png';
              }}
            />
          </Link>
          
          <div className="flex-1 min-w-0">
            <Link 
              href={`/dashboard/profile/${user.id}`}
              className="group block"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-[#00639C] truncate">
                {fullName}
              </h3>
            </Link>
            
            {user.role && (
              <p className="text-sm text-[#00639C] font-medium mt-1">
                {user.role}
              </p>
            )}
            
            {user.location && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                📍 {user.location}
              </p>
            )}
            
            {user.bio && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 line-clamp-2">
                {user.bio}
              </p>
            )}
            
            <div className="flex items-center space-x-4 mt-3">
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
          {currentUserId && user.id.toString() !== currentUserId && (
            <FollowButton
              targetUserId={user.id.toString()}
              currentUserId={currentUserId}
              initialFollowing={user.is_following || false}
              followerCount={user.followersCount}
              size="md"
              showCount={false}
              onFollowChange={(isFollowing) => onFollowSuccess(user.id.toString(), isFollowing)}
            />
          )}
        </div>
      </div>
    </div>
  );
}