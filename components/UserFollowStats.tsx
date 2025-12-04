'use client';

import { useState } from 'react';
import FollowersFollowing from './FollowersFollowing';

interface UserFollowStatsProps {
  userId: string;
  followersCount: number;
  followingCount: number;
  showButtons?: boolean;
  isCurrentUser?: boolean;
}

const UserFollowStats: React.FC<UserFollowStatsProps> = ({
  userId,
  followersCount,
  followingCount,
  showButtons = true,
  isCurrentUser = false
}) => {
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'followers' | 'following'>('followers');

  const openModal = (tab: 'followers' | 'following') => {
    setModalTab(tab);
    setShowModal(true);
  };

  return (
    <>
      <div className="flex items-center space-x-6 mb-4">
        <button
          onClick={() => openModal('followers')}
          className="text-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <div className="text-l font-bold text-gray-900 dark:text-white cursor-pointer disabled:cursor-not-allowed">
            {followersCount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Followers
          </div>
        </button>
        
        <button
          onClick={() => openModal('following')}
          className="text-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          <div className="text-l font-bold text-gray-900 dark:text-white">
            {followingCount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Following
          </div>
        </button>
        
        {showButtons && (
          <div className="flex items-center space-x-2 ml-auto">
            {!isCurrentUser && (
              <>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Follow
                </button>
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Message
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <FollowersFollowing
          currentUserId={userId}
          initialTab={modalTab}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default UserFollowStats;