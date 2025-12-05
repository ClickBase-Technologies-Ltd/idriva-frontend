// app/dashboard/notifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faCheck, 
  faTimes, 
  faSpinner,
  faUserPlus,
  faBriefcase,
  faThumbsUp,
  faComment,
  faShare,
  faEnvelope,
  faFilter,
  faTrash,
  faCheckDouble
} from '@fortawesome/free-solid-svg-icons';
import Sidebar from '@/components/Sidebar';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';
import RightbarRecruiters from "@/components/Rightbar";
import api from '@/lib/api';

interface Notification {
  id: number;
  type: 'follow' | 'post_like' | 'post_comment' | 'post_share' | 'job_post' | 'job_application' | 'message' | 'system';
  title: string;
  message: string;
  data: any;
  read_at: string | null;
  created_at: string;
  sender?: {
    id: number;
    name: string;
    avatar: string | null;
    role: string;
  };
  post?: {
    id: number;
    title: string;
    excerpt: string;
  };
  job?: {
    id: number;
    title: string;
    company: string;
  };
}

interface NotificationStats {
  total: number;
  unread: number;
  by_type: {
    follow: number;
    post_like: number;
    post_comment: number;
    job_post: number;
    job_application: number;
    message: number;
    system: number;
  };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [filter, setFilter] = useState<string>('all'); // 'all', 'unread', or notification type
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  
  const perPage = 20;

  useEffect(() => {
    fetchNotifications();
    fetchNotificationStats();
  }, [filter]);

