import { supabase } from './supabase';
import { User } from '@/types/database';

export const users = {
  async getProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async searchUsers(query: string, limit = 10): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async followUser(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from('follows')
      .insert([
        {
          follower_id: followerId,
          following_id: followingId,
        },
      ]);

    if (error) throw error;
  },

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;
  },

  async getFollowers(userId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower:users!follows_follower_id_fkey(*)
      `)
      .eq('following_id', userId);

    if (error) throw error;
    return data?.map(item => item.follower) || [];
  },

  async getFollowing(userId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following:users!follows_following_id_fkey(*)
      `)
      .eq('follower_id', userId);

    if (error) throw error;
    return data?.map(item => item.following) || [];
  },
};