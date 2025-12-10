// lib/posts.ts
import { supabase } from './supabase';
import { Post, CreatePostInput, ApiResponse, PaginatedResponse } from '../types/app';

/**
 * Posts Service - Real-time post operations
 */

export const postsService = {
  // ==================== CREATE ====================
  
  /**
   * Create a new post
   */
  createPost: async (input: CreatePostInput): Promise<ApiResponse<Post>> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error('User not authenticated');
      }
      
      const { content, media_urls, tags, visibility = 'public', use_nebula = false } = input;
      
      // Basic validation
      if (!content.trim()) {
        return {
          success: false,
          error: 'Post content cannot be empty',
        };
      }
      
      if (content.length > 280) {
        return {
          success: false,
          error: 'Post content must be less than 280 characters',
        };
      }
      
      // Prepare post data
      const postData: any = {
        user_id: userData.user.id,
        content: content.trim(),
        media_urls: media_urls || null,
        tags: tags || null,
        visibility,
        is_enhanced: use_nebula,
      };
      
      // If using Nebula AI, enhance the content
      if (use_nebula) {
        // This will be implemented when Nebula AI is ready
        // const enhancedContent = await enhanceContent(content);
        // postData.nebula_enhanced_content = enhancedContent;
      }
      
      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select(`
          *,
          user:users(id, username, display_name, avatar_url)
        `)
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        data,
        message: 'Post created successfully!',
      };
    } catch (error: any) {
      console.error('Create post error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create post',
      };
    }
  },
  
  // ==================== READ ====================
  
  /**
   * Get posts with pagination
   */
  getPosts: async (
    page: number = 1,
    limit: number = 20,
    userId?: string
  ): Promise<ApiResponse<PaginatedResponse<Post>>> => {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      let query = supabase
        .from('posts')
        .select(`
          *,
          user:users(id, username, display_name, avatar_url)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });
      
      // Filter by user if provided
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error, count } = await query.range(from, to);
      
      if (error) throw error;
      
      // Check if user has liked/echoed each post
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;
      
      if (currentUserId && data) {
        const postIds = data.map(post => post.id);
        
        // Get user's likes
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', currentUserId)
          .in('post_id', postIds);
        
        // Get user's echoes
        const { data: echoes } = await supabase
          .from('echoes')
          .select('post_id')
          .eq('user_id', currentUserId)
          .in('post_id', postIds);
        
        const likedPostIds = new Set(likes?.map(like => like.post_id) || []);
        const echoedPostIds = new Set(echoes?.map(echo => echo.post_id) || []);
        
        // Add interaction flags
        data.forEach(post => {
          (post as any).is_liked = likedPostIds.has(post.id);
          (post as any).is_echoed = echoedPostIds.has(post.id);
        });
      }
      
      return {
        success: true,
        data: {
          data: data || [],
          page,
          limit,
          total: count || 0,
          has_more: (data?.length || 0) === limit,
        },
      };
    } catch (error: any) {
      console.error('Get posts error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch posts',
      };
    }
  },
  
  /**
   * Get trending posts
   */
  getTrendingPosts: async (limit: number = 20): Promise<ApiResponse<Post[]>> => {
    try {
      const { data, error } = await supabase.rpc('get_trending_posts', {
        hours: 24,
        limit_count: limit,
      });
      
      if (error) throw error;
      
      return {
        success: true,
        data: data || [],
      };
    } catch (error: any) {
      console.error('Get trending posts error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch trending posts',
      };
    }
  },
  
  /**
   * Get a single post by ID
   */
  getPostById: async (postId: string): Promise<ApiResponse<Post>> => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(id, username, display_name, avatar_url)
        `)
        .eq('id', postId)
        .single();
      
      if (error) throw error;
      
      // Check if current user has liked/echoed
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;
      
      if (currentUserId) {
        const [{ data: likeData }, { data: echoData }] = await Promise.all([
          supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', currentUserId)
            .single(),
          supabase
            .from('echoes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', currentUserId)
            .single(),
        ]);
        
        (data as any).is_liked = !!likeData;
        (data as any).is_echoed = !!echoData;
      }
      
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('Get post by ID error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch post',
      };
    }
  },
  
  // ==================== UPDATE ====================
  
  /**
   * Update a post
   */
  updatePost: async (
    postId: string,
    updates: Partial<Post>
  ): Promise<ApiResponse<Post>> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error('User not authenticated');
      }
      
      // Verify ownership
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();
      
      if (!post) {
        throw new Error('Post not found');
      }
      
      if (post.user_id !== userData.user.id) {
        throw new Error('You can only update your own posts');
      }
      
      const { data, error } = await supabase
        .from('posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .select(`
          *,
          user:users(id, username, display_name, avatar_url)
        `)
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        data,
        message: 'Post updated successfully',
      };
    } catch (error: any) {
      console.error('Update post error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update post',
      };
    }
  },
  
  // ==================== DELETE ====================
  
  /**
   * Delete a post
   */
  deletePost: async (postId: string): Promise<ApiResponse> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error('User not authenticated');
      }
      
      // Verify ownership or admin status
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();
      
      if (!post) {
        throw new Error('Post not found');
      }
      
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', userData.user.id)
        .single();
      
      if (post.user_id !== userData.user.id && user?.role !== 'admin') {
        throw new Error('You can only delete your own posts');
      }
      
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
      
      if (error) throw error;
      
      return {
        success: true,
        message: 'Post deleted successfully',
      };
    } catch (error: any) {
      console.error('Delete post error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete post',
      };
    }
  },
  
  // ==================== INTERACTIONS ====================
  
  /**
   * Like a post
   */
  likePost: async (postId: string): Promise<ApiResponse> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error('User not authenticated');
      }
      
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userData.user.id)
        .single();
      
      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);
        
        if (error) throw error;
        
        // Decrement likes count
        await supabase.rpc('decrement_likes', { post_id: postId });
        
        return {
          success: true,
          message: 'Post unliked',
        };
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            user_id: userData.user.id,
            post_id: postId,
          });
        
        if (error) throw error;
        
        // Increment likes count
        await supabase.rpc('increment_likes', { post_id: postId });
        
        return {
          success: true,
          message: 'Post liked',
        };
      }
    } catch (error: any) {
      console.error('Like post error:', error);
      return {
        success: false,
        error: error.message || 'Failed to like post',
      };
    }
  },
  
  /**
   * Echo a post
   */
  echoPost: async (postId: string): Promise<ApiResponse> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error('User not authenticated');
      }
      
      // Check if already echoed
      const { data: existingEcho } = await supabase
        .from('echoes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userData.user.id)
        .single();
      
      if (existingEcho) {
        // Remove echo
        const { error } = await supabase
          .from('echoes')
          .delete()
          .eq('id', existingEcho.id);
        
        if (error) throw error;
        
        // Decrement echoes count
        await supabase.rpc('decrement_echoes', { post_id: postId });
        
        return {
          success: true,
          message: 'Echo removed',
        };
      } else {
        // Echo
        const { error } = await supabase
          .from('echoes')
          .insert({
            user_id: userData.user.id,
            post_id: postId,
          });
        
        if (error) throw error;
        
        // Increment echoes count
        await supabase.rpc('increment_echoes', { post_id: postId });
        
        return {
          success: true,
          message: 'Post echoed',
        };
      }
    } catch (error: any) {
      console.error('Echo post error:', error);
      return {
        success: false,
        error: error.message || 'Failed to echo post',
      };
    }
  },
  
  // ==================== COMMENTS ====================
  
  /**
   * Get comments for a post
   */
  getComments: async (
    postId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<any>>> => {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(id, username, display_name, avatar_url)
        `, { count: 'exact' })
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      return {
        success: true,
        data: {
          data: data || [],
          page,
          limit,
          total: count || 0,
          has_more: (data?.length || 0) === limit,
        },
      };
    } catch (error: any) {
      console.error('Get comments error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch comments',
      };
    }
  },
  
  /**
   * Add a comment
   */
  addComment: async (
    postId: string,
    content: string,
    parentId?: string
  ): Promise<ApiResponse> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error('User not authenticated');
      }
      
      if (!content.trim()) {
        return {
          success: false,
          error: 'Comment cannot be empty',
        };
      }
      
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userData.user.id,
          content: content.trim(),
          parent_id: parentId || null,
        });
      
      if (error) throw error;
      
      // Increment comments count
      await supabase.rpc('increment_comments', { post_id: postId });
      
      return {
        success: true,
        message: 'Comment added',
      };
    } catch (error: any) {
      console.error('Add comment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to add comment',
      };
    }
  },
  
  // ==================== REALTIME SUBSCRIPTIONS ====================
  
  /**
   * Subscribe to new posts
   */
  subscribeToNewPosts: (
    callback: (post: Post) => void,
    userId?: string
  ) => {
    let query = supabase
      .channel('new-posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        async (payload) => {
          // Fetch the full post with user data
          const { data } = await supabase
            .from('posts')
            .select(`
              *,
              user:users(id, username, display_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (data) {
            callback(data);
          }
        }
      );
    
    // Filter by user if provided
    if (userId) {
      query = query.filter(`user_id=eq.${userId}`);
    }
    
    return query.subscribe();
  },
  
  /**
   * Subscribe to post updates (likes, echoes, comments)
   */
  subscribeToPostUpdates: (
    postId: string,
    callbacks: {
      onLikeUpdate?: (likesCount: number) => void;
      onEchoUpdate?: (echoesCount: number) => void;
      onCommentUpdate?: (commentsCount: number) => void;
    }
  ) => {
    const channel = supabase
      .channel(`post-${postId}-updates`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
          filter: `id=eq.${postId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          
          if (callbacks.onLikeUpdate && newData.likes_count !== undefined) {
            callbacks.onLikeUpdate(newData.likes_count);
          }
          
          if (callbacks.onEchoUpdate && newData.echoes_count !== undefined) {
            callbacks.onEchoUpdate(newData.echoes_count);
          }
          
          if (callbacks.onCommentUpdate && newData.comments_count !== undefined) {
            callbacks.onCommentUpdate(newData.comments_count);
          }
        }
      );
    
    return channel.subscribe();
  },
  
  /**
   * Subscribe to user's posts
   */
  subscribeToUserPosts: (userId: string, callback: (post: Post) => void) => {
    return supabase
      .channel(`user-${userId}-posts`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('posts')
            .select(`
              *,
              user:users(id, username, display_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (data) {
            callback(data);
          }
        }
      )
      .subscribe();
  },
};

export default postsService;