// File: /lib/followers.ts
import { supabase } from './supabase';
import { Follower, FollowStatus, User } from '../types';

export const followers = {
  // Follow a user
  async followUser(followingId: string): Promise<Follower | null> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Check if user is private
      const { data: targetUser } = await supabase
        .from('users')
        .select('is_private')
        .eq('id', followingId)
        .single();

      const status = targetUser?.is_private ? 'pending' : 'accepted';

      const { data, error } = await supabase
        .from('followers')
        .upsert({
          follower_id: userData.user.id,
          following_id: followingId,
          status,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'follower_id,following_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  },

  // Unfollow a user
  async unfollowUser(followingId: string): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', userData.user.id)
        .eq('following_id', followingId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  },

  // Accept follow request
  async acceptFollowRequest(followerId: string): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('followers')
        .update({ 
          status: 'accepted', 
          updated_at: new Date().toISOString() 
        })
        .eq('follower_id', followerId)
        .eq('following_id', userData.user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error accepting follow request:', error);
      throw error;
    }
  },

  // Reject follow request
  async rejectFollowRequest(followerId: string): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', userData.user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error rejecting follow request:', error);
      throw error;
    }
  },

  // Get user's followers
  async getFollowers(userId: string, status?: FollowStatus): Promise<Follower[]> {
    try {
      let query = supabase
        .from('followers')
        .select(`
          *,
          follower:users!follower_id(
            id,
            username,
            display_name,
            avatar_url,
            bio
          )
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching followers:', error);
      throw error;
    }
  },

  // Get users that a user is following
  async getFollowing(userId: string): Promise<Follower[]> {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select(`
          *,
          following:users!following_id(
            id,
            username,
            display_name,
            avatar_url,
            bio
          )
        `)
        .eq('follower_id', userId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching following:', error);
      throw error;
    }
  },

  // Check if current user follows another user
  async checkFollowing(followingId: string): Promise<FollowStatus | null> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const { data, error } = await supabase
        .from('followers')
        .select('status')
        .eq('follower_id', userData.user.id)
        .eq('following_id', followingId)
        .maybeSingle();

      if (error) throw error;
      return data?.status || null;
    } catch (error) {
      console.error('Error checking follow status:', error);
      throw error;
    }
  },

  // Get follow requests (for private accounts)
  async getFollowRequests(): Promise<Follower[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from('followers')
        .select(`
          *,
          follower:users!follower_id(
            id,
            username,
            display_name,
            avatar_url,
            bio,
            created_at
          )
        `)
        .eq('following_id', userData.user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching follow requests:', error);
      throw error;
    }
  },

  // Get mutual followers
  async getMutualFollowers(userId: string): Promise<User[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase.rpc('get_mutual_followers', {
        current_user_id: userData.user.id,
        target_user_id: userId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching mutual followers:', error);
      return [];
    }
  }
};