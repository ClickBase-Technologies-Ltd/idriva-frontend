'use client';
import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart,
  faComment,
  faShare,
  faHeart as faHeartSolid,
  faPaperPlane,
  faTrash,
  faUserPlus,
  faUserCheck,
  faEllipsisH,
  faGlobe,
  faUsers,
  faLock,
  faCog,
  faChevronDown,
  faEye,
  faEyeSlash,
  faUserFriends,
  faCheck // Add this import
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import Image from 'next/image';
import api from '@/lib/api';

interface FeedPostProps {
  post: any;
  user: any; // This is the logged-in user
  onLike: (postId: number, currentlyLiked: boolean) => void;
  onShare: (postId: number) => void;
  onComment: (postId: number, commentContent: string) => void;
  onDeleteComment: (postId: number, postCommentId: number) => void;
  onShowModal: (type: 'likes' | 'comments' | 'shares', postId: number) => void;
}

// Privacy settings types
type PostPrivacy = 'public' | 'followers' | 'private';
type CommentPrivacy = 'everyone' | 'followers' | 'none';

export default function FeedPost({ post, user, onLike, onShare, onComment, onDeleteComment, onShowModal }: FeedPostProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [isContentTruncated, setIsContentTruncated] = useState(false);
  const [postPrivacy, setPostPrivacy] = useState<PostPrivacy>(post.privacy || 'public');
  const [commentPrivacy, setCommentPrivacy] = useState<CommentPrivacy>(post.commentPrivacy || 'everyone');
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [postAuthorRole, setPostAuthorRole] = useState<string>('');
  const contentRef = useRef<HTMLParagraphElement>(null);
  const privacyMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  // Check if content needs truncation
  useEffect(() => {
    if (contentRef.current) {
      const lineHeight = parseInt(getComputedStyle(contentRef.current).lineHeight);
      const maxHeight = lineHeight * 4; // Show 4 lines max
      const contentHeight = contentRef.current.scrollHeight;
      
      setIsContentTruncated(contentHeight > maxHeight);
    }
  }, [post.content]);

  // Fetch post author role and follow status
  useEffect(() => {
    const fetchPostAuthorInfo = async () => {
      if (!user || !post.user?.id) return;
      
      try {
        // Fetch author role and follow status in one call
        const authorResponse = await api.get(`/users/${post.user.id}/profile`);
        if (authorResponse.status === 200) {
          const authorData = authorResponse.data;
          setPostAuthorRole(authorData.role || authorData.user?.role || 'Member');
          
          // Set follow status from the profile endpoint response
          // Only set if it's not the current user
          if (user.id !== post.user.id && typeof authorData.isFollowing !== 'undefined') {
            setIsFollowing(authorData.isFollowing || false);
          }
        }
      } catch (error) {
        console.error('Error fetching post author info:', error);
      }
    };
    
    fetchPostAuthorInfo();
  }, [user, post.user?.id]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (privacyMenuRef.current && !privacyMenuRef.current.contains(event.target as Node)) {
        setShowPrivacyMenu(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLike = () => {
    onLike(post.postId, post.isLiked);
  };

  const handleShare = () => {
    onShare(post.postId);
  };

  const handleCommentToggle = () => {
    setShowComments(!showComments);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    // Check if user can comment based on privacy settings
    if (commentPrivacy === 'none') {
      alert('Comments are disabled for this post.');
      return;
    }
    
    if (commentPrivacy === 'followers' && user.id !== post.user.id && !isFollowing) {
      alert('Only followers can comment on this post.');
      return;
    }

    setIsSubmittingComment(true);
    try {
      await onComment(post.postId, commentText);
      setCommentText('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    console.log('Follow button clicked');
    console.log('Current user:', user?.id);
    console.log('Post author:', post.user?.id);
    console.log('Current follow status:', isFollowing);
    
    if (!user || !post.user?.id || user.id === post.user.id) {
      console.log('Cannot follow:', !user ? 'No user' : !post.user?.id ? 'No post author' : 'Cannot follow yourself');
      return;
    }
    
    setIsFollowingLoading(true);
    try {
      if (isFollowing) {
        console.log('Unfollowing user:', post.user.id);
        await api.post(`/users/${post.user.id}/unfollow`);
        setIsFollowing(false);
      } else {
        console.log('Following user:', post.user.id);
        await api.post(`/users/${post.user.id}/follow`);
        setIsFollowing(true);
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        alert(`Error: ${error.response.data.message || 'Something went wrong'}`);
      } else {
        alert('Network error. Please check your connection.');
      }
    } finally {
      setIsFollowingLoading(false);
    }
  };

  const handlePrivacyChange = async (privacy: PostPrivacy) => {
    try {
      const response = await api.put(`/posts/${post.postId}/privacy`, { privacy });
      if (response.status === 200) {
        setPostPrivacy(privacy);
        setShowPrivacyMenu(false);
      }
    } catch (error) {
      console.error('Error updating privacy:', error);
    }
  };

  const handleCommentPrivacyChange = async (privacy: CommentPrivacy) => {
    try {
      const response = await api.put(`/posts/${post.postId}/comment-privacy`, { commentPrivacy: privacy });
      if (response.status === 200) {
        setCommentPrivacy(privacy);
        setShowSettingsMenu(false);
      }
    } catch (error) {
      console.error('Error updating comment privacy:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const canDeleteComment = (comment: any) => {
    return user && (comment.userId === user.id || post.userId === user.id);
  };

  // Format post content with line breaks and paragraphs
  const formatPostContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  // Get privacy icon
  const getPrivacyIcon = (privacy: PostPrivacy) => {
    switch (privacy) {
      case 'public': return faGlobe;
      case 'followers': return faUsers;
      case 'private': return faLock;
      default: return faGlobe;
    }
  };

  // Get privacy text
  const getPrivacyText = (privacy: PostPrivacy) => {
    switch (privacy) {
      case 'public': return 'Public';
      case 'followers': return 'Followers';
      case 'private': return 'Only Me';
      default: return 'Public';
    }
  };

  // Get comment privacy text
  const getCommentPrivacyText = (privacy: CommentPrivacy) => {
    switch (privacy) {
      case 'everyone': return 'Everyone can comment';
      case 'followers': return 'Followers can comment';
      case 'none': return 'Comments disabled';
      default: return 'Everyone can comment';
    }
  };

  // Check if user can see the post based on privacy
  const canViewPost = () => {
    if (!user) return false;
    
    switch (postPrivacy) {
      case 'public':
        return true;
      case 'followers':
        return user.id === post.user.id || isFollowing;
      case 'private':
        return user.id === post.user.id;
      default:
        return true;
    }
  };

  // Show follow button only if user is not the post author
  const showFollowButton = user && post.user && user.id !== post.user.id;

  // Check if current user is the post author (for privacy controls)
  const isPostAuthor = user && post.user && user.id === post.user.id;

  // Render post based on privacy
  if (!canViewPost()) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative">
            <Image
              src="/avatar.png"
              alt="Private user"
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
            />
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">
              Private Account
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              This post is private
            </div>
          </div>
        </div>
        <div className="text-center py-8">
          <FontAwesomeIcon icon={faLock} className="text-4xl text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            This post is only visible to followers of the account.
          </p>
          {user && !isFollowing && (
            <button
              onClick={handleFollow}
              className="mt-4 px-4 py-2 bg-[#0A66C2] text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Follow to see content
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Post Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3 flex-1">
          <div className="relative">
            <Image
              src={
                post.authorAvatar?.startsWith('http') 
                  ? post.authorAvatar 
                  : `${process.env.NEXT_PUBLIC_FILE_URL}/${post.authorAvatar || 'avatar.png'}`
              }
              alt={post.authorName}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
              onError={(e) => {
                e.currentTarget.src = '/avatar.png';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <div className="font-semibold text-gray-900 dark:text-white truncate">
                {post.authorName}
              </div>
              {postPrivacy !== 'public' && (
                <FontAwesomeIcon 
                  icon={getPrivacyIcon(postPrivacy)} 
                  className="w-3 h-3 text-gray-400" 
                  title={getPrivacyText(postPrivacy)}
                />
              )}
            </div>
            {postAuthorRole && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {postAuthorRole.charAt(0).toUpperCase() + postAuthorRole.slice(1)}
              </div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimeAgo(post.created_at)} • {getPrivacyText(postPrivacy)}
            </div>
          </div>
        </div>
        
        {/* Follow Button and Settings */}
        <div className="flex items-center space-x-2">
          {/* Follow Button */}
          {showFollowButton && (
            <button
              onClick={handleFollow}
              disabled={isFollowingLoading}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                isFollowing
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  : 'bg-[#0A66C2] text-white hover:bg-blue-700'
              } flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isFollowingLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FontAwesomeIcon 
                  icon={isFollowing ? faUserCheck : faUserPlus} 
                  className="w-3.5 h-3.5" 
                />
              )}
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          
          {/* Post Settings (for post author only) */}
          {isPostAuthor && (
            <div className="relative" ref={settingsMenuRef}>
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FontAwesomeIcon icon={faCog} className="w-4 h-4" />
              </button>
              
              {showSettingsMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  {/* Post Privacy Settings */}
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Post Visibility
                  </div>
                  {(['public', 'followers', 'private'] as PostPrivacy[]).map((privacy) => (
                    <button
                      key={privacy}
                      onClick={() => handlePrivacyChange(privacy)}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${
                        postPrivacy === privacy
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={getPrivacyIcon(privacy)} className="w-4 h-4 mr-3" />
                        {getPrivacyText(privacy)}
                      </div>
                      {postPrivacy === privacy && (
                        <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-blue-500" />
                      )}
                    </button>
                  ))}
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  
                  {/* Comment Privacy Settings */}
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Comment Settings
                  </div>
                  {(['everyone', 'followers', 'none'] as CommentPrivacy[]).map((privacy) => (
                    <button
                      key={privacy}
                      onClick={() => handleCommentPrivacyChange(privacy)}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${
                        commentPrivacy === privacy
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <FontAwesomeIcon 
                          icon={privacy === 'everyone' ? faComment : privacy === 'followers' ? faUserFriends : faEyeSlash} 
                          className="w-4 h-4 mr-3" 
                        />
                        {privacy === 'everyone' ? 'Everyone' : privacy === 'followers' ? 'Followers' : 'No one'}
                      </div>
                      {commentPrivacy === privacy && (
                        <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Quick Privacy Toggle (for post author) */}
          {isPostAuthor && (
            <div className="relative" ref={privacyMenuRef}>
              <button
                onClick={() => setShowPrivacyMenu(!showPrivacyMenu)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <FontAwesomeIcon icon={getPrivacyIcon(postPrivacy)} className="w-4 h-4 mr-1" />
                <FontAwesomeIcon icon={faChevronDown} className="w-3 h-3" />
              </button>
              
              {showPrivacyMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  {(['public', 'followers', 'private'] as PostPrivacy[]).map((privacy) => (
                    <button
                      key={privacy}
                      onClick={() => handlePrivacyChange(privacy)}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                        postPrivacy === privacy
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <FontAwesomeIcon icon={getPrivacyIcon(privacy)} className="w-4 h-4 mr-3" />
                      {getPrivacyText(privacy)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Content with Truncation */}
      <div className="mb-4 relative">
        <div 
          ref={contentRef}
          className={`text-gray-900 dark:text-white whitespace-pre-line break-words ${
            !showFullContent && isContentTruncated ? 'line-clamp-4' : ''
          }`}
          style={{ 
            lineHeight: '1.6',
            maxHeight: !showFullContent && isContentTruncated ? '6.4em' : 'none',
            overflow: 'hidden'
          }}
        >
          {formatPostContent(post.content)}
        </div>
        
        {/* Show More/Less Button */}
        {isContentTruncated && (
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="mt-2 text-[#0A66C2] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1"
          >
            <FontAwesomeIcon icon={faEllipsisH} className="w-3 h-3" />
            {showFullContent ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Post Image */}
      {post.image_url && (
        <div className="mb-4">
          <div className="relative w-full h-auto max-h-96 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
            <Image 
              src={
                post.image_url?.startsWith('http')
                  ? post.image_url
                  : `${process.env.NEXT_PUBLIC_FILE_URL}${post.image_url}`
              } 
              alt="Post image"
              width={800}
              height={400}
              className="w-full h-auto object-cover rounded-lg hover:opacity-95 transition-opacity"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.jpg';
              }}
            />
          </div>
        </div>
      )}

      {/* Comment Privacy Info */}
      {commentPrivacy !== 'everyone' && (
        <div className="mb-3 flex items-center text-xs text-gray-500 dark:text-gray-400">
          <FontAwesomeIcon 
            icon={commentPrivacy === 'followers' ? faUserFriends : faEyeSlash} 
            className="w-3 h-3 mr-1.5" 
          />
          {getCommentPrivacyText(commentPrivacy)}
        </div>
      )}

      {/* Post Stats - Clickable Links */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
        <div className="flex space-x-4">
          <button
            onClick={() => onShowModal('likes', post.postId)}
            className="hover:text-[#0A66C2] dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            {post.likes} {post.likes === 1 ? 'like' : 'likes'}
          </button>
          <button
            onClick={() => onShowModal('comments', post.postId)}
            className="hover:text-[#0A66C2] dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
          </button>
          <button
            onClick={() => onShowModal('shares', post.postId)}
            className="hover:text-[#0A66C2] dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            {post.shares} {post.shares === 1 ? 'share' : 'shares'}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex border-t border-gray-200 dark:border-gray-700 pt-3">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${
            post.isLiked 
              ? 'text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
          }`}
        >
          <FontAwesomeIcon 
            icon={post.isLiked ? faHeartSolid : faHeartRegular} 
            className={`w-5 h-5 ${post.isLiked ? 'scale-110' : ''}`}
          />
          <span className="font-medium">{post.isLiked ? 'Liked' : 'Like'}</span>
        </button>

        <button
          onClick={handleCommentToggle}
          disabled={commentPrivacy === 'none'}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${
            commentPrivacy === 'none'
              ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
          }`}
          title={commentPrivacy === 'none' ? 'Comments are disabled' : ''}
        >
          <FontAwesomeIcon icon={faComment} className="w-5 h-5" />
          <span className="font-medium">Comment</span>
        </button>

        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all"
        >
          <FontAwesomeIcon icon={faShare} className="w-5 h-5" />
          <span className="font-medium">Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          {/* Add Comment Form - with privacy check */}
          {commentPrivacy !== 'none' ? (
            <form onSubmit={handleSubmitComment} className="mb-4">
              <div className="flex space-x-3">
                <div className="relative">
                  <Image
                    src={
                      user?.profile_picture
                        ? `${process.env.NEXT_PUBLIC_FILE_URL}/${user.profile_picture}`
                        : '/avatar.png'
                    }
                    alt={`${user?.firstName}'s profile picture`}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                    onError={(e) => {
                      e.currentTarget.src = '/avatar.png';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={
                      commentPrivacy === 'followers' && user.id !== post.user.id && !isFollowing
                        ? 'Follow to comment...'
                        : 'Write a comment...'
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-full text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmittingComment || (commentPrivacy === 'followers' && user.id !== post.user.id && !isFollowing)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!commentText.trim() || isSubmittingComment || (commentPrivacy === 'followers' && user.id !== post.user.id && !isFollowing)}
                  className="px-4 py-2.5 bg-[#0A66C2] text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 min-w-[80px] justify-center"
                >
                  {isSubmittingComment ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPaperPlane} className="w-3.5 h-3.5" />
                      <span>Post</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-750 rounded-lg text-center">
              <FontAwesomeIcon icon={faEyeSlash} className="text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Comments are disabled for this post.
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {post.comments.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                {commentPrivacy === 'none' 
                  ? 'Comments are disabled for this post.'
                  : 'No comments yet. Be the first to comment!'}
              </div>
            ) : (
              post.comments.map((comment: any) => (
                <div key={comment.postCommentId} className="flex space-x-3 group">
                  <div className="relative">
                    <Image
                      src={
                        comment.user?.avatar
                          ? `${process.env.NEXT_PUBLIC_FILE_URL}/${comment.user.avatar}`
                          : '/avatar.png'
                      }
                      alt={comment.user?.firstName}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                      onError={(e) => {
                        e.currentTarget.src = '/avatar.png';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-sm text-gray-900 dark:text-white">
                            {comment.user?.firstName} {comment.user?.lastName}
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm mt-1.5 leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {formatTimeAgo(comment.created_at)}
                          </span>
                          {canDeleteComment(comment) && (
                            <button
                              onClick={() => onDeleteComment(post.postId, comment.postCommentId)}
                              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-opacity p-1"
                              title="Delete comment"
                            >
                              <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}