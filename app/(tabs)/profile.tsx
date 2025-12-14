import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Settings, 
  Edit, 
  MapPin, 
  Link, 
  Grid, 
  Heart, 
  Users,
  Camera,
  MoreVertical,
  MessageCircle,
  Share
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const ProfileScreen = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    likes: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    loadUserData();
    fetchProfileData();
    
    // Set up real-time subscription for posts
    const subscription = supabase
      .channel('posts-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'posts',
          filter: `user_id=eq.${user?.id}`
        }, 
        () => {
          fetchProfileData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id]);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchProfileData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setPosts(postsData || []);

      // Fetch stats
      const [followersCount, followingCount, likesCount] = await Promise.all([
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('followed_id', user.id),
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', user.id),
        supabase
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);

      setStats({
        posts: postsData?.length || 0,
        followers: followersCount.count || 0,
        following: followingCount.count || 0,
        likes: likesCount.count || 0
      });

    } catch (error) {
      console.error('Error fetching profile data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    // router.push('/edit-profile');
  };

  const handleShareProfile = async () => {
    try {
      // Share profile link
      // await Share.share({
      //   message: `Check out ${profile?.username}'s profile on NebulaNet!`,
      //   url: `https://nebulanet.app/profile/${profile?.username}`,
      // });
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  };

  const handleSettings = () => {
    // Navigate to settings
    // router.push('/settings');
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const tabs = [
    { id: 'posts', label: 'Posts', icon: Grid },
    { id: 'media', label: 'Media', icon: Camera },
    { id: 'likes', label: 'Likes', icon: Heart },
  ];

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#007AFF']}
          tintColor="#007AFF"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.username}>@{profile?.username || 'username'}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={handleShareProfile}>
            <Share size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleSettings}>
            <Settings size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Edit size={16} color="#fff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <Image
          source={{ 
            uri: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username}`
          }}
          style={styles.avatar}
          defaultSource={require('@/assets/images/default-avatar.png')}
        />
        
        <Text style={styles.displayName}>
          {profile?.full_name || 'Explorer of the digital nebula'}
        </Text>
        
        {profile?.location && (
          <View style={styles.location}>
            <MapPin size={16} color="#666" />
            <Text style={styles.locationText}>{profile.location}</Text>
          </View>
        )}
        
        {profile?.website && (
          <TouchableOpacity style={styles.website}>
            <Link size={16} color="#007AFF" />
            <Text style={styles.websiteText}>{profile.website}</Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.joinDate}>
          Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          }) : 'December 2024'}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatNumber(stats.posts)}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <TouchableOpacity style={styles.statItem}>
          <Text style={styles.statValue}>{formatNumber(stats.followers)}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statItem}>
          <Text style={styles.statValue}>{formatNumber(stats.following)}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statItem}>
          <Text style={styles.statValue}>{formatNumber(stats.likes)}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Icon size={20} color={activeTab === tab.id ? '#007AFF' : '#666'} />
              <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content Grid */}
      <View style={styles.contentGrid}>
        {activeTab === 'posts' && posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Grid size={48} color="#e0e0e0" />
            <Text style={styles.emptyStateTitle}>No posts yet</Text>
            <Text style={styles.emptyStateText}>
              When you share photos and videos, they'll appear here.
            </Text>
            <TouchableOpacity 
              style={styles.createPostButton}
              // onPress={() => router.push('/create')}
            >
              <Text style={styles.createPostButtonText}>Create your first post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {posts.slice(0, 6).map((post, index) => (
              <TouchableOpacity
                key={post.id}
                style={styles.gridItem}
                // onPress={() => router.push(`/post/${post.id}`)}
              >
                <Image
                  source={{ uri: post.media_url?.[0] || require('@/assets/images/placeholder.jpg') }}
                  style={styles.gridImage}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  userInfo: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
  },
  displayName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  website: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  websiteText: {
    fontSize: 14,
    color: '#007AFF',
  },
  joinDate: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
  },
  contentGrid: {
    minHeight: 400,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  createPostButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createPostButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 1,
  },
  gridItem: {
    width: '33.333%',
    aspectRatio: 1,
    padding: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
});

export default ProfileScreen;