// services/api.js
import { supabase } from './supabase';

/**
 * Enhanced API service for NebulaNet
 */
export class ApiService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Fetch user's feed with pagination
   */
  async fetchFeed(page = 0, limit = 10) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get posts from followed users and communities
      const { data, error } = await this.supabase
        .from('posts')
        .select(`
          *,
          author:users(*),
          likes:post_likes(count),
          comments:post_comments(count),
          user_liked:post_likes!inner(user_id)
        `)
        .eq('user_liked.user_id', user.id)
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching feed:', error);
      throw error;
    }
  }

  /**
   * Upload image to storage
   */
  async uploadImage(file, bucket = 'posts') {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        path: filePath,
        url: publicUrl,
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Create a new post
   */
  async createPost(content, mediaUrls = [], communityId = null) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content,
          media_urls: mediaUrls,
          community_id: communityId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Like/unlike a post
   */
  async toggleLike(postId) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if already liked
      const { data: existingLike } = await this.supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await this.supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) throw error;
        return { liked: false };
      } else {
        // Like
        const { data, error } = await this.supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return { liked: true, like: data };
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  /**
   * Add comment to post
   */
  async addComment(postId, content, parentCommentId = null) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          parent_comment_id: parentCommentId,
          created_at: new Date().toISOString(),
        })
        .select(`
          *,
          author:users(*)
        `)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Follow/unfollow user
   */
  async toggleFollow(userId) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (user.id === userId) {
        throw new Error('Cannot follow yourself');
      }

      // Check if already following
      const { data: existingFollow } = await this.supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      if (existingFollow) {
        // Unfollow
        const { error } = await this.supabase
          .from('user_follows')
          .delete()
          .eq('id', existingFollow.id);

        if (error) throw error;
        return { following: false };
      } else {
        // Follow
        const { data, error } = await this.supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: userId,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return { following: true, follow: data };
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      throw error;
    }
  }

  /**
   * Search users, posts, communities
   */
  async search(query, type = 'all', page = 0, limit = 20) {
    try {
      let data, error;

      switch (type) {
        case 'users':
          ({ data, error } = await this.supabase
            .from('users')
            .select('*')
            .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
            .range(page * limit, (page + 1) * limit - 1));
          break;

        case 'posts':
          ({ data, error } = await this.supabase
            .from('posts')
            .select(`
              *,
              author:users(*)
            `)
            .or(`content.ilike.%${query}%`)
            .order('created_at', { ascending: false })
            .range(page * limit, (page + 1) * limit - 1));
          break;

        case 'communities':
          ({ data, error } = await this.supabase
            .from('communities')
            .select('*')
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            .range(page * limit, (page + 1) * limit - 1));
          break;

        default: // 'all'
          // Search across all types
          const [users, posts, communities] = await Promise.all([
            this.search(query, 'users', page, limit),
            this.search(query, 'posts', page, limit),
            this.search(query, 'communities', page, limit),
          ]);
          
          return {
            users,
            posts,
            communities,
          };
      }

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching:', error);
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  async getNotifications(limit = 20, offset = 0) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('notifications')
        .select(`
          *,
          sender:users!notifications_sender_id_fkey(*),
          post:posts(*),
          comment:post_comments(*)
        `)
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Mark as read
      await this.markNotificationsAsRead(data.map(n => n.id));

      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsAsRead(notificationIds) {
    try {
      if (!notificationIds.length) return;

      const { error } = await this.supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', notificationIds);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId) {
    try {
      const [
        postsCount,
        followersCount,
        followingCount,
        likesCount,
      ] = await Promise.all([
        this.supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        this.supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', userId),
        this.supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', userId),
        this.supabase
          .from('post_likes')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', userId), // This needs adjustment based on your schema
      ]);

      return {
        posts: postsCount.count || 0,
        followers: followersCount.count || 0,
        following: followingCount.count || 0,
        likes: likesCount.count || 0,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Handle API errors consistently
   */
  handleError(error) {
    console.error('API Error:', error);
    
    if (error.message === 'User not authenticated') {
      return {
        success: false,
        error: 'Please sign in to continue',
        code: 'AUTH_REQUIRED',
      };
    }

    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      code: error.code || 'UNKNOWN_ERROR',
    };
  }
}

// Singleton instance
const apiService = new ApiService();
export default apiService;