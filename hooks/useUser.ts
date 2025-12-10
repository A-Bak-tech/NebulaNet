// File: /hooks/useUser.ts
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { followers } from '../lib/followers';
import { User } from '../types/app';
import { useAuth } from './useAuth';

export const useUser = (userId?: string) => {
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStatus, setFollowStatus] = useState<'following' | 'pending' | 'not-following'>('not-following');
  const [error, setError] = useState<string | null>(null);
  const [mutualFollowers, setMutualFollowers] = useState<User[]>([]);
  
  const fetchUser = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch user data with all needed fields
      const { data, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          posts_count:posts(count),
          followers_count:followers!following_id(count),
          following_count:followers!follower_id(count),
          echoes_count:echoes(count),
          likes_count:post_likes(count)
        `)
        .eq('id', userId)
        .single();
      
      if (userError) throw userError;
      
      // Transform the data
      const userData: User = {
        ...data,
        posts_count: data.posts_count?.[0]?.count || 0,
        followers_count: data.followers_count?.[0]?.count || 0,
        following_count: data.following_count?.[0]?.count || 0,
        echoes_count: data.echoes_count?.[0]?.count || 0,
        likes_count: data.likes_count?.[0]?.count || 0,
      };
      
      setUser(userData);
      
      // Check follow status if viewing other user's profile
      if (currentUser && currentUser.id !== userId) {
        const status = await followers.checkFollowing(userId);
        setIsFollowing(status === 'accepted');
        setFollowStatus(
          status === 'accepted' ? 'following' :
          status === 'pending' ? 'pending' : 'not-following'
        );
        
        // Fetch mutual followers
        const mutuals = await followers.getMutualFollowers(userId);
        setMutualFollowers(mutuals);
      }
    } catch (err: any) {
      console.error('Error fetching user:', err);
      setError(err.message || 'Failed to load user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentUser]);
  
  // Follow user
  const followUser = async () => {
    if (!currentUser || !userId || currentUser.id === userId) {
      Alert.alert('Error', 'Cannot follow yourself');
      return;
    }
    
    try {
      const result = await followers.followUser(userId);
      setIsFollowing(result?.status === 'accepted');
      setFollowStatus(
        result?.status === 'pending' ? 'pending' : 'following'
      );
      
      // Refresh user to update counts
      await fetchUser();
    } catch (err: any) {
      console.error('Error following user:', err);
      Alert.alert('Error', err.message || 'Failed to follow user');
      throw err;
    }
  };
  
  // Unfollow user
  const unfollowUser = async () => {
    if (!currentUser || !userId || currentUser.id === userId) {
      Alert.alert('Error', 'Cannot unfollow yourself');
      return;
    }
    
    try {
      await followers.unfollowUser(userId);
      setIsFollowing(false);
      setFollowStatus('not-following');
      
      // Refresh user to update counts
      await fetchUser();
    } catch (err: any) {
      console.error('Error unfollowing user:', err);
      Alert.alert('Error', err.message || 'Failed to unfollow user');
      throw err;
    }
  };
  
  // Update user profile
  const updateProfile = async (updates: Partial<User>) => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to update your profile');
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state
      setUser(prev => prev ? { ...prev, ...data } : data);
      
      return { success: true, data };
    } catch (err: any) {
      console.error('Error updating profile:', err);
      return { success: false, error: err.message };
    }
  };
  
  // Accept follow request
  const acceptFollowRequest = async (followerId: string) => {
    try {
      await followers.acceptFollowRequest(followerId);
      // Refresh user data
      await fetchUser();
    } catch (err: any) {
      console.error('Error accepting follow request:', err);
      Alert.alert('Error', err.message || 'Failed to accept follow request');
    }
  };
  
  // Reject follow request
  const rejectFollowRequest = async (followerId: string) => {
    try {
      await followers.rejectFollowRequest(followerId);
      // Refresh user data
      await fetchUser();
    } catch (err: any) {
      console.error('Error rejecting follow request:', err);
      Alert.alert('Error', err.message || 'Failed to reject follow request');
    }
  };
  
  // Get follow requests (for private accounts)
  const getFollowRequests = async () => {
    try {
      const requests = await followers.getFollowRequests();
      return requests;
    } catch (err: any) {
      console.error('Error getting follow requests:', err);
      return [];
    }
  };
  
  // Subscribe to user updates
  useEffect(() => {
    if (!userId) return;
    
    const channel = supabase
      .channel(`user-${userId}-updates`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          setUser(prev => prev ? { ...prev, ...payload.new } : payload.new as User);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
  
  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId, fetchUser]);
  
  return {
    user,
    isLoading,
    error,
    isFollowing,
    followStatus,
    mutualFollowers,
    followUser,
    unfollowUser,
    updateProfile,
    acceptFollowRequest,
    rejectFollowRequest,
    getFollowRequests,
    refreshUser: fetchUser,
  };
};

export default useUser;