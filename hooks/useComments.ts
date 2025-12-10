// File: /hooks/useComments.ts (Updated)
import { useState, useEffect, useCallback } from 'react';
import postsService from '../lib/posts';
import { Comment, PaginatedResponse } from '../types/app';
import { useAuth } from './useAuth';

interface UseCommentsOptions {
  postId: string;
  initialLimit?: number;
  sortBy?: 'newest' | 'oldest' | 'most_liked';
  autoRefresh?: boolean;
}

export const useComments = (options: UseCommentsOptions) => {
  const { postId, initialLimit = 20, sortBy = 'newest', autoRefresh = true } = options;
  const { user } = useAuth();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadComments = useCallback(async (loadPage: number = 1, isRefresh = false) => {
    if (!postId) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      setError(null);
      
      const response = await postsService.getComments(postId, loadPage, initialLimit);
      
      if (response.success) {
        const { data, has_more } = response.data;
        
        if (isRefresh || loadPage === 1) {
          setComments(data);
        } else {
          setComments(prev => [...prev, ...data]);
        }
        
        setHasMore(has_more);
        setPage(loadPage);
      } else {
        setError(response.error || 'Failed to load comments');
      }
    } catch (err: any) {
      console.error('Error loading comments:', err);
      setError(err.message || 'Failed to load comments');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [postId, initialLimit]);

  const refreshComments = useCallback(() => {
    return loadComments(1, true);
  }, [loadComments]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadComments(page + 1);
    }
  }, [isLoading, hasMore, page, loadComments]);

  const addComment = useCallback(async (content: string, parentId?: string) => {
    if (!user) {
      throw new Error('You must be logged in to comment');
    }
    
    if (!content.trim()) {
      throw new Error('Comment cannot be empty');
    }
    
    try {
      const response = await postsService.addComment(postId, content, parentId);
      
      if (response.success && response.data) {
        const newComment = response.data;
        
        if (parentId) {
          // Add as reply to parent comment
          setComments(prev => prev.map(comment => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies_count: (comment.replies_count || 0) + 1,
                replies: [...(comment.replies || []), newComment],
              };
            }
            return comment;
          }));
        } else {
          // Add as top-level comment
          setComments(prev => [newComment, ...prev]);
        }
        
        return newComment;
      } else {
        throw new Error(response.error || 'Failed to add comment');
      }
    } catch (err: any) {
      console.error('Error adding comment:', err);
      throw err;
    }
  }, [postId, user]);

  const likeComment = useCallback(async (commentId: string) => {
    if (!user) {
      throw new Error('You must be logged in to like comments');
    }
    
    try {
      const response = await postsService.likeComment(commentId);
      
      if (response.success) {
        // Update comment in state
        const updateComment = (comments: Comment[]): Comment[] => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                is_liked: response.data?.liked || false,
                likes_count: response.data?.likes_count || comment.likes_count,
              };
            }
            // Also check replies
            if (comment.replies) {
              return {
                ...comment,
                replies: comment.replies.map(reply => 
                  reply.id === commentId 
                    ? { 
                        ...reply, 
                        is_liked: response.data?.liked || false,
                        likes_count: response.data?.likes_count || reply.likes_count,
                      }
                    : reply
                ),
              };
            }
            return comment;
          });
        };
        
        setComments(updateComment);
      }
      
      return response;
    } catch (err: any) {
      console.error('Error liking comment:', err);
      throw err;
    }
  }, [user]);

  const unlikeComment = useCallback(async (commentId: string) => {
    // Unlike is handled in likeComment function (toggles)
    return likeComment(commentId);
  }, [likeComment]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!user) {
      throw new Error('You must be logged in to delete comments');
    }
    
    try {
      const response = await postsService.deleteComment(commentId);
      
      if (response.success) {
        // Remove comment from state
        const removeComment = (comments: Comment[]): Comment[] => {
          return comments.filter(comment => comment.id !== commentId);
        };
        
        setComments(removeComment);
      }
      
      return response;
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      throw err;
    }
  }, [user]);

  const replyToComment = useCallback(async (commentId: string, content: string) => {
    return addComment(content, commentId);
  }, [addComment]);

  // Subscribe to new comments
  useEffect(() => {
    if (!postId || !autoRefresh) return;
    
    const unsubscribe = postsService.subscribeToComments(postId, (newComment) => {
      // Don't add if it's a reply (handled by parent comment update)
      if (!newComment.parent_id) {
        setComments(prev => [newComment, ...prev]);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [postId, autoRefresh]);

  // Subscribe to comment updates
  useEffect(() => {
    if (!postId || !autoRefresh) return;
    
    const unsubscribe = supabase
      .channel(`comment-updates-${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const updatedComment = payload.new as Comment;
          
          // Update comment in state
          const updateComment = (comments: Comment[]): Comment[] => {
            return comments.map(comment => {
              if (comment.id === updatedComment.id) {
                return updatedComment;
              }
              if (comment.replies) {
                return {
                  ...comment,
                  replies: comment.replies.map(reply => 
                    reply.id === updatedComment.id ? updatedComment : reply
                  ),
                };
              }
              return comment;
            });
          };
          
          setComments(updateComment);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(unsubscribe);
    };
  }, [postId, autoRefresh]);

  useEffect(() => {
    if (postId) {
      loadComments(1);
    }
  }, [postId, loadComments]);

  return {
    comments,
    isLoading,
    error,
    hasMore,
    refreshing,
    refreshComments,
    loadMore,
    addComment,
    likeComment,
    unlikeComment,
    deleteComment,
    replyToComment,
  };
};

export default useComments;