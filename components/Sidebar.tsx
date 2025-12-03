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
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';

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
}


export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [name, setName] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // First try to get from localStorage (from login)
        // const storedUser = localStorage.getItem('user');
        // if (storedUser) {
        //   console.log('Found user in localStorage:', storedUser);
        //   const userData = JSON.parse(storedUser);
        //   setUser({
        //     id: userData.id || '1',
        //     firstName: userData.firstName || 'First',
        //     lastName: userData.lastName || 'Last',
        //     role: userData.role || 'Driver',
        //     email: userData.email,
        //     phoneNumber: userData.phoneNumber,
        //     profileImage: userData.profileImage,
        //     coverImage: userData.coverImage
        //   });
        //   setLoading(false);
        //   return;
        // }

        // If no localStorage, try API endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
          credentials: 'include'
        });
        
        
        if (response.ok) {
  const userData = await response.json();
  console.log(userData);

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
    unreadCount: userData.unreadCount
  });

  setLoading(false);
}
 else {
          console.error('API failed with status:', response.status);
          setError('Failed to fetch user data');
          // Set fallback user for testing
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
        // Set fallback user for testing
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

    // Handle redirect after all hooks are called
  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Role-based navigation items
  const roleBasedNavItems = {
    Driver: [
      { href: '/dashboard', icon: faTachometerAlt, label: 'Dashboard' },
      { href: '/dashboard/profile', icon: faUser, label: 'Profile' },
      { href: '/followers?type=following', icon: faUsers, label: 'Following' },
      { href: '/followers?type=followers', icon: faUserCheck, label: 'Followers' },
      { href: '/dashboard/learning', icon: faBook, label: 'Learning' },
      { href: '/certifications', icon: faAward, label: 'Certifications' },
      { href: '/jobs', icon: faBriefcase, label: 'Job Board' },
      { href: '#', icon: faComments, label: 'Messages', isMessage: true },
      { href: '/notifications', icon: faBell, label: 'Notifications' },
      { href: '/settings', icon: faCog, label: 'Settings' },
      { href: '/help', icon: faQuestionCircle, label: 'Help Center' },
    ],
    Recruiter: [
      { href: '/dashboard', icon: faTachometerAlt, label: 'Dashboard' },
      { href: '/dashboard/profile', icon: faUser, label: 'Profile' },
      { href: '/dashboard/recruiter/companies', icon: faWarehouse, label: 'Companies' },
      { href: '/dashboard/recruiter/candidates', icon: faUserTie, label: 'Candidates' },
      { href: '/dashboard/recruiter/jobs', icon: faBriefcase, label: 'Job Posts' },
      { href: '/dashboard/recruiter/applications', icon: faFileAlt, label: 'Applications' },
      { href: '#', icon: faComments, label: 'Messages', isMessage: true },
      { href: '/notifications', icon: faBell, label: 'Notifications' },
      { href: '/settings', icon: faCog, label: 'Settings' },
    ],
  Instructor: [
      { href: '/instructor/dashboard', icon: faTachometerAlt, label: 'Learning Dashboard' },
      { href: '/instructor/my-courses', icon: faBook, label: 'My Courses' },
      { href: '/instructor/courses/create', icon: faPlus, label: 'Create Course' },
      { href: '/instructor/modules/create', icon: faFileAlt, label: 'Create Module' },
  // { href: '/instructor/lessons/create', icon: faBook, label: 'Create Lesson' },
      { href: '/instructor/enrollments', icon: faUserCheck, label: 'Enrollments' },
      { href: '/instructor/students', icon: faUsers, label: 'Students' },
      { href: '/instructor/analytics', icon: faChartLine, label: 'Analytics' },
      { href: '/instructor/schedule', icon: faCalendarAlt, label: 'Schedule' },
      { href: '/instructor/settings', icon: faCog, label: 'Settings' },
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

   const handleFollow = async (userId: string) => {
    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ follow_user_id: userId }),
      });
      
      if (response.ok) {
        console.log('Followed user:', userId);
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

   // Mock suggested users - you can replace this with actual API call
  const mockSuggestedUsers: SuggestedUser[] = [
    {
      id: '2',
      full_name: 'Jane Smith',
      profileImage: '/avatar.png',
      is_following: false,
    },
    {
      id: '3',
      full_name: 'Mike Johnson',
      profileImage: '/avatar.png',
      is_following: true,
    },
  ];

  const fullName = `${currentUser.firstName} ${currentUser.lastName}`.trim();
  const navItems = roleBasedNavItems[currentUser.role as keyof typeof roleBasedNavItems] || roleBasedNavItems.driver;

//   console.log('Rendering sidebar with user:', {
//     fullName,
//     role: currentUser.role,
//     hasFirstName: !!currentUser.firstName,
//     hasLastName: !!currentUser.lastName
//   });

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
        className={`fixed top-0 left-0 w-64 h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-white shadow transform transition-transform duration-300 lg:static lg:translate-x-0 lg:block z-50 rounded-lg overflow-y-auto ${
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
          
          {/* Additional user info for testing */}
          <div className="text-xs text-gray-500 space-y-1">
            {currentUser.email && <div>Email: {currentUser.email}</div>}
            {currentUser.phoneNumber && <div>Phone: {currentUser.phoneNumber}</div>}
          </div>

          {/* Follower/Following Stats */}
          {(currentUser.role === 'Driver' || currentUser.role === 'Recruiter') && (
            <div className="flex space-x-4 text-xs text-gray-600 dark:text-gray-400 mt-3">
              <Link 
                href="/followers?type=followers" 
                className="text-center hover:text-[#0A66C2] transition-colors"
              >
                <div className="font-semibold text-gray-800 dark:text-white">42</div>
                <div>Followers</div>
              </Link>
              <Link 
                href="/followers?type=following" 
                className="text-center hover:text-[#0A66C2] transition-colors"
              >
                <div className="font-semibold text-gray-800 dark:text-white">128</div>
                <div>Following</div>
              </Link>
            </div>
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
          
          {/* Logout */}
          {/* <Link
            href="/api/auth/logout"
            className="block px-3 py-2 rounded-md text-red-600 hover:text-white hover:bg-red-600 transition flex items-center"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2 w-4 h-4" />
            Logout
          </Link> */}
         {/* People You May Know - Instructor version */}
        {(currentUser.role === 'Driver' || currentUser.role === 'Recruiter' ) && mockSuggestedUsers.length > 0 && (
          <div className="mt-6 px-6 pb-6">
            <div className="bg-white dark:bg-gray-800">
              <h3 className="font-semibold mb-3">People You May Know</h3>
              <div className="space-y-3">
                {mockSuggestedUsers.map((person) => (
                  <div key={person.id} className="flex items-center space-x-2">
                    <Image
                      src={person.profileImage || '/avatar.png'}
                      alt={person.full_name}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {person.full_name}
                      </p>
                      <button 
                        onClick={() => handleFollow(person.id)}
                        className={`text-xs mt-1 ${
                          person.is_following 
                            ? 'text-gray-500' 
                            : 'text-[#0A66C2] hover:underline'
                        }`}
                        disabled={person.is_following}
                      >
                        {person.is_following ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>


      </aside>
    </div>
  );
}