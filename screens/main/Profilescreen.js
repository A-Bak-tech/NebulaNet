import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    postCount: 0,
    followerCount: 0,
    followingCount: 0,
  });

  useEffect(() => {
    loadProfileData();
    
    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfileData();
    });
    
    return unsubscribe;
  }, [navigation]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch user profile
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        }

        if (profileData) {
          setProfile(profileData);
          
          // Fetch stats in parallel
          fetchUserStats(user.id);
        } else {
          // Create default profile object
          setProfile({
            id: user.id,
            username: '',
            full_name: user.user_metadata?.full_name || '',
            avatar_url: null,
            bio: '',
            location: '',
            website: '',
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async (userId) => {
    try {
      // Fetch post count
      const { count: postCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Fetch follower count
      const { count: followerCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      // Fetch following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      setStats({
        postCount: postCount || 0,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Navigation is handled by AppNavigator auth state change
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleNotifications = () => {
    navigation.navigate('Notifications');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleInvite = () => {
    navigation.navigate('Invite');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleNotifications}
            >
              <Ionicons name="notifications-outline" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleSettings}
            >
              <Ionicons name="settings-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          {/* Avatar and Stats Row */}
          <View style={styles.profileTopRow}>
            <View style={styles.avatarContainer}>
              {profile?.avatar_url ? (
                <Image 
                  source={{ uri: profile.avatar_url }} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={48} color="#8E8E93" />
                </View>
              )}
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.postCount}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.followerCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>

          {/* Name and Username */}
          <View style={styles.nameContainer}>
            <Text style={styles.fullName}>
              {profile?.full_name || 'Your Name'}
            </Text>
            <Text style={styles.username}>
              @{profile?.username || 'username'}
            </Text>
          </View>

          {/* Bio */}
          {profile?.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : (
            <TouchableOpacity 
              style={styles.addBioButton}
              onPress={handleEditProfile}
            >
              <Text style={styles.addBioText}>+ Add a bio</Text>
            </TouchableOpacity>
          )}

          {/* Location and Website */}
          <View style={styles.detailsContainer}>
            {profile?.location && (
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={16} color="#8E8E93" />
                <Text style={styles.detailText}>{profile.location}</Text>
              </View>
            )}
            {profile?.website && (
              <TouchableOpacity style={styles.detailItem}>
                <Ionicons name="link-outline" size={16} color="#007AFF" />
                <Text style={[styles.detailText, styles.websiteText]}>
                  {profile.website.replace('https://', '')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={handleInvite}
            >
              <Ionicons name="share-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Posts Grid Placeholder */}
        <View style={styles.postsSection}>
          <View style={styles.postsHeader}>
            <TouchableOpacity style={styles.postsTabActive}>
              <Ionicons name="grid" size={20} color="#007AFF" />
              <Text style={styles.postsTabTextActive}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.postsTab}>
              <Ionicons name="bookmark-outline" size={20} color="#8E8E93" />
              <Text style={styles.postsTabText}>Saved</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.postsTab}>
              <Ionicons name="person-outline" size={20} color="#8E8E93" />
              <Text style={styles.postsTabText}>Tagged</Text>
            </TouchableOpacity>
          </View>
          
          {stats.postCount === 0 ? (
            <View style={styles.emptyPosts}>
              <Ionicons name="camera-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyPostsTitle}>No posts yet</Text>
              <Text style={styles.emptyPostsText}>
                When you create posts, they'll appear here
              </Text>
              <TouchableOpacity 
                style={styles.createPostButton}
                onPress={() => navigation.navigate('CreatePost')}
              >
                <Text style={styles.createPostButtonText}>Create your first post</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.postsGrid}>
              {/* Posts grid would be rendered here */}
              <Text style={styles.comingSoon}>Posts grid coming soon</Text>
            </View>
          )}
        </View>

        {/* Account Actions */}
        <View style={styles.accountActions}>
          <TouchableOpacity 
            style={styles.accountButton}
            onPress={handleInvite}
          >
            <Ionicons name="person-add-outline" size={20} color="#000" />
            <Text style={styles.accountButtonText}>Invite Friends</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.accountButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={20} color="#000" />
            <Text style={styles.accountButtonText}>Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.accountButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={[styles.accountButtonText, styles.logoutText]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  profileTopRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  nameContainer: {
    marginBottom: 12,
  },
  fullName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
  },
  username: {
    fontSize: 16,
    color: '#8E8E93',
  },
  bio: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
    marginBottom: 16,
  },
  addBioButton: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  addBioText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 15,
    color: '#8E8E93',
    marginLeft: 6,
  },
  websiteText: {
    color: '#007AFF',
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 12,
  },
  editButtonText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
  },
  shareButton: {
    width: 48,
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postsSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  postsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  postsTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  postsTabActive: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  postsTabText: {
    fontSize: 15,
    color: '#8E8E93',
    marginLeft: 6,
    fontWeight: '500',
  },
  postsTabTextActive: {
    fontSize: 15,
    color: '#007AFF',
    marginLeft: 6,
    fontWeight: '600',
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 40,
  },
  emptyPostsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3C3C43',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyPostsText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createPostButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createPostButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  postsGrid: {
    padding: 20,
    alignItems: 'center',
  },
  comingSoon: {
    fontSize: 16,
    color: '#8E8E93',
  },
  accountActions: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    marginTop: 24,
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  accountButtonText: {
    flex: 1,
    fontSize: 17,
    color: '#000000',
    marginLeft: 12,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#FF3B30',
  },
});