// hooks/useFeedOptimistic.ts
import { useState, useCallback } from 'react';
import { FeedEvent } from '@/utils/feedEvents';
import { FeedItem } from '@/types/feed';

export const useFeedOptimistic = (initialFeed: FeedItem[]) => {
  const [feed, setFeed] = useState<FeedItem[]>(initialFeed);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, any>>({});

  // Optimistically add post
  const optimisticallyAddPost = useCallback((newPost: any) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticPost: FeedItem = {
      id: tempId,
      type: 'post',
      postId: -Date.now(), // Temporary negative ID
      authorName: `${newPost.authorFirstName} ${newPost.authorLastName}`,
      authorAvatar: newPost.authorAvatar || '/avatar.png',
      created_at: new Date().toISOString(),
      content: newPost.content,
      image_url: newPost.image_url,
      likes: 0,
      comments: [],
      shares: 0,
      isLiked: false,
      _isOptimistic: true,
    };

    setFeed(prev => [optimisticPost, ...prev]);
    setOptimisticUpdates(prev => ({
      ...prev,
      [tempId]: optimisticPost
    }));

    return tempId;
  }, []);

  // Replace optimistic post with real data
  const replaceOptimisticPost = useCallback((tempId: string, realPost: any) => {
    setFeed(prev => prev.map(item => 
      item.id === tempId ? {
        ...realPost,
        id: `post-${realPost.postId}`,
        type: 'post' as const,
      } : item
    ));
    setOptimisticUpdates(prev => {
      const newUpdates = { ...prev };
      delete newUpdates[tempId];
      return newUpdates;
    });
  }, []);

  // Handle post creation
  const handlePostCreated = useCallback((event: FeedEvent) => {
    const { post } = event.data;
    // Check if this post already exists (from optimistic update)
    const existingIndex = feed.findIndex(item => 
      item.type === 'post' && item.postId === post.postId
    );

    if (existingIndex === -1) {
      setFeed(prev => [{
        id: `post-${post.postId}`,
        type: 'post',
        postId: post.postId,
        authorName: `${post.author.firstName} ${post.author.lastName}`,
        authorAvatar: post.author.avatar || '/avatar.png',
        created_at: post.created_at,
        content: post.content,
        image_url: post.image_url,
        likes: 0,
        comments: [],
        shares: 0,
        isLiked: false,
      }, ...prev]);
    }
  }, [feed]);

  return {
    feed,
    setFeed,
    optimisticallyAddPost,
    replaceOptimisticPost,
    handlePostCreated,
    optimisticUpdates,
  };
};