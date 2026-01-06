// screens/post/PostDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import useStore from '../../store/useStore';
import { COLORS } from '../../config/constants';

const PostDetailScreen = ({ route, navigation }) => {
  const { postId } = route.params || {};
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { user, likePost, updatePostInFeed } = useStore();

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(*),
          likes(count),
          comments(count),
          communities(*),
          user_liked:likes!inner(user_id)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
      Alert.alert('Error', 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to like posts');
      return;
    }

    try {
      setLiking(true);
      await likePost(postId);
      
      // Update local post data
      setPost(prev => {
        if (!prev) return prev;
        
        const wasLiked = prev.user_liked && prev.user_liked.length > 0;
        const likeCount = prev.likes?.[0]?.count || 0;
        
        return {
          ...prev,
          likes: [{ count: wasLiked ? likeCount - 1 : likeCount + 1 }],
          user_liked: wasLiked ? [] : [{ user_id: user.id }],
        };
      });
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setLiking(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to save posts');
      return;
    }

    try {
      setSaving(true);
      
      // Check if already saved
      const { data: existingSave } = await supabase
        .from('saved_posts')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingSave) {
        // Unsave
        await supabase
          .from('saved_posts')
          .delete()
          .eq('id', existingSave.id);
        
        Alert.alert('Post Unsaved', 'Post removed from your saved items');
      } else {
        // Save
        await supabase
          .from('saved_posts')
          .insert({
            post_id: postId,
            user_id: user.id,
          });
        
        Alert.alert('Post Saved', 'Post added to your saved items');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      Alert.alert('Error', 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `https://nebulanet.space/post/${postId}`;
      const result = await Share.share({
        message: `Check out this post on NebulaNet: ${post?.content?.substring(0, 100)}... ${shareUrl}`,
        url: shareUrl,
        title: 'NebulaNet Post',
      });

      if (result.action === Share.sharedAction) {
        // Track share
        await supabase
          .from('posts')
          .update({ share_count: (post?.share_count || 0) + 1 })
          .eq('id', postId);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const navigateToComments = () => {
    navigation.navigate('Comments', { 
      postId,
      post 
    });
  };

  const navigateToProfile = (userId) => {
    navigation.navigate('Profile', { userId });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>Post not found</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchPost}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isLiked = post.user_liked && post.user_liked.length > 0;
  const likeCount = post.likes?.[0]?.count || 0;
  const commentCount = post.comments?.[0]?.count || 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Post Content */}
        <View style={styles.postContainer}>
          {/* Author Header */}
          <TouchableOpacity 
            style={styles.authorHeader}
            onPress={() => navigateToProfile(post.author?.id)}
            activeOpacity={0.7}
          >
            {post.author?.avatar_url ? (
              <Image 
                source={{ uri: post.author.avatar_url }} 
                style={styles.authorAvatar}
              />
            ) : (
              <View style={styles.authorAvatar}>
                <Text style={styles.authorAvatarText}>
                  {post.author?.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>
                {post.author?.username || 'Unknown User'}
              </Text>
              <Text style={styles.postDate}>
                {formatDate(post.created_at)}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Post Content */}
          <View style={styles.postContent}>
            {post.title && (
              <Text style={styles.postTitle}>{post.title}</Text>
            )}
            
            <Text style={styles.postText}>{post.content}</Text>

            {/* Media */}
            {post.media_urls && post.media_urls.length > 0 && (
              <View style={styles.mediaContainer}>
                {post.media_urls.map((url, index) => (
                  <Image 
                    key={index}
                    source={{ uri: url }} 
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                ))}
              </View>
            )}

            {/* Community Tag */}
            {post.communities && (
              <TouchableOpacity style={styles.communityTag}>
                <Ionicons name="people" size={16} color={COLORS.primary} />
                <Text style={styles.communityName}>
                  {post.communities.name}
                </Text>
              </TouchableOpacity>
            )}

            {/* Location */}
            {post.location && (
              <View style={styles.locationTag}>
                <Ionicons name="location-outline" size={16} color={COLORS.text.secondary} />
                <Text style={styles.locationText}>{post.location}</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{likeCount}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={navigateToComments}
            >
              <Text style={styles.statNumber}>{commentCount}</Text>
              <Text style={styles.statLabel}>Comments</Text>
            </TouchableOpacity>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{post.share_count || 0}</Text>
              <Text style={styles.statLabel}>Shares</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleLike}
              disabled={liking}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={isLiked ? COLORS.error : COLORS.text.secondary} 
              />
              <Text style={[
                styles.actionText,
                isLiked && styles.likedActionText
              ]}>
                {isLiked ? 'Liked' : 'Like'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={navigateToComments}
            >
              <Ionicons name="chatbubble-outline" size={24} color={COLORS.text.secondary} />
              <Text style={styles.actionText}>Comment</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleShare}
            >
              <Ionicons name="arrow-redo-outline" size={24} color={COLORS.text.secondary} />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleSave}
              disabled={saving}
            >
              <Ionicons 
                name={saving ? "bookmark" : "bookmark-outline"} 
                size={24} 
                color={COLORS.text.secondary} 
              />
              <Text style={styles.actionText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments Preview */}
        <View style={styles.commentsPreview}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments ({commentCount})</Text>
            <TouchableOpacity onPress={navigateToComments}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {/* In a real app, you'd fetch and display a few comments here */}
          <View style={styles.noComments}>
            <Ionicons name="chatbubble-outline" size={48} color={COLORS.text.light} />
            <Text style={styles.noCommentsText}>
              {commentCount === 0 
                ? 'No comments yet. Be the first to comment!' 
                : 'Comments are loading...'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Quick Comment Input */}
      <TouchableOpacity 
        style={styles.quickCommentButton}
        onPress={navigateToComments}
      >
        <Text style={styles.quickCommentText}>Add a comment...</Text>
        <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  moreButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  postContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  authorAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  postDate: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  postContent: {
    marginBottom: 20,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 12,
    lineHeight: 26,
  },
  postText: {
    fontSize: 16,
    color: COLORS.text.primary,
    lineHeight: 24,
    marginBottom: 16,
  },
  mediaContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mediaImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  communityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  communityName: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
    minWidth: 60,
  },
  actionText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  likedActionText: {
    color: COLORS.error,
    fontWeight: '600',
  },
  commentsPreview: {
    padding: 16,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  noComments: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noCommentsText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 32,
  },
  quickCommentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  quickCommentText: {
    fontSize: 16,
    color: COLORS.text.light,
    flex: 1,
    marginRight: 12,
  },
});

export default PostDetailScreen;