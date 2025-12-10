// File: /hooks/usePosts.ts
import { useState, useEffect, useCallback } from 'react';
import { Post, PaginatedResponse } from '../types/app';
import postsService from '../lib/posts';
import { useAuth } from './useAuth';

interface UsePostsOptions {
  userId?: string;
  type?: 'posts' | 'likes' | 'echoes';
  initialLimit?: number;
  initialPage?: number;
}

export const usePosts = (options: UsePostsOptions = {}) => {
  const { userId, type = 'posts', initialLimit = 20, initialPage = 1 } = options;
  const { user } = useAuth();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = useCallback(async (loadPage: number = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      setError(null);
      
      const response = await postsService.getPosts(loadPage, initialLimit, userId, type);
      
      if (response.success) {
        const { data, has_more } = response.data;
        
        if (isRefresh || loadPage === 1) {
          setPosts(data);
        } else {
          setPosts(prev => [...prev, ...data]);
        }
        
        setHasMore(has_more);
        setPage(loadPage);
      } else {
        setError(response.error || 'Failed to load posts');
      }
    } catch (err: any) {
      console.error('Error loading posts:', err);
      setError(err.message || 'Failed to load posts');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [userId, type, initialLimit]);

  const refreshPosts = useCallback(() => {
    return loadPosts(1, true);
  }, [loadPosts]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadPosts(page + 1);
    }
  }, [isLoading, hasMore, page, loadPosts]);

  const likePost = useCallback(async (postId: string) => {
    try {
      const response = await postsService.likePost(postId);
      
      if (response.success) {
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              is_liked: response.data?.liked || false,
              likes_count: response.data?.likes_count || post.likes_count,
            };
          }
          return post;
        }));
      }
      
      return response;
    } catch (error: any) {
      console.error('Error liking post:', error);
      throw error;
    }
  }, []);

  const echoPost = useCallback(async (postId: string) => {
    try {
      const response = await postsService.echoPost(postId);
      
      if (response.success) {
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              is_echoed: response.data?.echoed || false,
              echoes_count: response.data?.echoes_count || post.echoes_count,
            };
          }
          return post;
        }));
      }
      
      return response;
    } catch (error: any) {
      console.error('Error echoing post:', error);
      throw error;
    }
  }, []);

  const bookmarkPost = useCallback(async (postId: string) => {
    try {
      const response = await postsService.bookmarkPost(postId);
      
      if (response.success) {
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              is_bookmarked: response.data?.bookmarked || false,
            };
          }
          return post;
        }));
      }
      
      return response;
    } catch (error: any) {
      console.error('Error bookmarking post:', error);
      throw error;
    }
  }, []);

  // Subscribe to new posts if viewing user's own posts
  useEffect(() => {
    if (!userId || userId !== user?.id) return;
    
    const unsubscribe = postsService.subscribeToUserPosts(userId, (newPost) => {
      setPosts(prev => [newPost, ...prev]);
    });
    
    return () => {
      unsubscribe();
    };
  }, [userId, user?.id]);

  // Subscribe to post updates
  useEffect(() => {
    const unsubscribeFunctions: Array<() => void> = [];
    
    posts.forEach(post => {
      const unsubscribe = postsService.subscribeToPostUpdates(post.id, {
        onLikeUpdate: (likesCount) => {
          setPosts(prev => prev.map(p => 
            p.id === post.id ? { ...p, likes_count: likesCount } : p
          ));
        },
        onEchoUpdate: (echoesCount) => {
          setPosts(prev => prev.map(p => 
            p.id === post.id ? { ...p, echoes_count: echoesCount } : p
          ));
        },
        onCommentUpdate: (commentsCount) => {
          setPosts(prev => prev.map(p => 
            p.id === post.id ? { ...p, comments_count: commentsCount } : p
          ));
        },
      });
      
      unsubscribeFunctions.push(unsubscribe);
    });
    
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [posts]);

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  return {
    posts,
    isLoading,
    error,
    hasMore,
    refreshing,
    refreshPosts,
    loadMore,
    likePost,
    echoPost,
    bookmarkPost,
  };
};

export default usePosts;