  const fetchNotifications = async (pageNum = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      setError('');
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        per_page: perPage.toString(),
        filter: filter === 'all' ? '' : filter
      });
      
      const response = await api.get(`/notifications?${params}`);
      
      if (response.data.success) {
        const newNotifications = response.data.data;
        
        if (pageNum === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }
        
        setHasMore(newNotifications.length === perPage);
        setPage(pageNum);
      } else {
        setError('Failed to load notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchNotificationStats = async () => {
    try {
      const response = await api.get('/notifications/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      setMarkingAsRead(notificationId);
      
      const response = await api.post(`/notifications/${notificationId}/read`);
      
      if (response.data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read_at: new Date().toISOString() }
              : notification
          )
        );
        
        // Update stats
        if (stats) {
          setStats({
            ...stats,
            unread: Math.max(0, stats.unread - 1)
          });
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setMarkingAsRead(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await api.post('/notifications/mark-all-read');
      
      if (response.data.success) {
        // Update all notifications to read
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read_at: new Date().toISOString() }))
        );
        
        // Update stats
        if (stats) {
          setStats({
            ...stats,
            unread: 0
          });
        }
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      setDeleting(notificationId);
      
      const response = await api.delete(`/notifications/${notificationId}`);
      
      if (response.data.success) {
        // Remove from local state
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        // Update stats if notification was unread
        const deletedNotification = notifications.find(n => n.id === notificationId);
        if (stats && deletedNotification && !deletedNotification.read_at) {
          setStats({
            ...stats,
            total: stats.total - 1,
            unread: Math.max(0, stats.unread - 1)
          });
        } else if (stats) {
          setStats({
            ...stats,
            total: stats.total - 1
          });
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setDeleting(null);
    }
  };

  const clearAllNotifications = async () => {
    if (!confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await api.delete('/notifications/clear-all');
      
      if (response.data.success) {
        setNotifications([]);
        setStats({
          total: 0,
          unread: 0,
          by_type: {
            follow: 0,
            post_like: 0,
            post_comment: 0,
            job_post: 0,
            job_application: 0,
            message: 0,
            system: 0
          }
        });
      }
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const loadMore = () => {
    fetchNotifications(page + 1);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return faUserPlus;
      case 'post_like':
        return faThumbsUp;
      case 'post_comment':
        return faComment;
      case 'post_share':
        return faShare;
      case 'job_post':
      case 'job_application':
        return faBriefcase;
      case 'message':
        return faEnvelope;
      default:
        return faBell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'follow':
        return 'text-blue-600 dark:text-blue-400';
      case 'post_like':
        return 'text-pink-600 dark:text-pink-400';
      case 'post_comment':
        return 'text-green-600 dark:text-green-400';
      case 'post_share':
        return 'text-purple-600 dark:text-purple-400';
      case 'job_post':
        return 'text-amber-600 dark:text-amber-400';
      case 'job_application':
        return 'text-indigo-600 dark:text-indigo-400';
      case 'message':
        return 'text-cyan-600 dark:text-cyan-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case 'follow':
        return notification.sender ? `/dashboard/profile/${notification.sender.id}` : null;
      case 'post_like':
      case 'post_comment':
      case 'post_share':
        return notification.post ? `/dashboard/posts/${notification.post.id}` : null;
      case 'job_post':
        return notification.job ? `/dashboard/jobs/${notification.job.id}` : null;
      case 'job_application':
        return `/dashboard/recruiter/applications`;
      case 'message':
        return '/dashboard/messages';
      default:
        return null;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading && page === 1) {
    return (
      <>
        <HeaderLoggedIn />
        <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white pt-16">
          <div className="max-w-[1360px] mx-auto px-4 lg:px-6 flex gap-6 mt-[-70px] min-h-screen">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading notifications...</p>
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {stats ? (
                    <>
                      {stats.unread > 0 ? (
                        <span className="text-[#00639C] font-medium">{stats.unread} unread • </span>
                      ) : 'All caught up • '}
                      {stats.total} total notifications
                    </>
                  ) : 'Loading...'}
                </p>
              </div>
              
              <div className="flex space-x-2">
                {stats && stats.unread > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium flex items-center"
                  >
                    <FontAwesomeIcon icon={faCheckDouble} className="mr-2" />
                    Mark all as read
                  </button>
                )}
                
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium flex items-center"
                  >
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center space-x-2 mb-3">
                <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by:</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    filter === 'all'
                      ? 'bg-[#00639C] text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All
                  {stats && <span className="ml-1">({stats.total})</span>}
                </button>
                
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    filter === 'unread'
                      ? 'bg-[#00639C] text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Unread
                  {stats && stats.unread > 0 && (
                    <span className="ml-1">({stats.unread})</span>
                  )}
                </button>
                
                {stats && Object.entries(stats.by_type).map(([type, count]) => (
                  count > 0 && (
                    <button
                      key={type}
                      onClick={() => setFilter(type)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        filter === type
                          ? 'bg-[#00639C] text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      <span className="ml-1">({count})</span>
                    </button>
                  )
                ))}
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

            {/* Notifications List */}
            {notifications.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <FontAwesomeIcon icon={faBell} className="text-2xl text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No notifications yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {filter === 'all' 
                    ? "You're all caught up! Check back later for new notifications."
                    : `No ${filter} notifications found.`}
                </p>
                {filter !== 'all' && (
                  <button
                    onClick={() => setFilter('all')}
                    className="text-[#00639C] hover:text-[#005080] text-sm font-medium"
                  >
                    View all notifications
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const link = getNotificationLink(notification);
                  const NotificationComponent = link ? Link : 'div';
                  const notificationProps = link 
                    ? { href: link, className: 'block' }
                    : { className: 'block' };
                  
                  return (
                    <div 
                      key={notification.id}
                      className={`group bg-white dark:bg-gray-800 rounded-lg border transition-all ${
                        notification.read_at 
                          ? 'border-gray-200 dark:border-gray-700' 
                          : 'border-[#00639C]/20 dark:border-[#00639C]/30 bg-[#00639C]/5 dark:bg-[#00639C]/10'
                      }`}
                    >
                      <NotificationComponent {...notificationProps}>
                        <div className="p-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mr-3 mt-1">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                notification.read_at 
                                  ? 'bg-gray-100 dark:bg-gray-700' 
                                  : 'bg-[#00639C]/10 dark:bg-[#00639C]/20'
                              }`}>
                                <FontAwesomeIcon 
                                  icon={getNotificationIcon(notification.type)} 
                                  className={`text-lg ${getNotificationColor(notification.type)}`}
                                />
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className={`font-medium ${
                                    notification.read_at 
                                      ? 'text-gray-900 dark:text-white' 
                                      : 'text-gray-900 dark:text-white font-semibold'
                                  }`}>
                                    {notification.title}
                                  </h4>
                                  <p className={`mt-1 text-sm ${
                                    notification.read_at 
                                      ? 'text-gray-600 dark:text-gray-400' 
                                      : 'text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {notification.message}
                                  </p>
                                  
                                  {/* Sender info */}
                                  {notification.sender && (
                                    <div className="flex items-center mt-2">
                                      {notification.sender.avatar ? (
                                        <Image
                                          src={`${process.env.NEXT_PUBLIC_FILE_URL}/${notification.sender.avatar}`}
                                          alt={notification.sender.name}
                                          width={20}
                                          height={20}
                                          className="w-5 h-5 rounded-full mr-2"
                                        />
                                      ) : (
                                        <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 mr-2"></div>
                                      )}
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {notification.sender.name}
                                        {notification.sender.role && ` • ${notification.sender.role}`}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Post/Job preview */}
                                  {(notification.post || notification.job) && (
                                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-750 rounded text-xs text-gray-600 dark:text-gray-400">
                                      {notification.post && (
                                        <div>
                                          <div className="font-medium">Post: {notification.post.title}</div>
                                          <div className="mt-1 truncate">{notification.post.excerpt}</div>
                                        </div>
                                      )}
                                      {notification.job && (
                                        <div>
                                          <div className="font-medium">Job: {notification.job.title}</div>
                                          <div className="mt-1">{notification.job.company}</div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex flex-col items-end ml-2">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {formatTimeAgo(notification.created_at)}
                                  </span>
                                  
                                  {!notification.read_at && (
                                    <div className="mt-2 w-2 h-2 rounded-full bg-[#00639C]"></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex justify-end space-x-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read_at && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                disabled={markingAsRead === notification.id}
                                className="text-xs text-gray-600 dark:text-gray-400 hover:text-[#00639C] px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                              >
                                {markingAsRead === notification.id ? (
                                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1" />
                                ) : (
                                  <FontAwesomeIcon icon={faCheck} className="mr-1" />
                                )}
                                Mark as read
                              </button>
                            )}
                            
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              disabled={deleting === notification.id}
                              className="text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                              {deleting === notification.id ? (
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1" />
                              ) : (
                                <FontAwesomeIcon icon={faTimes} className="mr-1" />
                              )}
                              Delete
                            </button>
                          </div>
                        </div>
                      </NotificationComponent>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && notifications.length > 0 && (
              <div className="text-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                >
                  {loadingMore ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Loading more...
                    </>
                  ) : (
                    'Load More Notifications'
                  )}
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