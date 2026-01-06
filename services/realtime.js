// services/realtime.js - Complete real-time service
import { supabase } from './supabase';
import useStore from '../store/useStore';

class RealtimeService {
  constructor() {
    this.channels = {};
  }

  // Subscribe to post updates
  subscribeToPosts(callback) {
    const channel = supabase
      .channel('posts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    this.channels.posts = channel;
    return () => supabase.removeChannel(channel);
  }

  // Subscribe to chat messages
  subscribeToChat(userId, otherUserId, callback) {
    const channelId = `chat-${userId}-${otherUserId}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id=eq.${userId},receiver_id=eq.${otherUserId}),and(sender_id=eq.${otherUserId},receiver_id=eq.${userId}))`,
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    this.channels[channelId] = channel;
    return () => supabase.removeChannel(channel);
  }

  // Subscribe to notifications
  subscribeToNotifications(userId, callback) {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    this.channels.notifications = channel;
    return () => supabase.removeChannel(channel);
  }

  // Cleanup all subscriptions
  cleanup() {
    Object.values(this.channels).forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.channels = {};
  }
}

const realtimeService = new RealtimeService();
export default realtimeService;