'use client';
import { useState, useEffect, useRef } from 'react';
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
  profileImage?: string | null; // Changed from profile_picture to profileImage
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
  // Job specific fields
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

export default function FeedPage() {
  const [user, setUser] = useState<User | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const lastPostIdRef = useRef<number>(0);
  const lastJobIdRef = useRef<number>(0);
  

  // Fetch user data and posts
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       setLoading(true);
        
  //       const storedUser = localStorage.getItem('user');
  //       if (storedUser) {
  //         const userData: User = JSON.parse(storedUser);
  //         setUser(userData);
  //       } else {
  //         window.location.href = '/auth/login';
  //         return;
  //       }

  //       await fetchFeed();
        
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //       setError('Failed to load feed');
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchData();
  // }, []);


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
              // Optionally store in localStorage for other components
              localStorage.setItem('user', JSON.stringify(userObj));
            } else {
              console.error('API failed with status:', response.status);
              
              // Fallback to localStorage if API fails
              const storedUser = localStorage.getItem('user');
              if (storedUser) {
                setUser(JSON.parse(storedUser));
              } else {
                // Create a minimal fallback user
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
            
            // Fallback to localStorage on network error
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              setUser(JSON.parse(storedUser));
            }
          }
        };

        // Fetch both user data and feed data in parallel
        await Promise.all([
          fetchUserData(),
          fetchFeed()
        ]);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load feed');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  // Auto-refresh posts every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!loading) {
        await checkForNewContent();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading]);

  // Fetch both posts and jobs for the feed
  const fetchFeed = async () => {
    try {
      // Fetch posts and jobs in parallel
      const [postsResponse, jobsResponse] = await Promise.all([
        api.get('/posts'),
        api.get('/jobs') // You'll need to create this endpoint
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
        content: job.description,
        image_url: job.image_url ? `${process.env.NEXT_PUBLIC_FILE_URL}${job.image_url}` : null,
        likes: 0,
        comments: [],
        shares: 0,
        isLiked: false,
        // Job specific fields
        jobTitle: job.jobTitle,
        jobDescription: job.jobDescription,
        jobLocation: job.jobLocation,
        salary: job.salary,
        jobType: job.jobType,
        jobStatus: job.jobStatus,
        companyName: job.company.companyName,
        companyLogo: job.company.companyLogo,
        jobId: job.jobId
      }));

      // Combine and sort by creation date (newest first)
      const allFeedItems = [...postFeedItems, ...jobFeedItems].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setFeed(allFeedItems);
      
      // Update last IDs for refresh detection
      if (postFeedItems.length > 0) {
        lastPostIdRef.current = Math.max(...postFeedItems.map(item => item.postId));
      }
      if (jobFeedItems.length > 0) {
        lastJobIdRef.current = Math.max(...jobFeedItems.map(item => item.jobId || 0));
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
      setError('Failed to load feed');
    }
  };

  // Check for new content without updating the feed immediately
  const checkForNewContent = async () => {
    try {
      setIsAutoRefreshing(true);
      const [postsResponse, jobsResponse] = await Promise.all([
        api.get('/posts'),
        api.get('/jobs')
      ]);

      if (postsResponse.status === 200 && jobsResponse.status === 200) {
        const posts: Post[] = postsResponse.data;
        const jobs: Job[] = jobsResponse.data;

        let hasNewContent = false;

        // Check for new posts
        if (posts.length > 0) {
          const latestPostId = Math.max(...posts.map(post => post.postId));
          if (latestPostId > lastPostIdRef.current) {
            hasNewContent = true;
          }
        }

        // Check for new jobs
        if (jobs.length > 0) {
          const latestJobId = Math.max(...jobs.map(job => job.jobId));
          if (latestJobId > lastJobIdRef.current) {
            hasNewContent = true;
          }
        }

        if (hasNewContent) {
          const isAtTop = feedContainerRef.current?.scrollTop === 0;
          if (!isAtTop) {
            setHasNewPosts(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking for new content:', error);
    } finally {
      setIsAutoRefreshing(false);
    }
  };

  // Function to add new post to feed
  const addNewPost = (newPost: Post) => {
    const feedItem: FeedItem = {
      id: `post-${newPost.postId}`,
      postId: newPost.postId,
      type: "post",
      authorName: user ? `${user.firstName} ${user.lastName}`.trim() : 'You',
      authorAvatar: user?.profile_picture || '/avatar.png',
      created_at: newPost.created_at,
      content: newPost.body,
      image_url: newPost.uploadUrl ? `${process.env.NEXT_PUBLIC_API_URL}${newPost.uploadUrl}` : null,
      likes: 0,
      comments: [],
      shares: 0,
      user: newPost.user,
      isLiked: false,
    };
    
    setFeed(prevFeed => [feedItem, ...prevFeed]);
    lastPostIdRef.current = Math.max(lastPostIdRef.current, newPost.postId);
  };

  // Function to add new job to feed
  const addNewJob = (newJob: Job) => {
    const feedItem: FeedItem = {
      id: `job-${newJob.jobId}`,
      type: "job",
      authorName: newJob.company.companyName,
      authorAvatar: newJob.company.companyLogo || '/company-avatar.png',
      created_at: newJob.created_at,
      content: newJob.description,
      image_url: newJob.image_url ? `${process.env.NEXT_PUBLIC_FILE_URL}${newJob.image_url}` : null,
      likes: 0,
      comments: [],
      shares: 0,
      isLiked: false,
      jobTitle: newJob.title,
      jobDescription: newJob.description,
      jobLocation: newJob.location,
      salary: newJob.salary,
      jobType: newJob.type,
      companyName: newJob.company.companyName,
      companyLogo: newJob.company.companyLogo,
      jobId: newJob.jobId
    };
    
    setFeed(prevFeed => [feedItem, ...prevFeed]);
    lastJobIdRef.current = Math.max(lastJobIdRef.current, newJob.jobId);
  };

  // Handle like/unlike action (for posts only)
  const handleLike = async (postId: number, currentlyLiked: boolean) => {
    try {
      setFeed(prevFeed => 
        prevFeed.map(item => 
          item.type === "post" && item.postId === postId 
            ? { 
                ...item, 
                likes: currentlyLiked ? item.likes - 1 : item.likes + 1,
                isLiked: !currentlyLiked
              }
            : item
        )
      );

      if (currentlyLiked) {
        await api.post(`/posts/${postId}/unlike`);
      } else {
        await api.post(`/posts/${postId}/like`);
      }
      
    } catch (error) {
      console.error('Error toggling like:', error);
      setFeed(prevFeed => 
        prevFeed.map(item => 
          item.type === "post" && item.postId === postId 
            ? { 
                ...item, 
                likes: currentlyLiked ? item.likes + 1 : Math.max(0, item.likes - 1),
                isLiked: currentlyLiked
              }
            : item
        )
      );
    }
  };

  // Handle share action (for posts only)
  const handleShare = async (postId: number) => {
    try {
      setFeed(prevFeed => 
        prevFeed.map(item => 
          item.type === "post" && item.postId === postId 
            ? { ...item, shares: item.shares + 1 }
            : item
        )
      );

      await api.post(`/posts/${postId}/share`);
      
    } catch (error) {
      console.error('Error sharing post:', error);
      setFeed(prevFeed => 
        prevFeed.map(item => 
          item.type === "post" && item.postId === postId 
            ? { ...item, shares: Math.max(0, item.shares - 1) }
            : item
        )
      );
    }
  };

  // Handle comment action (for posts only)
  const handleComment = async (postId: number, commentContent: string) => {
    if (!commentContent.trim()) return;

    try {
      const newComment: Comment = {
        postCommentId: Date.now(),
        userId: user!.id,
        postId: postId,
        content: commentContent,
        created_at: new Date().toISOString(),
        user: {
          id: user!.id,
          firstName: user!.firstName,
          lastName: user!.lastName,
          avatar: user!.profile_picture || null,
        }
      };

      setFeed(prevFeed => 
        prevFeed.map(item => 
          item.type === "post" && item.postId === postId 
            ? { 
                ...item, 
                comments: [newComment, ...item.comments]
              }
            : item
        )
      );

      const response = await api.post(`/posts/${postId}/comment`, {
        comment: commentContent
      });

      if (response.status === 201) {
        const actualComment = response.data.comment || response.data;
        setFeed(prevFeed => 
          prevFeed.map(item => 
            item.type === "post" && item.postId === postId 
              ? { 
                  ...item, 
                  comments: item.comments.map(comment => 
                    comment.postCommentId === newComment.postCommentId ? actualComment : comment
                  )
                }
              : item
          )
        );
      }
      
    } catch (error) {
      console.error('Error adding comment:', error);
      setFeed(prevFeed => 
        prevFeed.map(item => 
          item.type === "post" && item.postId === postId 
            ? { 
                ...item, 
                comments: item.comments.filter(comment => comment.id !== Date.now())
              }
            : item
        )
      );
    }
  };

  // Handle delete comment action (for posts only)
  const handleDeleteComment = async (postId: number, commentId: number) => {
    try {
      setFeed(prevFeed => 
        prevFeed.map(item => 
          item.type === "post" && item.postId === postId 
            ? { 
                ...item, 
                comments: item.comments.filter(comment => comment.id !== commentId)
              }
            : item
        )
      );

      await api.delete(`/posts/${postId}/comment/${commentId}`);
      
    } catch (error) {
      console.error('Error deleting comment:', error);
      await fetchFeed();
    }
  };

  // Show modal with likes, comments, or shares (for posts only)
  const showModal = async (type: 'likes' | 'comments' | 'shares', postId: number) => {
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
  };

  // Close modal
  const closeModal = () => {
    setModalData(null);
  };

  // Load new posts and scroll to top
  const loadNewPosts = async () => {
    await fetchFeed();
    setHasNewPosts(false);
    
    if (feedContainerRef.current) {
      feedContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle scroll to detect if user is at top
  const handleScroll = () => {
    if (feedContainerRef.current) {
      const isAtTop = feedContainerRef.current.scrollTop === 0;
      if (isAtTop && hasNewPosts) {
        setHasNewPosts(false);
      }
    }
  };


  // Add these states with your existing useState declarations
const [isChatOpen, setIsChatOpen] = useState(false);
const [selectedChatUser, setSelectedChatUser] = useState<ChatUser | null>(null);
const [unreadMessages, setUnreadMessages] = useState(0);

// Add this useEffect to check for unread messages
useEffect(() => {
  const checkUnreadMessages = async () => {
    try {
      const response = await api.get('/chat/unread-count');
      if (response.status === 200) {
        setUnreadMessages(response.data.count || 0);
      }
    } catch (error) {
      console.error('Error checking unread messages:', error);
    }
  };

  // Check every 30 seconds
  checkUnreadMessages();
  const interval = setInterval(checkUnreadMessages, 30000);

  return () => clearInterval(interval);
}, []);

const handleOpenChat = (userId?: string, userData?: ChatUser) => {
  if (userId && userData) {
    setSelectedChatUser(userData);
  }
  setIsChatOpen(true);
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
          <aside className="w-[280px] hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
            <Sidebar />
          </aside>

          {/* MAIN FEED */}
          <main 
            ref={feedContainerRef}
            className="flex-1 space-y-6 mt-6 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide"
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
                // user={user} 
                user={{
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                profile_picture: user.profileImage || undefined // Map profileImage to profile_picture
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
                    // user={user} 
                    user={{
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                profile_picture: user.profileImage || undefined // Map profileImage to profile_picture
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

            {/* Auto-refresh indicator */}
            {isAutoRefreshing && (
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
                  {modalData.data.map((item: any) => (
                    <div key={item.postId} className="p-4 flex items-center space-x-3">
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