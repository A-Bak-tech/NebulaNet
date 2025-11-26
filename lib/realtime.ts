import { supabase } from './supabase';

export const realtime = {
  subscribeToPosts(callback: (payload: any) => void) {
    return supabase
      .channel('posts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
        },
        callback
      )
      .subscribe();
  },

  subscribeToLikes(callback: (payload: any) => void) {
    return supabase
      .channel('likes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
        },
        callback
      )
      .subscribe();
  },

  subscribeToComments(callback: (payload: any) => void) {
    return supabase
      .channel('comments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        callback
      )
      .subscribe();
  },

  subscribeToUserUpdates(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('user_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },

  unsubscribe(channel: any) {
    return supabase.removeChannel(channel);
  },
};