// app/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, FloatingHeader } from '../../components/layout';
import { useAuth } from '../../hooks/useAuth';
import { usePosts } from '../../hooks/usePosts';
import { CommentIcon, RetweetIcon, LikeIcon, ShareIcon, ImageIcon, VideoIcon } from '../../assets/icons';
import { currentTheme } from '../../constants/Colors';
import { SPACING, SIZES } from '../../constants/Layout';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { posts, isLoading, refreshPosts, loadMorePosts, hasMorePosts } = usePosts();
  
  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');
  const [refreshing, setRefreshing] = useState(false);
  
  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshPosts();
    setRefreshing(false);
  };
  
  // Handle infinite scroll
  const handleLoadMore = () => {
    if (!isLoading && hasMorePosts) {
      loadMorePosts();
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Handle post actions
  const handleLike = async (postId: string) => {
    // Will be implemented in posts hook
    console.log('Like post:', postId);
  };
  
  const handleComment = (postId: string) => {
    router.push(`/post/${postId}`);
  };
  
  const handleShare = async (postId: string) => {
    console.log('Share post:', postId);
  };
  
  const handleRetweet = async (postId: string) => {
    console.log('Retweet post:', postId);
  };
  
  return (
    <ScreenWrapper withBottomNav>
      <FloatingHeader
        headerProps={{
          showLogo: true,
          showMessages: true,
          onMessagesPress: () => router.push('/messages'),
          showNotifications: true,
          notificationCount: 3,
          onNotificationPress: () => router.push('/notifications'),
          showSettings: true,
          onSettingsPress: () => router.push('/settings'),
        }}
        floating={true}
        showOnScrollUp={true}
        hideOnScrollDown={true}
        scrollViewProps={{
          refreshControl: (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={currentTheme.brand.primary}
              colors={[currentTheme.brand.primary]}
            />
          ),
          onScroll: ({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom = 
              layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
            
            if (isCloseToBottom) {
              handleLoadMore();
            }
          },
          scrollEventThrottle: 400,
        }}
      >
        {/* Feed Tabs */}
        <View className="flex-row border-b border-border">
          <TouchableOpacity
            className={`flex-1 py-3 ${activeTab === 'forYou' ? 'border-b-2 border-brand-primary' : ''}`}
            onPress={() => setActiveTab('forYou')}
          >
            <Text
              className={`text-center text-base font-semibold ${
                activeTab === 'forYou' ? 'text-brand-primary' : 'text-text-tertiary'
              }`}
            >
              For You
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`flex-1 py-3 ${activeTab === 'following' ? 'border-b-2 border-brand-primary' : ''}`}
            onPress={() => setActiveTab('following')}
          >
            <Text
              className={`text-center text-base font-semibold ${
                activeTab === 'following' ? 'text-brand-primary' : 'text-text-tertiary'
              }`}
            >
              Following
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Loading State */}
        {isLoading && !refreshing && posts.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color={currentTheme.brand.primary} />
            <Text className="text-text-secondary mt-4">Loading posts...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12 px-6">
            <Text className="text-text-primary text-xl font-semibold mb-2">
              No posts yet
            </Text>
            <Text className="text-text-secondary text-center mb-6">
              When people you follow post, you&apos;ll see it here.
            </Text>
            <TouchableOpacity 
              className="px-6 py-3 bg-brand-primary rounded-full"
              onPress={() => router.push('/(tabs)/search')}
            >
              <Text className="text-white font-semibold">Find people to follow</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Posts List */
          <View className="pb-20">
            {posts.map((post) => (
              <View key={post.id} className="border-b border-border px-4 py-3">
                {/* Post Header */}
                <View className="flex-row">
                  {/* User Avatar */}
                  <TouchableOpacity 
                    className="mr-3"
                    onPress={() => router.push(`/profile/${post.user_id}`)}
                  >
                    <View className="w-10 h-10 rounded-full bg-brand-primary items-center justify-center">
                      {post.user?.avatar_url ? (
                        <Image 
                          source={{ uri: post.user.avatar_url }}
                          className="w-full h-full rounded-full"
                        />
                      ) : (
                        <Text className="text-white font-bold">
                          {post.user?.display_name?.[0] || post.user?.username?.[0] || 'U'}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  <View className="flex-1">
                    {/* User Info & Time */}
                    <View className="flex-row items-center">
                      <TouchableOpacity 
                        onPress={() => router.push(`/profile/${post.user_id}`)}
                      >
                        <Text className="text-text-primary font-semibold text-base">
                          {post.user?.display_name || post.user?.username || 'User'}
                        </Text>
                      </TouchableOpacity>
                      <Text className="text-text-secondary ml-2">
                        @{post.user?.username || 'username'}
                      </Text>
                      <Text className="text-text-tertiary ml-2">·</Text>
                      <Text className="text-text-tertiary ml-2">
                        {formatTime(post.created_at)}
                      </Text>
                    </View>
                    
                    {/* Post Content */}
                    <Text className="text-text-primary text-base mt-1">
                      {post.content}
                    </Text>
                    
                    {/* Nebula Enhanced Content */}
                    {post.nebula_enhanced_content && (
                      <View className="mt-3 p-3 bg-surface-light rounded-lg border-l-4 border-brand-primary">
                        <Text className="text-text-secondary text-sm mb-1">✨ Enhanced by Nebula</Text>
                        <Text className="text-text-primary">{post.nebula_enhanced_content}</Text>
                      </View>
                    )}
                    
                    {/* Media Indicator */}
                    {post.media_urls && post.media_urls.length > 0 && (
                      <View className="flex-row items-center mt-2">
                        {post.media_urls[0].includes('.mp4') || post.media_urls[0].includes('.mov') ? (
                          <>
                            <VideoIcon size={SIZES.ICON.SM} color={currentTheme.icon.secondary} />
                            <Text className="text-text-secondary text-sm ml-2">Video</Text>
                          </>
                        ) : (
                          <>
                            <ImageIcon size={SIZES.ICON.SM} color={currentTheme.icon.secondary} />
                            <Text className="text-text-secondary text-sm ml-2">Image</Text>
                          </>
                        )}
                      </View>
                    )}
                    
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <View className="flex-row flex-wrap mt-2">
                        {post.tags.slice(0, 3).map((tag, index) => (
                          <TouchableOpacity key={index} className="mr-2 mb-1">
                            <Text className="text-brand-primary text-sm">#{tag}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    
                    {/* Post Actions */}
                    <View className="flex-row justify-between mt-4 max-w-[90%]">
                      {/* Comments */}
                      <TouchableOpacity 
                        className="flex-row items-center"
                        onPress={() => handleComment(post.id)}
                      >
                        <CommentIcon 
                          size={SIZES.ICON.MD} 
                          color={currentTheme.icon.secondary} 
                        />
                        {post.comments_count > 0 && (
                          <Text className="text-text-secondary ml-2">
                            {post.comments_count}
                          </Text>
                        )}
                      </TouchableOpacity>
                      
                      {/* Retweets */}
                      <TouchableOpacity 
                        className="flex-row items-center"
                        onPress={() => handleRetweet(post.id)}
                      >
                        <RetweetIcon 
                          size={SIZES.ICON.MD} 
                          color={currentTheme.icon.secondary} 
                        />
                        {post.shares_count > 0 && (
                          <Text className="text-text-secondary ml-2">
                            {post.shares_count}
                          </Text>
                        )}
                      </TouchableOpacity>
                      
                      {/* Likes */}
                      <TouchableOpacity 
                        className="flex-row items-center"
                        onPress={() => handleLike(post.id)}
                      >
                        <LikeIcon 
                          size={SIZES.ICON.MD} 
                          color={post.is_liked ? currentTheme.status.error : currentTheme.icon.secondary}
                          filled={post.is_liked}
                        />
                        {post.likes_count > 0 && (
                          <Text 
                            className={`ml-2 ${
                              post.is_liked ? 'text-status-error' : 'text-text-secondary'
                            }`}
                          >
                            {post.likes_count}
                          </Text>
                        )}
                      </TouchableOpacity>
                      
                      {/* Share */}
                      <TouchableOpacity 
                        className="flex-row items-center"
                        onPress={() => handleShare(post.id)}
                      >
                        <ShareIcon 
                          size={SIZES.ICON.MD} 
                          color={currentTheme.icon.secondary} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}
            
            {/* Load More Indicator */}
            {isLoading && posts.length > 0 && (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color={currentTheme.brand.primary} />
                <Text className="text-text-secondary mt-2">Loading more...</Text>
              </View>
            )}
            
            {/* End of Feed */}
            {!hasMorePosts && posts.length > 0 && (
              <View className="py-8 items-center">
                <Text className="text-text-tertiary">You&apos;re all caught up! 🎉</Text>
                <Text className="text-text-tertiary text-sm mt-1">
                  Check back later for new posts
                </Text>
              </View>
            )}
          </View>
        )}
      </FloatingHeader>
    </ScreenWrapper>
  );
}