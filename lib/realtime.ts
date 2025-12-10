// lib/realtime.ts
import { supabase } from './supabase';
import { Post, Notification, User } from '../types/app';

export const realtimeService = {
  // ==================== POSTS ====================
  
  /**
   * Subscribe to all public posts
   */
  subscribeToPublicPosts: (callback: (post: Post) => void) => {
    const channel = supabase
      .channel('public-posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: 'visibility=eq.public',
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
    
    return channel.subscribe();
  },
  
  /**
   * Subscribe to posts from followed users
   */
  subscribeToFollowedPosts: (userId: string, callback: (post: Post) => void) => {
    // First, get the list of followed users
    return supabase
      .channel(`followed-posts-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        async (payload) => {
          // Check if the post is from a followed user
          const { data: isFollowing } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', userId)
            .eq('following_id', payload.new.user_id)
            .single();
          
          if (isFollowing) {
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
        }
      )
      .subscribe();
  },
  
  // ==================== NOTIFICATIONS ====================
  
  /**
   * Subscribe to user notifications
   */
  subscribeToNotifications: (userId: string, callback: (notification: Notification) => void) => {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // Fetch the full notification with actor data
          const { data } = await supabase
            .from('notifications')
            .select(`
              *,
              actor:users(id, username, display_name, avatar_url),
              post:posts(id, content)
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (data) {
            callback(data);
          }
        }
      );
    
    return channel.subscribe();
  },
  
  // ==================== MESSAGES ====================
  
  /**
   * Subscribe to direct messages
   */
  subscribeToMessages: (userId: string, callback: (message: any) => void) => {
    const channel = supabase
      .channel(`messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      );
    
    return channel.subscribe();
  },
  
  // ==================== USER PRESENCE ====================
  
  /**
   * Track user presence (online/offline status)
   */
  trackUserPresence: (userId: string, onPresenceChange: (users: any[]) => void) => {
    const channel = supabase.channel(`presence-${userId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });
    
    // Subscribe to presence changes
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users = Object.values(state).flat();
      onPresenceChange(users);
    });
    
    // Set initial presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
        });
      }
    });
    
    return channel;
  },
  
  // ==================== TYPING INDICATORS ====================
  
  /**
   * Subscribe to typing indicators in conversations
   */
  subscribeToTyping: (conversationId: string, callback: (data: { userId: string; isTyping: boolean }) => void) => {
    const channel = supabase.channel(`typing-${conversationId}`);
    
    channel.on('broadcast', { event: 'typing' }, (payload) => {
      callback(payload.payload);
    });
    
    channel.subscribe();
    
    return {
      channel,
      broadcastTyping: (userId: string, isTyping: boolean) => {
        channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId, isTyping },
        });
      },
    };
  },
  
  // ==================== POST INTERACTIONS ====================
  
  /**
   * Subscribe to real-time updates for a specific post
   */
  subscribeToPost: (postId: string, callbacks: {
    onLikeUpdate?: (likes: number) => void;
    onEchoUpdate?: (echoes: number) => void;
    onCommentUpdate?: (comments: number) => void;
    onNewComment?: (comment: any) => void;
  }) => {
    const channel = supabase.channel(`post-${postId}`);
    
    // Listen for post updates
    channel.on(
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
    
    // Listen for new comments
    if (callbacks.onNewComment) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('comments')
            .select(`
              *,
              user:users(id, username, display_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (data && callbacks.onNewComment) {
            callbacks.onNewComment(data);
          }
        }
      );
    }
    
    channel.subscribe();
    
    return channel;
  },
  
  // ==================== CLEANUP ====================
  
  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll: (channels: any[]) => {
    channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
  },
};

export default realtimeService;