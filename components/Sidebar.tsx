'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt,
  faUser,
  faUsers,
  faUserCheck,
  faAward,
  faBriefcase,
  faComments,
  faBell,
  faCog,
  faQuestionCircle,
  faSignOutAlt,
  faBook,
  faCalendarAlt,
  faUserTie,
  faFileAlt,
  faBars,
  faTimes,
  faWarehouse,
  faChartLine,
  faPlus,
  faSpinner,
  faUserPlus
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';
import UserFollowStats from './UserFollowStats';
import FollowButton from './FollowButton';

interface SuggestedUser {
  id: number; // Changed from string to number based on API
  firstName: string;
  lastName: string;
  otherNames?: string | null;
  avatar?: string | null;
  profileImage?: string | null;
  bio?: string | null;
  location?: string | null;
  followersCount: number;
  followingCount: number;
  is_following?: boolean;
  role?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  role: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string | null;
  coverImage?: string | null;
  followersCount?: number;
  followingCount?: number;
  suggestedUsers?: SuggestedUser[];
  unreadCount?: number;
  isFollowing?: boolean;
}

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggestedUsersLoading, setSuggestedUsersLoading] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [error, setError] = useState('');
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  
  // Fetch main user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log('User data:', userData);

          setUser({
            id: userData.user?.id || '1',
            firstName: userData.user?.full_name?.split(" ")[0] || 'First Name',
            lastName: userData.user?.full_name?.split(" ").slice(1).join(" ") || 'Last Name',
            otherNames: userData.user?.full_name?.split(" ").slice(2).join(" ") || '',
            role: userData.user?.role || 'Driver',
            email: userData.user?.email || '',
            phoneNumber: userData.user?.phoneNumber || '',
            profileImage: userData.profile?.profileImage || null,
            coverImage: userData.profile?.coverImage || null,
            followersCount: userData.followersCount,
            followingCount: userData.followingCount,
            suggestedUsers: userData.suggestedUsers,
            unreadCount: userData.unreadCount,
            isFollowing: userData.isFollowing
          });
        } else {
          console.error('API failed with status:', response.status);
          setError('Failed to fetch user data');
          setUser({
            id: 'fallback-1',
            firstName: 'Fallback',
            lastName: 'User',
            role: 'Driver'
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Network error fetching user data');
        setUser({
          id: 'error-1',
          firstName: 'Error',
          lastName: 'User',
          role: 'Driver'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch suggested users
  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      // Only fetch for Driver or Recruiter roles
      if (!user || (user.role !== 'Driver' && user.role !== 'Recruiter')) {
        return;
      }

      try {
        setSuggestedUsersLoading(true);
        
        console.log('Fetching suggested users...');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/suggested`, {
          credentials: 'include'
        });
        
        console.log('Suggested users response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Suggested users API response:', data);
          
          // Format the data to match SuggestedUser interface based on your API response
          const formattedUsers = data.data?.map((user: any) => {
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            const otherNames = user.otherNames ? `${user.otherNames}`.trim() : null;
            
            return {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              otherNames: otherNames,
              avatar: user.avatar,
              profileImage: user.profileImage,
              bio: user.bio,
              location: user.location,
              followersCount: user.followersCount || 0,
              followingCount: user.followingCount || 0,
              is_following: false, // Default to false, you might need to check this from your API
              role: 'User' // Default role, update if your API provides role
            };
          }) || [];
          
          console.log('Formatted suggested users:', formattedUsers);
          setSuggestedUsers(formattedUsers);
        } else {
          console.error('Failed to fetch suggested users:', response.status, response.statusText);
          try {
            const errorText = await response.text();
            console.error('Error response:', errorText);
          } catch (e) {
            console.error('Could not read error response');
          }
          setSuggestedUsers([]);
        }
      } catch (error) {
        console.error('Error fetching suggested users:', error);
        setSuggestedUsers([]);
      } finally {
        setSuggestedUsersLoading(false);
      }
    };

    if (user && (user.role === 'Driver' || user.role === 'Recruiter')) {
      fetchSuggestedUsers();
    }
  }, [user?.id, user?.role]); // Re-fetch when user changes

  // Handle follow success callback
  const handleFollowSuccess = (targetUserId: number, isFollowing: boolean) => {
    console.log('Follow success callback:', targetUserId, isFollowing);
    
    // Update suggested users state
    setSuggestedUsers(prev => 
      prev.map(user => 
        user.id === targetUserId 
          ? { ...user, is_following: isFollowing }
          : user
      )
    );
    
    // Update current user's following count
    if (user && isFollowing) {
      setUser(prev => prev ? {
        ...prev,
        followingCount: (prev.followingCount || 0) + 1
      } : null);
    } else if (user && !isFollowing) {
      setUser(prev => prev ? {
        ...prev,
        followingCount: Math.max(0, (prev.followingCount || 1) - 1)
      } : null);
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('Current user:', user);
    console.log('Suggested users state:', suggestedUsers);
    console.log('Suggested users loading:', suggestedUsersLoading);
  }, [user, suggestedUsers, suggestedUsersLoading]);

  // Your existing auth and refresh token code...
  const refreshToken = useCallback(async () => {
    try {
      await api.post('/refresh', {}, { withCredentials: true });
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/user`, { withCredentials: true });
        setIsAuthenticated(true);
        setRole(response.data.role || '');
        setName(`${response.data.firstName || ''} ${response.data.lastName || ''}`.trim());
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && error.config && !error.config.__isRetryRequest) {
          error.config.__isRetryRequest = true;
          const refreshed = await refreshToken();
          if (refreshed) {
            return api(error.config);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [refreshToken]);

  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Role-based navigation items (same as before)
  const roleBasedNavItems = {
     Driver: [
      { href: '/dashboard', icon: faTachometerAlt, label: 'Dashboard' },
      { href: '/dashboard/profile', icon: faUser, label: 'Profile' },
      { href: '/dashboard/followers?type=following', icon: faUsers, label: 'Following' },
      { href: '/dashboard/followers?type=followers', icon: faUserCheck, label: 'Followers' },
      { href: '/dashboard/suggested-users', icon: faUserPlus, label: 'Discover People' },
      { href: '/dashboard/learning', icon: faBook, label: 'Learning' },
      // { href: '/certifications', icon: faAward, label: 'Certifications' },
      { href: '/dashboard/driver/jobs', icon: faBriefcase, label: 'Job Board' },
      { href: '/dashboard/notifications', icon: faBell, label: 'Notifications' },
      // { href: '/dashboard/settings', icon: faCog, label: 'Settings' },
      { href: '/dashboard/help', icon: faQuestionCircle, label: 'Help Center' },
    ],
    Recruiter: [
      { href: '/dashboard', icon: faTachometerAlt, label: 'Dashboard' },
      { href: '/dashboard/profile', icon: faUser, label: 'Profile' },
      { href: '/dashboard/recruiter/companies', icon: faWarehouse, label: 'Companies' },
      { href: '/dashboard/recruiter/candidates', icon: faUserTie, label: 'Candidates' },
      { href: '/dashboard/recruiter/jobs', icon: faBriefcase, label: 'Job Posts' },
      { href: '/dashboard/recruiter/applications', icon: faFileAlt, label: 'Applications' },
      { href: '/dashboard/notifications', icon: faBell, label: 'Notifications' },
      // { href: '/dashboard/settings', icon: faCog, label: 'Settings' },
    ],
    Instructor: [
      { href: '/instructor/dashboard', icon: faTachometerAlt, label: 'Learning Dashboard' },
      { href: '/instructor/my-courses', icon: faBook, label: 'My Courses' },
      { href: '/instructor/courses/create', icon: faPlus, label: 'Create Course' },
      { href: '/instructor/modules/create', icon: faFileAlt, label: 'Create Module' },
      // { href: '/instructor/enrollments', icon: faUserCheck, label: 'Enrollments' },
      // { href: '/instructor/students', icon: faUsers, label: 'Students' },
      // { href: '/instructor/analytics', icon: faChartLine, label: 'Analytics' },
      // { href: '/instructor/schedule', icon: faCalendarAlt, label: 'Schedule' },
      // { href: '/instructor/settings', icon: faCog, label: 'Settings' },
    ],
  };

  if (loading) {
    return (
      <div className="w-64 bg-white dark:bg-gray-900 h-screen p-4">
        <div className="animate-pulse">
          <div className="h-24 bg-gray-300 rounded mb-4"></div>
          <div className="h-6 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const currentUser = user || {
    id: 'default-1',
    firstName: 'Default',
    lastName: 'User',
    role: 'driver'
  };

  const fullName = `${currentUser.firstName} ${currentUser.lastName}`.trim();
  const navItems = roleBasedNavItems[currentUser.role as keyof typeof roleBasedNavItems] || roleBasedNavItems.Driver;

  // Helper function to get full name for suggested users
  const getFullName = (user: SuggestedUser) => {
    const mainName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return user.otherNames ? `${mainName} ${user.otherNames}` : mainName;
  };

  return (
    <div className="relative z-50 lg:static">
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full p-2 shadow z-50"
      >
        <FontAwesomeIcon 
          icon={isOpen ? faTimes : faBars} 
          className="text-xl text-gray-800 dark:text-white" 
        />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 w-64 h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-white shadow transform transition-transform duration-300 lg:static lg:translate-x-0 lg:block z-50 rounded-lg  overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cover + Profile */}
        
        <div className="relative">
          <Image
            src={
              currentUser?.coverImage
                ? `${process.env.NEXT_PUBLIC_FILE_URL}/${currentUser.coverImage}`
                : '/cover_photo.jpg'
            }
            alt="Cover Photo"
            width={256}
            height={96}
            className="w-full h-24 object-cover rounded-t-lg"
            onError={(e) => {
              e.currentTarget.src = '/cover_photo.jpg';
            }}
          />
          <div className="absolute left-4 -bottom-6">
            <Image
              src={
                currentUser?.profileImage 
                  ? `${process.env.NEXT_PUBLIC_FILE_URL}/${currentUser.profileImage}`
                  : '/avatar.png'
              }
              alt="Profile Picture"
              width={64}
              height={64}
              className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-900 object-cover"
               onError={(e) => {
              e.currentTarget.src = '/avatar.png';
            }}
            />
          </div>
        </div>

        {/* Name and Stats */}
        <div className="pt-10 pb-4 px-6">
          <p className="font-semibold text-base text-gray-800 dark:text-white mb-2">
            {fullName || 'Loading...'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize mb-3">
            {currentUser.role || 'Role'}
          </p>
          
          <div className="text-xs text-gray-500 space-y-1">
            {currentUser.email && <div>Email: {currentUser.email}</div>}
            {currentUser.phoneNumber && <div>Phone: {currentUser.phoneNumber}</div>}
          </div>

          {(currentUser.role === 'Driver' || currentUser.role === 'Recruiter') && user && (
            <UserFollowStats
              userId={user.id}
              followersCount={user.followersCount}
              followingCount={user.followingCount}
              isCurrentUser={true}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="p-6 space-y-2 text-sm pt-0">
          {navItems.map((item) => (
            item.isMessage ? (
              <button
                key={item.label}
                onClick={() => window.dispatchEvent(new CustomEvent('openChat'))}
                className="relative w-full text-left block px-3 py-2 rounded-md hover:bg-[#0A66C2] hover:text-white transition flex items-center"
              >
                <FontAwesomeIcon icon={item.icon} className="mr-2 w-4 h-4" />
                {item.label}
                <span className="absolute right-3 top-2 bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  3
                </span>
              </button>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className={`block px-3 py-2 rounded-md hover:bg-[#0A66C2] hover:text-white transition flex items-center ${
                  pathname === item.href ? 'bg-[#0A66C2] text-white' : ''
                }`}
              >
                <FontAwesomeIcon icon={item.icon} className="mr-2 w-4 h-4" />
                {item.label}
              </Link>
            )
          ))}

          {/* People You May Know Section */}
          {(currentUser.role === 'Driver' || currentUser.role === 'Recruiter') && (
            <div className="mt-6 px-3 pb-4">
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">
                  People You May Know
                </h3>
                
                {suggestedUsersLoading ? (
                  <div className="flex justify-center py-4">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[#0A66C2]" />
                    <span className="ml-2 text-sm text-gray-600">Loading suggestions...</span>
                  </div>
                ) : suggestedUsers.length > 0 ? (
                  <div className="space-y-3">
                    {suggestedUsers
                      .filter(person => person.id.toString() !== currentUser.id) // Filter out current user
                      .slice(0, 5) // Limit to 5 suggestions
                      .map((person) => (
                        <div key={person.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <div className="relative flex-shrink-0">
                              <Image
                                src={
                                  person.profileImage || person.avatar
                                    ? `${process.env.NEXT_PUBLIC_FILE_URL}/${person.profileImage || person.avatar}`
                                    : '/avatar.png'
                                }
                                alt={getFullName(person)}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/avatar.png';
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                {getFullName(person)}
                              </p>
                              {person.location && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {person.location}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0">
                            <FollowButton
                              targetUserId={person.id.toString()} // Convert to string for FollowButton
                              currentUserId={currentUser.id}
                              initialFollowing={person.is_following || false}
                              followerCount={person.followersCount || 0}
                              size="sm"
                              showCount={false}
                              onFollowChange={(isFollowing) => handleFollowSuccess(person.id, isFollowing)}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                    No suggestions available
                  </p>
                )}
                
                {suggestedUsers.length > 5 && (
                  <button
                    onClick={() => router.push('/suggested-users')}
                    className="w-full mt-3 text-sm text-[#0A66C2] hover:underline text-center"
                  >
                    View more suggestions
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}