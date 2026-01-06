// hooks/useFeed.js
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export const useFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(0);
      }

      const start = reset ? 0 : page * 10;
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(id, username, full_name, avatar_url),
          likes(count),
          comments(count),
          communities(id, name),
          user_liked:likes!inner(user_id)
        `)
        .order('created_at', { ascending: false })
        .range(start, start + 9);

      if (error) throw error;

      if (reset) {
        setPosts(data || []);
      } else {
        setPosts(prev => [...prev, ...(data || [])]);
      }

      setHasMore(data.length === 10);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = () => {
    setRefreshing(true);
    fetchPosts(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPosts();
    }
  };

  const likePost = async (postId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);
        
        // Update local state
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                likes: [{ count: (post.likes[0]?.count || 1) - 1 }],
                user_liked: []
              }
            : post
        ));
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        // Update local state
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                likes: [{ count: (post.likes[0]?.count || 0) + 1 }],
                user_liked: [{ user_id: user.id }]
              }
            : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const addComment = async (postId, content) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
        })
        .select(`
          *,
          author:profiles(id, username, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Update comment count
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              comments: [{ count: (post.comments[0]?.count || 0) + 1 }]
            }
          : post
      ));

      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchPosts(true);
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          // Add new post to feed
          setPosts(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    posts,
    loading,
    refreshing,
    hasMore,
    fetchPosts,
    refresh,
    loadMore,
    likePost,
    addComment,
  };
};