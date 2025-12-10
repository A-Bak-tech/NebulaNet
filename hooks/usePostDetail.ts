// File: /hooks/usePostDetail.ts
import { useState, useEffect, useCallback } from 'react';
import { posts } from '../lib/posts';
import { PostDetail } from '../types/posts';
import { useAuth } from './useAuth';

export const usePostDetail = (postId: string) => {
  const { user } = useAuth();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await posts.getPostDetail(postId, user?.id);
      setPost(data);
    } catch (err: any) {
      console.error('Error fetching post:', err);
      setError(err.message || 'Failed to load post');
      setPost(null);
    } finally {
      setIsLoading(false);
    }
  }, [postId, user?.id]);

  const refreshPost = useCallback(() => {
    return fetchPost();
  }, [fetchPost]);

  const likePost = useCallback(async () => {
    if (!user) throw new Error('You must be logged in to like posts');
    if (!post) return;

    try {
      const updatedPost = { ...post };
      if (post.is_liked) {
        await posts.unlikePost(postId, user.id);
        updatedPost.is_liked = false;
        updatedPost.likes_count = Math.max(0, post.likes_count - 1);
      } else {
        await posts.likePost(postId, user.id);
        updatedPost.is_liked = true;
        updatedPost.likes_count = post.likes_count + 1;
      }
      setPost(updatedPost);
    } catch (err: any) {
      console.error('Error liking post:', err);
      throw err;
    }
  }, [postId, post, user]);

  const echoPost = useCallback(async () => {
    if (!user) throw new Error('You must be logged in to echo posts');
    if (!post) return;

    try {
      const updatedPost = { ...post };
      if (post.is_echoed) {
        await posts.deleteEcho(postId, user.id);
        updatedPost.is_echoed = false;
        updatedPost.echoes_count = Math.max(0, post.echoes_count - 1);
      } else {
        await posts.echoPost(postId, user.id);
        updatedPost.is_echoed = true;
        updatedPost.echoes_count = post.echoes_count + 1;
      }
      setPost(updatedPost);
    } catch (err: any) {
      console.error('Error echoing post:', err);
      throw err;
    }
  }, [postId, post, user]);

  const bookmarkPost = useCallback(async () => {
    if (!user) throw new Error('You must be logged in to bookmark posts');
    if (!post) return;

    try {
      const updatedPost = { ...post };
      if (post.is_bookmarked) {
        await posts.removeBookmark(postId, user.id);
        updatedPost.is_bookmarked = false;
      } else {
        await posts.bookmarkPost(postId, user.id);
        updatedPost.is_bookmarked = true;
      }
      setPost(updatedPost);
    } catch (err: any) {
      console.error('Error bookmarking post:', err);
      throw err;
    }
  }, [postId, post, user]);

  const deletePost = useCallback(async () => {
    if (!user) throw new Error('You must be logged in to delete posts');
    
    try {
      await posts.deletePost(postId, user.id);
      setPost(null);
    } catch (err: any) {
      console.error('Error deleting post:', err);
      throw err;
    }
  }, [postId, user]);

  // Subscribe to post updates
  useEffect(() => {
    if (!postId) return;

    const unsubscribe = posts.subscribeToPost(postId, (updatedPost) => {
      setPost(updatedPost);
    });

    return () => {
      unsubscribe();
    };
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return {
    post,
    isLoading,
    error,
    refreshPost,
    likePost,
    unlikePost: likePost, // Same function, just different name for clarity
    echoPost,
    deleteEcho: echoPost, // Same function
    bookmarkPost,
    removeBookmark: bookmarkPost, // Same function
    deletePost,
  };
};