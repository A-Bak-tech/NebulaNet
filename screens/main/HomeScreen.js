// screens/HomeScreen.js - UPDATED WITH NEW STRUCTURE
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  FlatList,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Import new components and hooks
import LogoHeader from '../components/common/LogoHeader';
import PostCard from '../components/feed/PostCard';
import StoryRing from '../components/feed/StoryRing';
import { COLORS } from '../config/constants';
import { useFeed } from '../hooks/useFeed';
import imageUploadService from '../services/imageUpload';
import { supabase } from '../services/supabase';
import useStore from '../store/useStore';

const HomeScreen = ({ navigation }) => {
  const [stories, setStories] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Use the new hooks and store
  const { posts, loading, refreshing, hasMore, fetchPosts, refresh, loadMore, likePost, addComment } = useFeed();
  const { user, profile, addToFeed } = useStore();

  // Right header component - Create Post button + Notifications
  const rightHeaderComponent = (
    <View style={styles.headerRight}>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => navigation.navigate('Notifications')}
      >
        <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add-circle" size={28} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );

  // Fetch stories (mock data for now - replace with real data later)
  useEffect(() => {
    const mockStories = [
      { id: '1', username: 'You', hasStory: true, isOwn: true, image: null },
      { id: '2', username: 'lucahldn', hasStory: true, image: null },
      { id: '3', username: 'piahlenas', hasStory: true, image: null },
      { id: '4', username: 'jolinaangine', hasStory: false, image: null },
      { id: '5', username: 'valerieazr90', hasStory: true, image: null },
      { id: '6', username: 'arlamgn', hasStory: true, image: null },
      { id: '7', username: 'skyedsn', hasStory: true, image: null },
      { id: '8', username: 'lailagibs', hasStory: false, image: null },
    ];
    setStories(mockStories);
  }, []);

  const handlePickImage = async () => {
    try {
      const image = await imageUploadService.pickImage({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (image) {
        setSelectedImage(image);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() && !selectedImage) {
      Alert.alert('Error', 'Please add some text or an image');
      return;
    }

    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to create a post');
      return;
    }

    setUploading(true);
    let imageUrls = [];

    try {
      // Upload image if selected
      if (selectedImage) {
        const uploadResult = await imageUploadService.uploadImage(selectedImage, 'posts');
        if (uploadResult?.url) {
          imageUrls = [uploadResult.url];
        }
      }

      // Create post with image
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: newPost.trim(),
          media_urls: imageUrls,
          like_count: 0,
          comment_count: 0,
          share_count: 0,
        })
        .select(`
          *,
          author:profiles(*),
          likes(count),
          comments(count)
        `)
        .single();

      if (error) throw error;

      // Reset and Update
      setNewPost('');
      setSelectedImage(null);
      setShowCreateModal(false);
      
      // Add to local feed immediately
      addToFeed([{ ...data, replies: [], liked: false }]);
      
      Alert.alert('Success', 'Post created successfully!', [
        { text: 'OK' }
      ]);
   
    } catch (error) {
      console.error('Create post error:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await likePost(postId);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId) => {
    navigation.navigate('Comments', { postId });
  };

  const handleShare = (postId) => {
    Alert.alert('Share', 'Share feature coming soon!');
  };

  const handleProfilePress = (userId) => {
    navigation.navigate('Profile', { userId });
  };

  const renderStoryItem = ({ item }) => (
    <StoryRing
      username={item.username}
      hasStory={item.hasStory}
      isOwn={item.isOwn}
      onPress={() => {
        if (item.isOwn) {
          setShowCreateModal(true);
        } else {
          console.log('View story:', item.username);
        }
      }}
    />
  );

  const renderPostItem = ({ item }) => (
    <PostCard
      post={item}
      onLikePress={() => handleLike(item.id)}
      onCommentPress={() => handleComment(item.id)}
      onSharePress={() => handleShare(item.id)}
      onProfilePress={() => handleProfilePress(item.user_id)}
    />
  );

  const renderHeader = () => (
    <View style={styles.storiesContainer}>
      <FlatList
        data={stories}
        renderItem={renderStoryItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesList}
      />
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.footerText}>Loading more posts...</Text>
      </View>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <LogoHeader 
          rightComponent={rightHeaderComponent}
          showBackButton={false}
        />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo Header */}
      <LogoHeader 
        rightComponent={rightHeaderComponent}
        showBackButton={false}
      />

      {/* REAL Posts Feed */}
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={60} color={COLORS.text.light} />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share something!</Text>
            <TouchableOpacity 
              style={styles.createFirstButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.createFirstButtonText}>Create First Post</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={posts.length === 0 ? { flex: 1 } : styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Create Post Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCreateModal}
        onRequestClose={() => !uploading && setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => !uploading && setShowCreateModal(false)}
                disabled={uploading}
              >
                <Ionicons name="close" size={24} color={COLORS.text.secondary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create Post</Text>
              <TouchableOpacity 
                style={[
                  styles.modalPostButton, 
                  (!newPost.trim() && !selectedImage) && styles.modalPostButtonDisabled,
                  uploading && styles.modalPostButtonDisabled
                ]}
                onPress={handleCreatePost}
                disabled={!newPost.trim() && !selectedImage || uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalPostButtonText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* User Info */}
            <View style={styles.modalUserInfo}>
              {profile?.avatar_url ? (
                <Image 
                  source={{ uri: profile.avatar_url }} 
                  style={styles.modalUserAvatar} 
                />
              ) : (
                <View style={styles.modalUserAvatar}>
                  <Text style={styles.modalUserAvatarText}>
                    {profile?.username?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <View>
                <Text style={styles.modalUserName}>
                  {profile?.username || 'User'}
                </Text>
                <View style={styles.privacyBadge}>
                  <Ionicons name="earth" size={12} color={COLORS.text.secondary} />
                  <Text style={styles.privacyText}>Public</Text>
                </View>
              </View>
            </View>

            {/* Post Input */}
            <TextInput
              style={styles.modalInput}
              placeholder="What's happening?"
              placeholderTextColor={COLORS.text.light}
              value={newPost}
              onChangeText={setNewPost}
              multiline
              maxLength={5000}
              autoFocus
            />

            {/* Image Preview */}
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                  disabled={uploading}
                >
                  <Ionicons name="close-circle" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Character Count */}
            <Text style={styles.charCount}>
              {newPost.length}/5000
            </Text>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalActionButton}
                onPress={handlePickImage}
                disabled={uploading}
              >
                <Ionicons name="image-outline" size={24} color={COLORS.primary} />
                <Text style={styles.modalActionText}>Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalActionButton}
                disabled={uploading}
              >
                <Ionicons name="location-outline" size={24} color={COLORS.primary} />
                <Text style={styles.modalActionText}>Location</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalActionButton}
                disabled={uploading}
              >
                <Ionicons name="people-outline" size={24} color={COLORS.primary} />
                <Text style={styles.modalActionText}>Community</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.text.secondary,
    fontSize: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  storiesContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  storiesList: {
    paddingHorizontal: 12,
    gap: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.text.secondary,
    marginTop: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.text.light,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  createFirstButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  modalPostButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  modalPostButtonDisabled: {
    backgroundColor: COLORS.text.light,
  },
  modalPostButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalUserAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  privacyText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  modalInput: {
    fontSize: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 120,
    maxHeight: 200,
    color: COLORS.text.primary,
    lineHeight: 24,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 14,
  },
  charCount: {
    textAlign: 'right',
    paddingHorizontal: 20,
    color: COLORS.text.secondary,
    fontSize: 14,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 8,
  },
  modalActionText: {
    marginLeft: 6,
    color: COLORS.primary,
    fontSize: 14,
  },
});

export default HomeScreen;