'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse,
  faBriefcase,
  faCertificate,
  faComments,
  faBook,
  faCalendar,
  faSearch,
  faSun,
  faMoon,
  faUser,
  faCog,
  faSignOutAlt,
  faBars,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  profile_picture?: string;
}

interface SearchResult {
  id: string;
  title: string;
  type: 'user' | 'job' | 'certification' | 'course';
  subtitle?: string;
  href: string;
}

export default function HeaderLoggedIn() {
  const [dark, setDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
    const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setDark(false);
      document.documentElement.classList.remove('dark');
    }
    
    // Get user data from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser({
          id: userData.id || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          role: userData.role || '',
          profile_picture: userData.profile_picture || '/avatar.png'
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    setLoading(false);
  }, []);

 // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !dark;
    setDark(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search input
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    setSearchLoading(true);
    setSearchOpen(true);

    // STATIC DATA IMPLEMENTATION - Replace with API call when ready
    const staticResults: SearchResult[] = [
      {
        id: '1',
        title: 'John Smith',
        type: 'user',
        subtitle: 'Professional Driver',
        href: '/profile/1'
      },
      {
        id: '2',
        title: 'Senior Truck Driver',
        type: 'job',
        subtitle: 'Logistics Company',
        href: '/jobs/2'
      },
      {
        id: '3',
        title: 'CDL Certification',
        type: 'certification',
        subtitle: 'Commercial Driver License',
        href: '/certifications/3'
      },
      {
        id: '4',
        title: 'Defensive Driving Course',
        type: 'course',
        subtitle: 'Advanced Safety Training',
        href: '/courses/4'
      }
    ].filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(staticResults);
    setSearchLoading(false);

    // API ENDPOINT IMPLEMENTATION - Uncomment when endpoint is ready
    /*
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
    */
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';

  // Role-based menu items with Font Awesome icons
  const roleBasedMenus = {
    Driver: [
      { href: '/dashboard', icon: faHouse, label: 'Home' },
      { href: '/dashboard/driver/jobs', icon: faBriefcase, label: 'Jobs' },
      { href: '/dashboard/learning', icon: faBook, label: 'Learning' },
      { href: '/certifications', icon: faCertificate, label: 'Certifications' },
      { href: '#', icon: faComments, label: 'Messages' },
    ],
    Instructor: [
      { href: '/dashboard', icon: faHouse, label: 'Feed' },
      { href: '/instructor/my-courses', icon: faBook, label: 'Courses' },
      { href: '/instructor/schedule', icon: faCalendar, label: 'Schedule' },
      { href: '#', icon: faComments, label: 'Messages' },
    ],
    Recruiter: [
      { href: '/dashboard', icon: faHouse, label: 'Dashboard' },
      { href: '/recruiter/jobs', icon: faBriefcase, label: 'Post Jobs' },
      { href: '/recruiter/applications', icon: faSearch, label: 'Applications' },
      { href: '#', icon: faComments, label: 'Messages' },
    ]
  };

  // User dropdown menu items
  const userMenuItems = [
    { href: '/dashboard/profile', icon: faUser, label: 'Profile' },
    { href: '/settings', icon: faCog, label: 'Settings' },
    { icon: faSignOutAlt, label: 'Logout', onClick: handleLogout, isLogout: true },
  ];

  // Safely get current menus, defaulting to Driver if role is invalid/unknown
  const currentMenus = user && roleBasedMenus[user.role as keyof typeof roleBasedMenus]
    ? roleBasedMenus[user.role as keyof typeof roleBasedMenus]
    : roleBasedMenus.Driver;

  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Link href="/">
            <Image src="/logo.png" alt="iDriva Logo" width={100} height={32} />
          </Link>
        </div>
        <div className="animate-pulse">
          <div className="h-8 w-24 bg-gray-300 rounded"></div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 flex justify-between items-center">
        {/* Left Section - Logo and Search */}
        <div className="flex items-center space-x-3">
          <Link href="/">
            <Image src="/logo.png" alt="iDriva Logo" width={100} height={32} />
          </Link>
           <div className="relative ml-4 hidden lg:block" ref={searchRef}>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setSearchOpen(true)}
                className="pl-10 pr-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-4 h-4" 
              />
            </div>

            {/* Search Results Dropdown */}
            {searchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
                {searchLoading ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    <FontAwesomeIcon icon={faSearch} className="animate-spin w-4 h-4 mr-2" />
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result) => (
                      <Link
                        key={result.id}
                        href={result.href}
                        className="block px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            result.type === 'user' ? 'bg-blue-100 dark:bg-blue-900 text-[#0A66C2] dark:text-blue-300' :
                            result.type === 'job' ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300' :
                            result.type === 'certification' ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300' :
                            'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300'
                          }`}>
                            <FontAwesomeIcon 
                              icon={
                                result.type === 'user' ? faUser :
                                result.type === 'job' ? faBriefcase :
                                result.type === 'certification' ? faCertificate : faBook
                              } 
                              className="w-3 h-3" 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {result.title}
                            </div>
                            {result.subtitle && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No results found for "{searchQuery}"
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-6 text-sm">
          {/* Role-based Menu Items */}
          {currentMenus.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 transition-colors flex items-center"
            >
              <FontAwesomeIcon icon={item.icon} className="mr-2 w-4 h-4" />
              {item.label}
            </Link>
          ))}

          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleDarkMode}
            className="text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400 transition flex items-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <FontAwesomeIcon 
              icon={dark ? faSun : faMoon} 
              className="w-5 h-5" 
            />
          </button>

          {/* User Profile with Dropdown */}
          {user && (
            <div 
              className="relative"
              ref={dropdownRef}
            >
              <button 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full px-2 py-1 transition-colors"
              >
                <Image
                  src={user.profile_picture || '/avatar.png'}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full border border-blue-700"
                />
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {fullName}
                </span>
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  {userMenuItems.map((item) => (
                    item.onClick ? (
                      <button
                        key={item.label}
                        onClick={() => {
                          item.onClick?.();
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center transition-colors ${
                          item.isLogout 
                            ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' 
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <FontAwesomeIcon icon={item.icon} className="mr-3 w-4 h-4" />
                        {item.label}
                      </button>
                    ) : (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
                      >
                        <FontAwesomeIcon icon={item.icon} className="mr-3 w-4 h-4" />
                        {item.label}
                      </Link>
                    )
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden text-gray-700 dark:text-gray-300 text-xl p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} className="w-6 h-6" />
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed top-16 left-0 right-0 bg-white dark:bg-gray-800 shadow z-40 border-b border-gray-200 dark:border-gray-700"
        >
          <div className="flex flex-col px-4 py-4 space-y-3 text-sm">
            {/* Role-based Mobile Menu Items */}
            {currentMenus.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 flex items-center transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FontAwesomeIcon icon={item.icon} className="mr-3 w-4 h-4" />
                {item.label}
              </Link>
            ))}

            {/* Dark Mode Toggle Mobile */}
            <button 
              onClick={() => {
                toggleDarkMode();
                setMobileMenuOpen(false);
              }}
              className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400 py-2"
            >
              <FontAwesomeIcon 
                icon={dark ? faSun : faMoon} 
                className="mr-3 w-4 h-4" 
              />
              {dark ? 'Light Mode' : 'Dark Mode'}
            </button>

            {/* User Profile Mobile */}
            {user && (
              <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 py-3">
                <Image
                  src={user.profile_picture || '/avatar.png'}
                  alt="Avatar"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full border border-blue-700"
                />
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {fullName}
                </span>
              </div>
            )}

            {/* User Menu Items Mobile */}
            <div className="space-y-1 mt-2">
              {userMenuItems.map((item) => (
                item.onClick ? (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.onClick?.();
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left flex items-center transition-colors py-2 ${
                      item.isLogout 
                        ? 'text-red-600 hover:text-red-700' 
                        : 'text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400'
                    }`}
                  >
                    <FontAwesomeIcon icon={item.icon} className="mr-3 w-4 h-4" />
                    {item.label}
                  </button>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 transition-colors flex items-center py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FontAwesomeIcon icon={item.icon} className="mr-3 w-4 h-4" />
                    {item.label}
                  </Link>
                )
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Page Content Padding */}
      <div className="pt-20"></div>
    </>
  );
}