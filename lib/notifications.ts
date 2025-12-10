// File: /lib/notifications.ts
import { supabase } from './supabase';
import { 
  Notification, 
  NotificationType, 
  NotificationChannel,
  NotificationPreference,
  NotificationSettings,
  NotificationsResponse
} from '../types/notifications';

export const notificationsService = {
  // ==================== NOTIFICATIONS ====================
  
  /**
   * Get notifications for current user
   */
  getNotifications: async (
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<NotificationsResponse> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      let query = supabase
        .from('notifications')
        .select(`
          *,
          actor:users!actor_id(
            id,
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `, { count: 'exact' })
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });
      
      if (unreadOnly) {
        query = query.eq('is_read', false);
      }
      
      const { data, error, count } = await query.range(from, to);
      
      if (error) throw error;
      
      // Get unread count
      const unreadCount = await this.getUnreadCount();
      
      return {
        notifications: data || [],
        unread_count: unreadCount,
        has_more: (data?.length || 0) === limit,
        total: count || 0,
      };
    } catch (error: any) {
      console.error('Get notifications error:', error);
      throw error;
    }
  },
  
  /**
   * Get unread notifications count
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return 0;
      
      // Try to get from users table first (cached count)
      const { data: user } = await supabase
        .from('users')
        .select('unread_notifications_count')
        .eq('id', userData.user.id)
        .single();
      
      if (user?.unread_notifications_count !== undefined) {
        return user.unread_notifications_count;
      }
      
      // Fallback to counting notifications
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userData.user.id)
        .eq('is_read', false);
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  },
  
  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      
      const { error } = await supabase.rpc('mark_notifications_read', {
        p_user_id: userData.user.id,
        p_notification_ids: [notificationId]
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Mark as read error:', error);
      throw error;
    }
  },
  
  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<number> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.rpc('mark_notifications_read', {
        p_user_id: userData.user.id
      });
      
      if (error) throw error;
      return data || 0;
    } catch (error: any) {
      console.error('Mark all as read error:', error);
      throw error;
    }
  },
  
  /**
   * Mark notifications as seen (for badge clearing)
   */
  markAsSeen: async (): Promise<number> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.rpc('mark_notifications_seen', {
        p_user_id: userData.user.id
      });
      
      if (error) throw error;
      return data || 0;
    } catch (error: any) {
      console.error('Mark as seen error:', error);
      throw error;
    }
  },
  
  /**
   * Delete notification
   */
  deleteNotification: async (notificationId: string): Promise<void> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      
      // Get notification to check if it's unread
      const { data: notification } = await supabase
        .from('notifications')
        .select('is_read')
        .eq('id', notificationId)
        .eq('user_id', userData.user.id)
        .single();
      
      if (!notification) throw new Error('Notification not found');
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userData.user.id);
      
      if (error) throw error;
      
      // Update unread count if notification was unread
      if (!notification.is_read) {
        await supabase.rpc('decrement_unread_count', {
          user_id: userData.user.id
        });
      }
    } catch (error: any) {
      console.error('Delete notification error:', error);
      throw error;
    }
  },
  
  /**
   * Clear all notifications
   */
  clearAll: async (): Promise<void> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userData.user.id);
      
      if (error) throw error;
      
      // Reset unread count
      await supabase
        .from('users')
        .update({ unread_notifications_count: 0 })
        .eq('id', userData.user.id);
    } catch (error: any) {
      console.error('Clear all notifications error:', error);
      throw error;
    }
  },
  
  // ==================== PREFERENCES ====================
  
  /**
   * Get notification preferences
   */
  getPreferences: async (): Promise<NotificationSettings> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userData.user.id);
      
      if (error) throw error;
      
      // Transform to settings object
      const settings: NotificationSettings = {};
      
      data?.forEach(pref => {
        if (!settings[pref.type]) {
          settings[pref.type] = {
            in_app: false,
            email: false,
            push: false,
          };
        }
        
        settings[pref.type][pref.channel as NotificationChannel] = pref.enabled;
      });
      
      return settings;
    } catch (error: any) {
      console.error('Get preferences error:', error);
      throw error;
    }
  },
  
  /**
   * Update notification preference
   */
  updatePreference: async (
    type: NotificationType,
    channel: NotificationChannel,
    enabled: boolean
  ): Promise<void> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userData.user.id,
          type,
          channel,
          enabled,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,type,channel',
          ignoreDuplicates: false
        });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Update preference error:', error);
      throw error;
    }
  },
  
  /**
   * Update multiple preferences
   */
  updatePreferences: async (settings: NotificationSettings): Promise<void> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      
      const updates = [];
      const now = new Date().toISOString();
      
      for (const [type, channels] of Object.entries(settings)) {
        for (const [channel, enabled] of Object.entries(channels)) {
          updates.push({
            user_id: userData.user.id,
            type,
            channel,
            enabled,
            updated_at: now,
          });
        }
      }
      
      const { error } = await supabase
        .from('notification_preferences')
        .upsert(updates, {
          onConflict: 'user_id,type,channel',
          ignoreDuplicates: false
        });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Update preferences error:', error);
      throw error;
    }
  },
  
  // ==================== CREATE NOTIFICATIONS ====================
  
  /**
   * Create a mention notification
   */
  createMentionNotification: async (
    targetUserId: string,
    actorId: string,
    postId: string,
    content: string
  ): Promise<void> => {
    try {
      await supabase.rpc('create_notification', {
        p_user_id: targetUserId,
        p_type: 'mention',
        p_actor_id: actorId,
        p_target_id: postId,
        p_target_type: 'post',
        p_title: 'You were mentioned',
        p_message: `mentioned you in a post: ${content.substring(0, 50)}...`,
        p_data: { post_id: postId }
      });
    } catch (error: any) {
      console.error('Create mention notification error:', error);
      throw error;
    }
  },
  
  /**
   * Create a welcome notification
   */
  createWelcomeNotification: async (userId: string): Promise<void> => {
    try {
      await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_type: 'welcome',
        p_title: 'Welcome to NebulaNet! 🎉',
        p_message: 'Thanks for joining our community. Start by exploring trending posts or creating your first post!',
        p_data: { is_welcome: true }
      });
    } catch (error: any) {
      console.error('Create welcome notification error:', error);
      throw error;
    }
  },
  
  // ==================== REALTIME ====================
  
  /**
   * Subscribe to new notifications
   */
  subscribeToNotifications: (
    callback: (notification: Notification) => void
  ) => {
    const { data: userData } = supabase.auth.getUser();
    if (!userData) return () => {};
    
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userData.user?.id}`,
        },
        async (payload) => {
          // Fetch the full notification with actor data
          const { data } = await supabase
            .from('notifications')
            .select(`
              *,
              actor:users!actor_id(
                id,
                username,
                display_name,
                avatar_url,
                is_verified
              )
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (data) {
            callback(data);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  },
  
  /**
   * Subscribe to notification updates (read status)
   */
  subscribeToNotificationUpdates: (
    callback: (notification: Notification) => void
  ) => {
    const { data: userData } = supabase.auth.getUser();
    if (!userData) return () => {};
    
    const channel = supabase
      .channel('notification-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userData.user?.id}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('notifications')
            .select(`
              *,
              actor:users!actor_id(
                id,
                username,
                display_name,
                avatar_url,
                is_verified
              )
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (data) {
            callback(data);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  },
  
  /**
   * Subscribe to unread count updates
   */
  subscribeToUnreadCount: (
    callback: (count: number) => void
  ) => {
    const { data: userData } = supabase.auth.getUser();
    if (!userData) return () => {};
    
    const channel = supabase
      .channel('unread-count')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userData.user?.id}`,
        },
        (payload) => {
          const newCount = (payload.new as any).unread_notifications_count;
          if (newCount !== undefined) {
            callback(newCount);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  },
};

export default notificationsService;