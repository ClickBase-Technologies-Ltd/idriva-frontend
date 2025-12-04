'use client';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart,
  faComment,
  faShare,
  faHeart as faHeartSolid,
  faPaperPlane,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';

interface FeedPostProps {
  post: any;
  user: any;
  onLike: (postId: number, currentlyLiked: boolean) => void;
  onShare: (postId: number) => void;
  onComment: (postId: number, commentContent: string) => void;
  onDeleteComment: (postId: number, postCommentId: number) => void;
  onShowModal: (type: 'likes' | 'comments' | 'shares', postId: number) => void;
}

export default function FeedPost({ post, user, onLike, onShare, onComment, onDeleteComment, onShowModal }: FeedPostProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
    return date.toLocaleDateString();
  };

  const canDeleteComment = (comment: any) => {
    return user && (comment.userId === user.id || post.userId === user.id);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Post Header */}
      <div className="flex items-center space-x-3 mb-4">
        <img 
          src={post.authorAvatar} 
          alt={post.authorName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <div className="font-semibold text-gray-900 dark:text-white">
            {post.authorName}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatTimeAgo(post.created_at)}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-900 dark:text-white whitespace-pre-line">
          {post.content}
        </p>
      </div>

      {/* Post Image */}
      {post.image_url && (
        <div className="mb-4">
          <img 
            src={post.image_url} 
            alt="Post image"
            className="w-full h-auto rounded-lg max-h-96 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
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
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
            post.isLiked 
              ? 'text-red-600 hover:text-red-700' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <FontAwesomeIcon 
            icon={post.isLiked ? faHeartSolid : faHeartRegular} 
            className="w-5 h-5" 
          />
          <span>{post.isLiked ? 'Liked' : 'Like'}</span>
        </button>

        <button
          onClick={handleCommentToggle}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <FontAwesomeIcon icon={faComment} className="w-5 h-5" />
          <span>Comment</span>
        </button>

        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <FontAwesomeIcon icon={faShare} className="w-5 h-5" />
          <span>Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          {/* Add Comment Form */}
          <form onSubmit={handleSubmitComment} className="mb-4">
            <div className="flex space-x-3">
              <img 
                src={user?.profile_picture || '/avatar.png'} 
                alt="Your avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmittingComment}
                />
              </div>
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmittingComment}
                className="px-4 py-2 bg-[#0A66C2] text-white rounded-full text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4" />
                {isSubmittingComment ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {post.comments.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              post.comments.map((comment: any) => (
                <div key={comment.postId} className="flex space-x-3 group">
                  <img 
                    src={comment.user?.avatar || '/avatar.png'} 
                    alt={comment.user?.firstName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm text-gray-900 dark:text-white">
                          {comment.user?.firstName} {comment.user?.lastName}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimeAgo(comment?.created_at)}
                          </span>
                          {/* {canDeleteComment(comment) && (
                            <button
                              onClick={() => onDeleteComment(post.postId, comment.id)}
                              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                              title="Delete comment"
                            >
                              <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                            </button>
                          )} */}
                        </div>
                       
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                        {comment?.comment}
                      </p>
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