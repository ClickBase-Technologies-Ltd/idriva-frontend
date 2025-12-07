'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from "@/components/Sidebar";
import RightbarRecruiters from "@/components/Rightbar";
import FeedPost from "@/components/FeedPost";
import FeedJob from "@/components/FeedJob";
import CreatePostBox from "@/components/CreatePostBox";
import HeaderLoggedIn from "@/components/HeaderLoggedIn";
import api from '@/lib/api';
import ChatComponent from "@/components/ChatComponent";
import ChatButton from "@/components/ChatButton";

// interface User {
//   id: string;
//   firstName: string;
//   lastName: string;
//   role: string;
//   profile_picture?: string;
// }

interface User {
  id: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  role: string;
  profileImage?: string | null;
  coverImage?: string | null;
  email: string;
  phoneNumber: string;
  followersCount?: number;
  followingCount?: number;
  suggestedUsers?: any[];
  unreadCount?: number;
  isFollowing?: boolean;
}

interface PostUser {
  id: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  profileSlug: string | null;
  avatar: string | null;
  email: string;
  phoneNumber: string;
  email_verified_at: string;
  role: number;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface Comment {
  postCommentId: number;
  userId: number;
  postId: number;
  content: string;
  created_at: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

interface Like {
  id: number;
  userId: number;
  postId: number;
  created_at: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

interface Share {
  id: number;
  userId: number;
  postId: number;
  created_at: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

interface Post {
  postId: number;
  userId: number;
  title: string;
  body: string;
  uploadUrl: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  user: PostUser;
  likes: any[];
  shares: any[];
  comments?: Comment[];
}

interface Job {
  jobId: number;
  companyId: number;
  jobTitle: string;
  jobDescription: string;
  jobLocation: string | null;
  salary: number | null;
  jobType: string;
  jobStatus: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  company: {
    companyId: number;
    companyName: string;
    companyLogo: string | null;
    companyLocation: string | null;
  };
}

interface FeedItem {
  id: string;
  type: "post" | "job";
  authorName: string;
  authorAvatar: string;
  created_at: string;
  content: string;
  image_url: string | null;
  likes: number;
  comments: Comment[];
  shares: number;
  user?: PostUser;
  postId: number;
  isLiked: boolean;
  jobTitle?: string;
  jobDescription?: string;
  jobLocation?: string;
  salary?: number | null;
  jobType?: string;
  companyName?: string;
  companyLogo?: string | null;
  jobId?: number;
}

interface ModalData {
  type: 'likes' | 'comments' | 'shares';
  postId: number;
  data: any[];
  title: string;
}

interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  profileImage?: string | null;
}

export default function FeedPage() {
  const [user, setUser] = useState<User | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Chat states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<ChatUser | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const feedContainerRef = useRef<HTMLDivElement>(null);
  
  // Track last fetch time to prevent too frequent requests
  const lastFetchRef = useRef<number>(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch user data and posts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user data from API
        const fetchUserData = async () => {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
              credentials: 'include'
            });
            
            if (response.ok) {
              const userData = await response.json();
              console.log('User data:', userData);

              const userObj: User = {
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
              };
              
              setUser(userObj);
              localStorage.setItem('user', JSON.stringify(userObj));
            } else {
              console.error('API failed with status:', response.status);
              
              const storedUser = localStorage.getItem('user');
              if (storedUser) {
                setUser(JSON.parse(storedUser));
              } else {
                setUser({
                  id: 'fallback-1',
                  firstName: 'User',
                  lastName: 'User',
                  role: 'Driver',
                  email: '',
                  phoneNumber: ''
                });
              }
            }
          } catch (error) {
            console.error('Error fetching user:', error);
            setError('Network error fetching user data');
            
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              setUser(JSON.parse(storedUser));
            }
          }
        };

