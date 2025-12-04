'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faUsers, 
  faUserPlus, 
  faSearch, 
  faSpinner,
  faFilter,
  faMapMarkerAlt,
  faBriefcase
} from '@fortawesome/free-solid-svg-icons';
import FollowButton from '@/components/FollowButton';
import Sidebar from '@/components/Sidebar';

interface SuggestedUser {
  id: number;
  firstName: string;
  lastName: string;
  otherNames?: string | null;
  profileImage?: string | null;
  bio?: string | null;
  location?: string | null;
  followersCount: number;
  followingCount: number;
  is_following: boolean;
  role?: string;
  mutualConnections?: number;
}

export default function SuggestedUsersPage() {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [filters, setFilters] = useState({
    role: 'all',
    location: 'all',
    sortBy: 'relevance'
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const perPage = 10;

  useEffect(() => {
    fetchCurrentUser();
    fetchSuggestedUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, filters]);

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

  const fetchSuggestedUsers = async (pageNum = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      setError('');
      
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/suggested-followers?page=${pageNum}&limit=${perPage}`;
      
      const response = await fetch(endpoint, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Suggested users data:', data);
        
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
          is_following: user.is_following || false,
          role: user.role || 'User',
          mutualConnections: user.mutualConnections || Math.floor(Math.random() * 50) // Mock data
        })) || [];
        
        if (pageNum === 1) {
          setUsers(formattedUsers);
        } else {
          setUsers(prev => [...prev, ...formattedUsers]);
        }
        
        setHasMore(formattedUsers.length === perPage);
        setPage(pageNum);
      } else {
        setError('Failed to load suggested users');
      }
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleFollowSuccess = (targetUserId: string, isFollowing: boolean) => {
    setUsers(prev => prev.map(user => 
      user.id.toString() === targetUserId 
        ? { ...user, is_following: isFollowing }
        : user
    ));
  };

  const filterAndSortUsers = () => {
    let result = [...users];

    // Filter by search term
    if (searchTerm) {
      result = result.filter(user => {
        const fullName = `${user.firstName} ${user.lastName} ${user.otherNames || ''}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase()) ||
               (user.location && user.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
               (user.bio && user.bio.toLowerCase().includes(searchTerm.toLowerCase()));
      });
    }

    // Filter by role
    if (filters.role !== 'all') {
      result = result.filter(user => user.role === filters.role);
    }

    // Filter by location
    if (filters.location !== 'all') {
      result = result.filter(user => user.location === filters.location);
    }

    // Sort users
    switch (filters.sortBy) {
      case 'mutual':
        result.sort((a, b) => (b.mutualConnections || 0) - (a.mutualConnections || 0));
        break;
      case 'followers':
        result.sort((a, b) => b.followersCount - a.followersCount);
        break;
      case 'name':
        result.sort((a, b) => getFullName(a).localeCompare(getFullName(b)));
        break;
      case 'relevance':
      default:
        // Default sorting - could be based on algorithm
        result.sort((a, b) => (b.mutualConnections || 0) - (a.mutualConnections || 0));
        break;
    }

    setFilteredUsers(result);
  };

  const getFullName = (user: SuggestedUser) => {
    const mainName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return user.otherNames ? `${mainName} ${user.otherNames}` : mainName;
  };

  const loadMore = () => {
    fetchSuggestedUsers(page + 1);
  };

  // Get unique roles and locations for filters
  const uniqueRoles = Array.from(new Set(users.map(u => u.role).filter(Boolean)));
  const uniqueLocations = Array.from(new Set(users.map(u => u.location).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
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
                    People You May Know
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Discover new connections based on your profile and interests
                  </p>
                </div>
                
                <div className="mt-4 md:mt-0">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                    <span>Suggested connections for you</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search people by name, location, or bio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by:</span>
                </div>
                
                <select
                  value={filters.role}
                  onChange={(e) => setFilters({...filters, role: e.target.value})}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
                >
                  <option value="all">All Roles</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>

                <select
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
                >
                  <option value="all">All Locations</option>
                  {uniqueLocations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>

                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="mutual">Most Mutual Connections</option>
                  <option value="followers">Most Followers</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Suggestions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
                  </div>
                  <FontAwesomeIcon icon={faUsers} className="text-2xl text-[#0A66C2]" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Available Roles</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueRoles.length}</p>
                  </div>
                  <FontAwesomeIcon icon={faBriefcase} className="text-2xl text-[#0A66C2]" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Locations</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueLocations.length}</p>
                  </div>
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-2xl text-[#0A66C2]" />
                </div>
              </div>
            </div>

            {/* Content */}
            {loading && page === 1 ? (
              <div className="flex justify-center items-center py-12">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-[#0A66C2]" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading suggestions...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={() => fetchSuggestedUsers(1)}
                  className="mt-4 px-4 py-2 bg-[#0A66C2] text-white rounded-lg hover:bg-[#0056b3] transition"
                >
                  Try Again
                </button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                <FontAwesomeIcon 
                  icon={faUsers} 
                  className="text-4xl text-gray-300 dark:text-gray-600 mb-4"
                />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No suggestions found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm 
                    ? 'No users match your search criteria. Try different keywords.'
                    : 'No suggestions available at the moment. Check back later!'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="p-4">
                        <div className="flex flex-col items-center text-center mb-4">
                          <Link href={`/profile/${user.id}`} className="mb-3">
                            <Image
                              src={
                                user.profileImage
                                  ? `${process.env.NEXT_PUBLIC_FILE_URL}/${user.profileImage}`
                                  : '/avatar.png'
                              }
                              alt={getFullName(user)}
                              width={80}
                              height={80}
                              className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 dark:border-gray-700"
                              onError={(e) => {
                                e.currentTarget.src = '/avatar.png';
                              }}
                            />
                          </Link>
                          
                          <Link 
                            href={`/profile/${user.id}`}
                            className="group block mb-1"
                          >
                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[#0A66C2]">
                              {getFullName(user)}
                            </h3>
                          </Link>
                          
                          {user.role && (
                            <p className="text-sm text-[#0A66C2] font-medium mb-2">
                              {user.role}
                            </p>
                          )}
                          
                          {user.location && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" />
                              {user.location}
                            </p>
                          )}
                          
                          {user.bio && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4 line-clamp-2">
                              {user.bio}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center mb-4">
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Followers</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {user.followersCount}
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Following</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {user.followingCount}
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Mutual</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {user.mutualConnections || 0}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          {currentUser && user.id.toString() !== currentUser.id && (
                            <FollowButton
                              targetUserId={user.id.toString()}
                              currentUserId={currentUser.id}
                              initialFollowing={user.is_following}
                              followerCount={user.followersCount}
                              size="md"
                              showCount={false}
                              onFollowChange={(isFollowing) => handleFollowSuccess(user.id.toString(), isFollowing)}
                            />
                          )}
                          
                          <Link
                            href={`/profile/${user.id}`}
                            className="w-full px-4 py-2 text-center text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                          >
                            View Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center mt-6">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {loadingMore ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                          Loading...
                        </>
                      ) : (
                        'Load More Suggestions'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}