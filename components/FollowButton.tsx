'use client';

import { useState } from 'react';
import api from '@/lib/api';

interface FollowButtonProps {
  targetUserId: string;
  currentUserId: string;
  initialFollowing?: boolean;
  followerCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  onFollowChange?: (isFollowing: boolean, newCount: number) => void;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  currentUserId,
  initialFollowing = false,
  followerCount = 0,
  size = 'md',
  showCount = false,
  onFollowChange
}) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(followerCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Don't show follow button for self
  if (targetUserId === currentUserId) return null;

  const handleFollowToggle = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError('');

      const newFollowingState = !isFollowing;
      const newCount = newFollowingState ? count + 1 : Math.max(0, count - 1);

      // Optimistic update
      setIsFollowing(newFollowingState);
      setCount(newCount);
      onFollowChange?.(newFollowingState, newCount);

      if (newFollowingState) {
        await api.post(`/users/${targetUserId}/follow`);
      } else {
        await api.post(`/users/${targetUserId}/unfollow`);
      }

    } catch (error) {
      console.error('Error toggling follow:', error);
      
      // Revert optimistic update
      setIsFollowing(isFollowing);
      setCount(followerCount);
      onFollowChange?.(isFollowing, followerCount);
      
      setError('Failed to update follow status');
      
      // Clear error after 3 seconds
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleFollowToggle}
        disabled={loading}
        className={`${sizeClasses[size]} font-medium rounded-lg transition-colors ${
          isFollowing
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing
          </span>
        ) : isFollowing ? (
          'Following'
        ) : (
          'Follow'
        )}
      </button>
      
      {showCount && count > 0 && (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {count} follower{count !== 1 ? 's' : ''}
        </span>
      )}
      
      {error && (
        <div className="absolute top-full mt-1 text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};

export default FollowButton;