// File: /app/post/[id].tsx (Updated)
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper, Header } from '../../components/layout';
import { useAuth } from '../../hooks/useAuth';
import { usePostDetail } from '../../hooks/usePostDetail';
import useComments from '../../hooks/useComments';
import PostDetail from '../../components/post/PostDetail';
import CommentSection from '../../components/post/CommentSection';
import CommentInput from '../../components/post/CommentInput';
import { ShareIcon, MoreIcon } from '../../assets/icons';
import { currentTheme } from '../../constants/Colors';

export default function PostDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const postId = params.id as string;
  const { user } = useAuth();
  
  const {
    post,
    isLoading: isLoadingPost,
    error: postError,
    refreshPost,
    likePost,
    echoPost,
    bookmarkPost,
    deletePost,
  } = usePostDetail(postId);
  
  const {
    comments,
    isLoading: isLoadingComments,
    refreshComments,
    addComment,
    likeComment,
    deleteComment,
    loadMore,
    hasMore,
  } = useComments({
    postId,
    initialLimit: 20,
    sortBy: 'newest',
  });
  
  const [refreshing, setRefreshing] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshPost(), refreshComments()]);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  }, [refreshPost, refreshComments]);
  
  const handleCommentSubmit = async (content: string, parentId?: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    try {
      await addComment(content, parentId);
      setReplyingTo(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to post comment');
    }
  };
  
  const handleDeletePost = async () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost();
              router.back();
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete post');
            }
          },
        },
      ]
    );
  };
  
  const handleShare = () => {
    if (!post) return;
    
    // TODO: Implement sharing
    Alert.alert(
      'Share Post',
      `Share "${post.content.substring(0, 50)}..."`,
      [
        { text: 'Copy Link', onPress: () => console.log('Copy link') },
        { text: 'Share via...', onPress: () => console.log('Share via') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };
  
  if (isLoadingPost) {
    return (
      <ScreenWrapper>
        <Header showBack title="Post" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={currentTheme.brand.primary} />
          <Text className="text-text-secondary mt-4">Loading post...</Text>
        </View>
      </ScreenWrapper>
    );
  }
  
  if (postError || !post) {
    return (
      <ScreenWrapper>
        <Header showBack title="Post" />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-text-primary text-xl font-semibold mb-2">
            Post not found
          </Text>
          <Text className="text-text-secondary text-center mb-6">
            This post may have been deleted or is unavailable
          </Text>
          <TouchableOpacity 
            className="px-6 py-2 bg-brand-primary rounded-full"
            onPress={() => router.back()}
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }
  
  const isOwnPost = user?.id === post.user_id;
  
  return (
    <ScreenWrapper>
      <Header
        showBack
        title="Post"
        rightAction={
          <TouchableOpacity onPress={() => setShowOptions(true)}>
            <MoreIcon size={24} color={currentTheme.icon.primary} />
          </TouchableOpacity>
        }
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
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
                nativeEvent.contentSize.height - 50) {
              if (hasMore && !isLoadingComments) {
                loadMore();
              }
            }
          }}
          scrollEventThrottle={400}
        >
          <PostDetail
            post={post}
            onLike={likePost}
            onEcho={echoPost}
            onBookmark={bookmarkPost}
            onShare={handleShare}
            onComment={() => {
              // Focus comment input
              setReplyingTo('new');
              setTimeout(() => {
                // Focus logic handled in CommentInput
              }, 100);
            }}
            onUserPress={() => router.push(`/profile?id=${post.user_id}`)}
            onMorePress={() => setShowOptions(true)}
          />
          
          <CommentSection
            comments={comments}
            isLoading={isLoadingComments}
            onLikeComment={likeComment}
            onUnlikeComment={likeComment} // Same function handles toggle
            onReply={setReplyingTo}
            onDeleteComment={isOwnPost ? deleteComment : undefined}
            onLoadMore={hasMore ? loadMore : undefined}
            onRefresh={refreshComments}
            replyingTo={replyingTo}
          />
        </ScrollView>
        
        <CommentInput
          onSubmit={handleCommentSubmit}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          postId={postId}
          placeholder={replyingTo ? 'Write a reply...' : 'Write a comment...'}
          showAvatar={!!user}
        />
      </KeyboardAvoidingView>
      
      {/* Options Modal */}
      {showOptions && (
        <View className="absolute inset-0 bg-black/50 justify-end">
          <TouchableOpacity
            className="absolute inset-0"
            onPress={() => setShowOptions(false)}
            activeOpacity={1}
          />
          <View className="bg-surface rounded-t-2xl p-4">
            {isOwnPost ? (
              <>
                <TouchableOpacity
                  className="py-4 border-b border-border"
                  onPress={() => {
                    setShowOptions(false);
                    router.push(`/post/edit/${postId}`);
                  }}
                >
                  <Text className="text-text-primary text-center text-lg">
                    Edit Post
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="py-4 border-b border-border"
                  onPress={() => {
                    setShowOptions(false);
                    handleDeletePost();
                  }}
                >
                  <Text className="text-red-500 text-center text-lg">
                    Delete Post
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity className="py-4 border-b border-border">
                  <Text className="text-text-primary text-center text-lg">
                    Report Post
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity className="py-4 border-b border-border">
                  <Text className="text-text-primary text-center text-lg">
                    Mute User
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity className="py-4 border-b border-border">
                  <Text className="text-text-primary text-center text-lg">
                    Block User
                  </Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              className="py-4"
              onPress={() => setShowOptions(false)}
            >
              <Text className="text-text-secondary text-center text-lg">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScreenWrapper>
  );
}