        await Promise.all([
          fetchUserData(),
          fetchFeed()
        ]);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load feed');
      } finally {
        setLoading(false);
        lastFetchRef.current = Date.now();
      }
    };

    fetchData();

    // Cleanup on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Simple periodic refresh - ONLY when page is active
  useEffect(() => {
    const checkForUpdates = async () => {
      // Only check if page is visible and not loading/refreshing
      if (document.visibilityState === 'visible' && !loading && !isRefreshing) {
        await checkForNewContent();
      }
    };

    // Check every 60 seconds (not 30)
    const interval = setInterval(checkForUpdates, 60000);
    
    // Also check when user comes back to the tab
    document.addEventListener('visibilitychange', checkForUpdates);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', checkForUpdates);
    };
  }, [loading, isRefreshing]);

  // Fetch both posts and jobs for the feed
  const fetchFeed = useCallback(async () => {
    try {
      setIsRefreshing(true);
      
      // Rate limiting - don't fetch if last fetch was less than 10 seconds ago
      const now = Date.now();
      if (now - lastFetchRef.current < 10000) {
        console.log('Rate limiting - skipping fetch');
        return;
      }

      const [postsResponse, jobsResponse] = await Promise.all([
        api.get('/posts'),
        api.get('/jobs')
      ]);

      const posts: Post[] = postsResponse.status === 200 ? postsResponse.data : [];
      const jobs: Job[] = jobsResponse.status === 200 ? jobsResponse.data : [];

      // Process posts
      const postFeedItems: FeedItem[] = await Promise.all(
        posts.map(async (post) => {
          let comments: Comment[] = [];
          try {
            const commentsResponse = await api.get(`/posts/${post.postId}/comments`);
            if (commentsResponse.status === 200) {
              comments = commentsResponse.data.comments || commentsResponse.data || [];
            }
          } catch (error) {
            console.error(`Error fetching comments for post ${post.postId}:`, error);
          }

          return {
            id: `post-${post.postId}`,
            postId: post.postId,
            type: "post",
            authorName: `${post.user.firstName} ${post.user.lastName} ${post.user.otherNames || ''}`.trim(),
            authorAvatar: post.user.profileImage || '/avatar.png',
            created_at: post.created_at,
            content: post.body,
            image_url: post.uploadUrl ? `${process.env.NEXT_PUBLIC_FILE_URL}${post.uploadUrl}` : null,
            likes: post.likes?.length || 0,
            comments: comments,
            shares: post.shares?.length || 0,
            user: post.user,
            isLiked: post.likes?.some((like: any) => like.userId === user?.id) || false,
          };
        })
      );

      // Process jobs
      const jobFeedItems: FeedItem[] = jobs.map((job) => ({
        id: `job-${job.jobId}`,
        type: "job",
        authorName: job.company.companyName,
        authorAvatar: job.company.companyLogo || '/company-avatar.png',
        created_at: job.created_at,
        content: job.jobDescription,
        image_url: job.image_url ? `${process.env.NEXT_PUBLIC_FILE_URL}${job.image_url}` : null,
        likes: 0,
        comments: [],
        shares: 0,
        isLiked: false,
        jobTitle: job.jobTitle,
        jobDescription: job.jobDescription,
        jobLocation: job.jobLocation,
        salary: job.salary,
        jobType: job.jobType,
        jobStatus: job.jobStatus,
        companyName: job.company.companyName,
        companyLogo: job.company.companyLogo,
        jobId: job.jobId,
      }));

      // Combine and sort by creation date
      const allFeedItems = [...postFeedItems, ...jobFeedItems].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setFeed(allFeedItems);
      lastFetchRef.current = Date.now();
      
    } catch (error) {
      console.error('Error fetching feed:', error);
      setError('Failed to load feed');
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.id]);

  // Check for new content - SIMPLE version
  const checkForNewContent = useCallback(async () => {
    // Rate limiting - don't check if last check was less than 30 seconds ago
    const now = Date.now();
    if (now - lastFetchRef.current < 30000) {
      return;
    }

    try {
      // Only check for the latest items
      const [postsResponse, jobsResponse] = await Promise.all([
        api.get('/posts?limit=5'),
        api.get('/jobs?limit=5')
      ]);

      if (postsResponse.status === 200 && jobsResponse.status === 200) {
        const latestPosts: Post[] = postsResponse.data;
        const latestJobs: Job[] = jobsResponse.data;
        
        let hasNewContent = false;
        
        // Check posts
        for (const post of latestPosts) {
          if (!feed.some(item => 
            item.type === 'post' && item.postId === post.postId
          )) {
            hasNewContent = true;
            break;
          }
        }
        
        // Check jobs
        if (!hasNewContent) {
          for (const job of latestJobs) {
            if (!feed.some(item =>
              item.type === 'job' && item.jobId === job.jobId
            )) {
              hasNewContent = true;
              break;
            }
          }
        }

        if (hasNewContent && feed.length > 0) {
          const isAtTop = feedContainerRef.current?.scrollTop === 0;
          if (!isAtTop) {
            setHasNewPosts(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking for new content:', error);
    }
  }, [feed]);

  // Add new post - simple optimistic update
  const addNewPost = useCallback(async (newPost: Post) => {
    if (!user) return;

    // Create optimistic post
    const optimisticPost: FeedItem = {
      id: `temp-${Date.now()}`,
      postId: -Date.now(),
      type: "post",
      authorName: `${user.firstName} ${user.lastName}`,
      authorAvatar: user.profileImage || '/avatar.png',
      created_at: new Date().toISOString(),
      content: newPost.body,
      image_url: newPost.uploadUrl ? `${process.env.NEXT_PUBLIC_API_URL}${newPost.uploadUrl}` : null,
      likes: 0,
      comments: [],
      shares: 0,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        otherNames: user.otherNames,
        profileSlug: null,
        avatar: user.profileImage,
        email: user.email,
        phoneNumber: user.phoneNumber,
        email_verified_at: new Date().toISOString(),
        role: 0,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
      },
      isLiked: false,
    };

    // Add to feed optimistically
    setFeed(prev => [optimisticPost, ...prev]);

    try {
      const formData = new FormData();
      formData.append('content', newPost.body);
      if (newPost.uploadUrl) {
        // You'll need to handle file upload properly
      }

      const response = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        const realPost = response.data.post || response.data;
        
        // Replace optimistic post with real one
        setFeed(prev => prev.map(item => 
          item.id === optimisticPost.id ? {
            id: `post-${realPost.postId}`,
            postId: realPost.postId,
            type: "post",
            authorName: `${realPost.user?.firstName || user.firstName} ${realPost.user?.lastName || user.lastName}`,
            authorAvatar: realPost.user?.avatar || user.profileImage || '/avatar.png',
            created_at: realPost.created_at,
            content: realPost.body,
            image_url: realPost.uploadUrl ? `${process.env.NEXT_PUBLIC_FILE_URL}${realPost.uploadUrl}` : null,
            likes: realPost.likes?.length || 0,
            comments: realPost.comments || [],
            shares: realPost.shares?.length || 0,
            user: realPost.user,
            isLiked: false,
          } : item
        ));
      }
    } catch (error) {
      console.error('Error creating post:', error);
      // Remove optimistic post on error
      setFeed(prev => prev.filter(item => item.id !== optimisticPost.id));
      setError('Failed to create post');
    }
  }, [user]);

  // Simple like handler
  const handleLike = useCallback(async (postId: number, currentlyLiked: boolean) => {
    // Optimistic update
    setFeed(prev => prev.map(item => 
      item.type === 'post' && item.postId === postId 
        ? { 
            ...item, 
            likes: currentlyLiked ? item.likes - 1 : item.likes + 1,
            isLiked: !currentlyLiked
          }
        : item
    ));

    try {
      if (currentlyLiked) {
        await api.post(`/posts/${postId}/unlike`);
      } else {
        await api.post(`/posts/${postId}/like`);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert on error
      setFeed(prev => prev.map(item => 
        item.type === 'post' && item.postId === postId 
          ? { 
              ...item, 
              likes: currentlyLiked ? item.likes + 1 : Math.max(0, item.likes - 1),
              isLiked: currentlyLiked
            }
          : item
      ));
    }
  }, []);

  // Update handleComment to return the actual comment
const handleComment = useCallback(async (postId: number, commentContent: string) => {
  if (!commentContent.trim() || !user) return;

  const tempCommentId = Date.now();
  const optimisticComment = {
    postCommentId: tempCommentId,
    userId: user.id,
    postId,
    content: commentContent,
    created_at: new Date().toISOString(),
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.profileImage || null,
    }
  };

  // Optimistic update
  setFeed(prev => prev.map(item => 
    item.type === 'post' && item.postId === postId 
      ? { 
          ...item, 
          comments: [optimisticComment, ...item.comments]
        }
      : item
  ));

  try {
    const response = await api.post(`/posts/${postId}/comment`, {
      comment: commentContent
    });

    if (response.status === 201) {
      const actualComment = response.data.comment || response.data;
      
      // Replace optimistic comment
      setFeed(prev => prev.map(item => 
        item.type === 'post' && item.postId === postId 
          ? { 
              ...item, 
              comments: item.comments.map(comment => 
                comment.postCommentId === tempCommentId ? actualComment : comment
              )
            }
          : item
      ));
      
      // Return the actual comment
      return actualComment;
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    // Revert on error
    setFeed(prev => prev.map(item => 
      item.type === 'post' && item.postId === postId 
        ? { 
            ...item, 
            comments: item.comments.filter(comment => comment.postCommentId !== tempCommentId)
          }
        : item
    ));
    throw error;
  }
}, [user]);

  // Simple share handler
  const handleShare = useCallback(async (postId: number) => {
    setFeed(prev => prev.map(item => 
      item.type === 'post' && item.postId === postId 
        ? { ...item, shares: item.shares + 1 }
        : item
    ));

    try {
      await api.post(`/posts/${postId}/share`);
    } catch (error) {
      console.error('Error sharing post:', error);
      setFeed(prev => prev.map(item => 
        item.type === 'post' && item.postId === postId 
          ? { ...item, shares: Math.max(0, item.shares - 1) }
          : item
      ));
    }
  }, []);

  // Delete comment handler
  const handleDeleteComment = useCallback(async (postId: number, commentId: number) => {
    setFeed(prev => prev.map(item => 
      item.type === 'post' && item.postId === postId 
        ? { 
            ...item, 
            comments: item.comments.filter(comment => comment.postCommentId !== commentId)
          }
        : item
    ));

    try {
      await api.delete(`/posts/${postId}/comment/${commentId}`);
    } catch (error) {
      console.error('Error deleting comment:', error);
      await fetchFeed();
    }
  }, [fetchFeed]);

  // Show modal with likes, comments, or shares
  const showModal = useCallback(async (type: 'likes' | 'comments' | 'shares', postId: number) => {
    setModalLoading(true);
    try {
      let endpoint = '';
      let title = '';

      switch (type) {
        case 'likes':
          endpoint = `/posts/${postId}/likes`;
          title = 'Likes';
          break;
        case 'comments':
          endpoint = `/posts/${postId}/comments`;
          title = 'Comments';
          break;
        case 'shares':
          endpoint = `/posts/${postId}/shares`;
          title = 'Shares';
          break;
      }

      const response = await api.get(endpoint);
      const data = response.data[type] || response.data || [];

      setModalData({
        type,
        postId,
        data,
        title
      });
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      setError(`Failed to load ${type}`);
    } finally {
      setModalLoading(false);
    }
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setModalData(null);
  }, []);

  // Load new posts button
  const loadNewPosts = useCallback(async () => {
    await fetchFeed();
    setHasNewPosts(false);
    
    if (feedContainerRef.current) {
      feedContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [fetchFeed]);

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (feedContainerRef.current) {
      const isAtTop = feedContainerRef.current.scrollTop === 0;
      if (isAtTop && hasNewPosts) {
        setHasNewPosts(false);
      }
    }
  }, [hasNewPosts]);

  // Check unread messages - with rate limiting
  useEffect(() => {
    let lastCheck = 0;
    
    const checkUnreadMessages = async () => {
      const now = Date.now();
      if (now - lastCheck < 30000) return; // Check every 30 seconds max
      
      try {
        const response = await api.get('/chat/unread-count');
        if (response.status === 200) {
          setUnreadMessages(response.data.count || 0);
          lastCheck = now;
        }
      } catch (error) {
        console.error('Error checking unread messages:', error);
      }
    };

    checkUnreadMessages();
    const interval = setInterval(checkUnreadMessages, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleOpenChat = useCallback((userId?: string, userData?: ChatUser) => {
    if (userId && userData) {
      setSelectedChatUser(userData);
    }
    setIsChatOpen(true);
  }, []);

  if (loading) {
    return (
      <>
        <HeaderLoggedIn />
        <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white pt-16">
          <div className="max-w-[1360px] mx-auto px-4 lg:px-6 flex gap-6 mt-[-70px] min-h-screen">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading feed...</p>
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
      {/* Chat Components */}
      {!isChatOpen && (
        <ChatButton 
          onClick={() => setIsChatOpen(true)} 
          unreadCount={unreadMessages}
        />
      )}

      {isChatOpen && (
        <ChatComponent
          currentUser={user}
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setSelectedChatUser(null);
          }}
          initialReceiver={selectedChatUser}
        />
      )}
      <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white pt-16">
        <div className="max-w-[1360px] mx-auto px-4 lg:px-6 flex gap-6 mt-[-70px]">
          {/* LEFT SIDEBAR */}
          <aside className="w-[280px] hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide pb-10">
            <Sidebar />
          </aside>

          {/* MAIN FEED */}
          <main 
            ref={feedContainerRef}
            className="flex-1 space-y-6 mt-6 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide pb-10"
            onScroll={handleScroll}
          >
            {/* New Posts Notification */}
            {hasNewPosts && (
              <div className="sticky top-0 z-10 bg-blue-500 text-white p-3 rounded-lg shadow-lg text-center cursor-pointer hover:bg-[#0A66C2] transition-colors">
                <button 
                  onClick={loadNewPosts}
                  className="w-full flex items-center justify-center gap-2 font-medium"
                >
                  <span>New content available</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            )}

            {user && (
              <CreatePostBox 
                user={{
                  id: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  role: user.role,
                  profile_picture: user.profileImage || undefined
                }}
                onPostCreated={addNewPost} 
                onError={setError}
              />
            )}

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

            {feed.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                  No posts or jobs yet
                </div>
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  Be the first to share something or post a job!
                </p>
              </div>
            ) : (
              feed.map(item =>
                item.type === "post" ? (
                  <FeedPost 
                    key={item.id} 
                    post={item} 
                    user={{
                      id: user!.id,
                      firstName: user!.firstName,
                      lastName: user!.lastName,
                      role: user!.role,
                      profile_picture: user!.profileImage || undefined
                    }}
                    onLike={handleLike}
                    onShare={handleShare}
                    onComment={handleComment}
                    onDeleteComment={handleDeleteComment}
                    onShowModal={showModal}
                  />
                ) : (
                  <FeedJob key={item.id} job={item} />
                )
              )
            )}

            {/* Refresh indicator */}
            {isRefreshing && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                Checking for new content...
              </div>
            )}
          </main>

          {/* RIGHT SIDEBAR */}
          <aside className="w-[320px] hidden xl:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden scrollbar-hide">
            <RightbarRecruiters />
          </aside>
        </div>
      </div>

      {/* Modal for Likes, Comments, Shares */}
      {modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modalData.title}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-80">
              {modalLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : modalData.data.length === 0 ? (
                <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                  No {modalData.type} yet
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {modalData.data.map((item: any, index: number) => (
                    <div key={item.id || item.postCommentId || index} className="p-4 flex items-center space-x-3">
                      <img
                        src={item.user?.avatar || '/avatar.png'}
                        alt={item.user?.firstName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.user?.firstName} {item.user?.lastName}
                        </div>
                        {modalData.type === 'comments' && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                            {item.content}
                          </p>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(item.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}