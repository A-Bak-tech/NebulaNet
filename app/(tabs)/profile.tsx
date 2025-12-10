// File: /app/(tabs)/profile.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper, Header } from '../../components/layout';
import { useAuth } from '../../hooks/useAuth';
import { usePosts } from '../../hooks/usePosts';
import { useUser } from '../../hooks/useUser';
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfileStats from '../../components/profile/ProfileStats';
import ProfileTabs from '../../components/profile/ProfileTabs';
import EditProfileModal from '../../components/profile/EditProfileModal';
import { FollowersList } from '../../components/profile/FollowersList';
import { SettingsIcon, MoreIcon } from '../../assets/icons';
import { currentTheme } from '../../constants/Colors';
import { PostCard } from '../../components/post/PostCard';
import { ProfileSkeleton } from '../../components/profile/ProfileSkeleton';

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user: currentUser, updateProfile } = useAuth();
  
  const userId = params.id as string || currentUser?.id;
  const isOwnProfile = userId === currentUser?.id;
  
  const { 
    user, 
    isLoading: isLoadingUser, 
    refreshUser,
    followUser,
    unfollowUser,
    isFollowing,
    followStatus,
    mutualFollowers,
    updateProfile: updateUserProfile,
    acceptFollowRequest,
    rejectFollowRequest,
    getFollowRequests,
  } = useUser(userId);
  
  const [activeTab, setActiveTab] = useState<'posts' | 'likes' | 'echoes'>('posts');
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers');
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [showFollowRequests, setShowFollowRequests] = useState(false);
  
  // Fetch posts based on active tab
  const { 
    posts, 
    isLoading: isLoadingPosts, 
    refreshPosts,
    loadMore,
    hasMore,
  } = usePosts({ 
    userId: activeTab === 'posts' ? userId : undefined,
    type: activeTab,
  });
  
  // Load follow requests for private accounts
  useEffect(() => {
    if (isOwnProfile && user?.is_private) {
      loadFollowRequests();
    }
  }, [isOwnProfile, user?.is_private]);
  
  const loadFollowRequests = async () => {
    try {
      const requests = await getFollowRequests();
      setFollowRequests(requests);
    } catch (error) {
      console.error('Error loading follow requests:', error);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshUser(), refreshPosts()]);
      if (isOwnProfile && user?.is_private) {
        await loadFollowRequests();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollowUser();
      } else {
        await followUser();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update follow status');
    }
  };
  
  const handleSaveProfile = async (updates: any) => {
    try {
      if (isOwnProfile && currentUser) {
        await updateProfile(updates);
        Alert.alert('Success', 'Profile updated successfully');
      } else if (user) {
        await updateUserProfile(updates);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
      throw error;
    }
  };
  
  const handleOpenFollowers = () => {
    setFollowModalType('followers');
    setShowFollowModal(true);
  };
  
  const handleOpenFollowing = () => {
    setFollowModalType('following');
    setShowFollowModal(true);
  };
  
  const handleUserPress = (targetUserId: string) => {
    setShowFollowModal(false);
    if (targetUserId === currentUser?.id) {
      router.replace('/profile');
    } else {
      router.push(`/profile?id=${targetUserId}`);
    }
  };
  
  const handleAcceptFollowRequest = async (followerId: string) => {
    try {
      await acceptFollowRequest(followerId);
      setFollowRequests(prev => prev.filter(req => req.follower_id !== followerId));
      Alert.alert('Success', 'Follow request accepted');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept request');
    }
  };
  
  const handleRejectFollowRequest = async (followerId: string) => {
    try {
      await rejectFollowRequest(followerId);
      setFollowRequests(prev => prev.filter(req => req.follower_id !== followerId));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reject request');
    }
  };
  
  const handlePostPress = (postId: string) => {
    router.push(`/post/${postId}`);
  };
  
  const renderContent = () => {
    if (isLoadingUser) {
      return <ProfileSkeleton />;
    }
    
    if (!user) {
      return (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-text-primary text-xl font-semibold mb-2">
            User not found
          </Text>
          <Text className="text-text-secondary text-center">
            This user may have deactivated their account
          </Text>
          <TouchableOpacity 
            className="mt-4 px-6 py-2 bg-brand-primary rounded-full"
            onPress={() => router.back()}
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <>
        <ProfileHeader
          user={user}
          isOwnProfile={isOwnProfile}
          onEditProfile={() => setShowEditModal(true)}
          onFollow={followUser}
          onUnfollow={unfollowUser}
          isFollowing={isFollowing}
          followStatus={followStatus}
          onMessage={() => router.push(`/messages/${userId}`)}
          mutualFollowers={mutualFollowers}
        />
        
        <ProfileStats
          userId={userId}
          followingCount={user.following_count || 0}
          followersCount={user.followers_count || 0}
          postsCount={user.posts_count || 0}
          echoesCount={user.echoes_count || 0}
          likesCount={user.likes_count || 0}
          onPressFollowers={handleOpenFollowers}
          onPressFollowing={handleOpenFollowing}
        />
        
        {/* Follow Requests Banner for Private Accounts */}
        {isOwnProfile && followRequests.length > 0 && (
          <TouchableOpacity
            className="mx-4 mt-4 p-3 bg-surface border border-border rounded-lg"
            onPress={() => setShowFollowRequests(true)}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="text-text-primary font-semibold">
                  {followRequests.length} follow request{followRequests.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <MoreIcon size={20} color={currentTheme.icon.primary} />
            </View>
            <Text className="text-text-secondary text-sm mt-1">
              Tap to review
            </Text>
          </TouchableOpacity>
        )}
        
        <ProfileTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          postsCount={user.posts_count || 0}
          likesCount={user.likes_count || 0}
          echoesCount={user.echoes_count || 0}
        />
        
        {renderTabContent()}
      </>
    );
  };
  
  const renderTabContent = () => {
    if (isLoadingPosts && !refreshing) {
      return (
        <View className="py-12 items-center">
          <ActivityIndicator size="small" color={currentTheme.brand.primary} />
          <Text className="text-text-secondary mt-2">Loading posts...</Text>
        </View>
      );
    }
    
    if (posts.length === 0) {
      return (
        <View className="py-12 items-center px-6">
          <Text className="text-text-primary text-lg font-semibold mb-2">
            {getEmptyStateTitle()}
          </Text>
          <Text className="text-text-secondary text-center mb-6">
            {getEmptyStateDescription()}
          </Text>
          {isOwnProfile && activeTab === 'posts' && (
            <TouchableOpacity 
              className="px-6 py-3 bg-brand-primary rounded-full"
              onPress={() => router.push('/(tabs)/create')}
            >
              <Text className="text-white font-semibold">Create your first post</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    
    return (
      <View className="pb-20">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onPress={() => handlePostPress(post.id)}
            showActions
            compact
          />
        ))}
        
        {/* Load More Indicator */}
        {hasMore && (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color={currentTheme.brand.primary} />
            <Text className="text-text-secondary text-sm mt-2">Loading more...</Text>
          </View>
        )}
      </View>
    );
  };
  
  const getEmptyStateTitle = () => {
    switch (activeTab) {
      case 'posts':
        return isOwnProfile ? 'No posts yet' : 'No posts';
      case 'likes':
        return isOwnProfile ? 'No likes yet' : 'No likes';
      case 'echoes':
        return isOwnProfile ? 'No echoes yet' : 'No echoes';
      default:
        return 'No content';
    }
  };
  
  const getEmptyStateDescription = () => {
    switch (activeTab) {
      case 'posts':
        return isOwnProfile 
          ? 'When you create posts, they will appear here.'
          : 'This user hasn\'t posted anything yet.';
      case 'likes':
        return isOwnProfile
          ? 'Posts you like will appear here.'
          : 'This user hasn\'t liked any posts yet.';
      case 'echoes':
        return isOwnProfile
          ? 'Posts you echo will appear here.'
          : 'This user hasn\'t echoed any posts yet.';
      default:
        return '';
    }
  };
  
  const renderFollowRequestsModal = () => (
    <Modal
      visible={showFollowRequests}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFollowRequests(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: currentTheme.background.primary }]}>
        <View className="px-4 py-3 border-b border-border">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-semibold text-text-primary">
              Follow Requests ({followRequests.length})
            </Text>
            <TouchableOpacity onPress={() => setShowFollowRequests(false)}>
              <Text className="text-brand-primary text-base">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView className="flex-1">
          {followRequests.map((request) => (
            <View key={request.id} className="px-4 py-3 border-b border-border">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <TouchableOpacity
                    onPress={() => handleUserPress(request.follower.id)}
                    className="flex-row items-center flex-1"
                  >
                    <View className="w-12 h-12 rounded-full bg-surface overflow-hidden">
                      {request.follower.avatar_url ? (
                        <Image
                          source={{ uri: request.follower.avatar_url }}
                          className="w-full h-full"
                        />
                      ) : (
                        <Text className="text-text-primary text-lg font-bold m-auto">
                          {request.follower.display_name?.[0] || request.follower.username?.[0]}
                        </Text>
                      )}
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-text-primary font-semibold">
                        {request.follower.display_name || request.follower.username}
                      </Text>
                      <Text className="text-text-secondary text-sm">
                        @{request.follower.username}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
                
                <View className="flex-row space-x-2">
                  <TouchableOpacity
                    className="px-4 py-2 bg-brand-primary rounded-full"
                    onPress={() => handleAcceptFollowRequest(request.follower.id)}
                  >
                    <Text className="text-white font-semibold">Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="px-4 py-2 border border-border rounded-full"
                    onPress={() => handleRejectFollowRequest(request.follower.id)}
                  >
                    <Text className="text-text-primary font-semibold">Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
  
  return (
    <ScreenWrapper withBottomNav>
      <Header
        title={isOwnProfile ? "Profile" : (user?.display_name || user?.username || "Profile")}
        showBackButton={!isOwnProfile}
        rightAction={
          isOwnProfile ? {
            icon: <SettingsIcon size={24} color={currentTheme.icon.primary} />,
            onPress: () => router.push('/settings'),
          } : undefined
        }
      />
      
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={currentTheme.brand.primary}
            colors={[currentTheme.brand.primary]}
          />
        }
        onScroll={({ nativeEvent }) => {
          if (nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >= 
              nativeEvent.contentSize.height - 20) {
            if (hasMore && !isLoadingPosts) {
              loadMore();
            }
          }
        }}
        scrollEventThrottle={400}
      >
        {renderContent()}
      </ScrollView>
      
      {/* Edit Profile Modal */}
      {user && (
        <EditProfileModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveProfile}
          user={user}
        />
      )}
      
      {/* Followers/Following Modal */}
      <Modal
        visible={showFollowModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFollowModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: currentTheme.background.primary }]}>
          <View className="px-4 py-3 border-b border-border">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-semibold text-text-primary">
                {followModalType === 'followers' ? 'Followers' : 'Following'}
              </Text>
              <TouchableOpacity onPress={() => setShowFollowModal(false)}>
                <Text className="text-brand-primary text-base">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <FollowersList
            userId={userId}
            type={followModalType}
            onUserPress={handleUserPress}
            showActions={!isOwnProfile}
          />
        </View>
      </Modal>
      
      {/* Follow Requests Modal */}
      {renderFollowRequestsModal()}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
});