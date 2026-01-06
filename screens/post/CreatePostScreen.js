// screens/post/CreatePostScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../services/supabase';
import useStore from '../../store/useStore';
import { COLORS } from '../../config/constants';
import imageUploadService from '../../services/imageUpload';

const CreatePostScreen = ({ navigation, route }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [community, setCommunity] = useState(null);
  const [location, setLocation] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharePublic, setSharePublic] = useState(true);
  const [boostPost, setBoostPost] = useState(false);
  
  const { user, profile, addToFeed } = useStore();

  useEffect(() => {
    fetchCommunities();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      }
    }
  };

  const fetchCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('name');

      if (error) throw error;
      setCommunities(data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type,
          fileName: asset.fileName,
        }));
        setImages(prev => [...prev, ...newImages].slice(0, 10)); // Max 10 images
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (images.length === 0) return [];

    setUploading(true);
    try {
      const uploadPromises = images.map(image => 
        imageUploadService.uploadImage(image, 'posts')
      );
      
      const results = await Promise.all(uploadPromises);
      return results.filter(r => r.success).map(r => r.url);
    } catch (error) {
      console.error('Error uploading images:', error);
      Alert.alert('Upload Error', 'Failed to upload images');
      return [];
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim() && images.length === 0) {
      Alert.alert('Empty Post', 'Please add some content or an image to your post');
      return;
    }

    try {
      setUploading(true);

      // Upload images first
      const imageUrls = await uploadImages();

      // Create post data
      const postData = {
        content: content.trim(),
        title: title.trim() || null,
        media_urls: imageUrls,
        community_id: community?.id || null,
        location: location.trim() || null,
        is_public: sharePublic,
        is_boosted: boostPost,
      };

      // Create post in database
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          ...postData,
        })
        .select(`
          *,
          author:profiles(*),
          likes(count),
          comments(count)
        `)
        .single();

      if (error) throw error;

      // Update local feed
      addToFeed([post]);

      Alert.alert(
        'Success',
        'Your post has been published!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );

    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDraft = () => {
    // In a real app, you'd save to AsyncStorage or database
    Alert.alert(
      'Save Draft',
      'Post saved as draft. You can continue editing later.',
      [{ text: 'OK' }]
    );
    navigation.goBack();
  };

  const renderImageGrid = () => {
    if (images.length === 0) return null;

    return (
      <View style={styles.imagesContainer}>
        <Text style={styles.sectionLabel}>Images ({images.length}/10)</Text>
        <View style={styles.imagesGrid}>
          {images.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri: image.uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={24} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}
          
          {images.length < 10 && (
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Ionicons name="add" size={32} color={COLORS.primary} />
              <Text style={styles.addImageText}>Add more</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => navigation.goBack()}
          disabled={uploading}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Create Post</Text>
        
        <TouchableOpacity 
          style={styles.postButton} 
          onPress={handleCreatePost}
          disabled={uploading || (!content.trim() && images.length === 0)}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.postText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Author Info */}
          <View style={styles.authorSection}>
            {profile?.avatar_url ? (
              <Image 
                source={{ uri: profile.avatar_url }} 
                style={styles.authorAvatar}
              />
            ) : (
              <View style={styles.authorAvatar}>
                <Text style={styles.authorAvatarText}>
                  {profile?.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>
                {profile?.username || 'Anonymous'}
              </Text>
              <View style={styles.visibilityBadge}>
                <Ionicons 
                  name={sharePublic ? "earth" : "lock-closed"} 
                  size={12} 
                  color={COLORS.text.secondary} 
                />
                <Text style={styles.visibilityText}>
                  {sharePublic ? 'Public' : 'Private'}
                </Text>
              </View>
            </View>
          </View>

          {/* Title Input */}
          <View style={styles.inputSection}>
            <TextInput
              style={styles.titleInput}
              placeholder="Title (optional)"
              placeholderTextColor={COLORS.text.light}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* Content Input */}
          <View style={styles.inputSection}>
            <TextInput
              style={styles.contentInput}
              placeholder="What's on your mind?"
              placeholderTextColor={COLORS.text.light}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={5000}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {content.length}/5000
            </Text>
          </View>

          {/* Image Section */}
          {renderImageGrid()}

          {/* Add Image Button */}
          {images.length === 0 && (
            <TouchableOpacity style={styles.addMediaButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={24} color={COLORS.primary} />
              <Text style={styles.addMediaText}>Add Photo/Video</Text>
            </TouchableOpacity>
          )}

          {/* Community Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Community</Text>
            <TouchableOpacity 
              style={styles.communityButton}
              onPress={() => {
                // In a real app, you'd open a community picker modal
                Alert.alert(
                  'Select Community',
                  'Community selection would open here',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Ionicons name="people-outline" size={20} color={COLORS.primary} />
              <Text style={styles.communityText}>
                {community ? community.name : 'Select a community (optional)'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.light} />
            </TouchableOpacity>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Location</Text>
            <View style={styles.locationInput}>
              <Ionicons name="location-outline" size={20} color={COLORS.primary} />
              <TextInput
                style={styles.locationTextInput}
                placeholder="Add location (optional)"
                placeholderTextColor={COLORS.text.light}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          {/* Options */}
          <View style={styles.optionsSection}>
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => setSharePublic(!sharePublic)}
            >
              <View style={styles.optionLeft}>
                <Ionicons 
                  name={sharePublic ? "earth" : "lock-closed"} 
                  size={20} 
                  color={COLORS.primary} 
                />
                <Text style={styles.optionText}>
                  {sharePublic ? 'Share Post to Public' : 'Share to Followers Only'}
                </Text>
              </View>
              <Ionicons 
                name={sharePublic ? "toggle" : "toggle-outline"} 
                size={24} 
                color={sharePublic ? COLORS.primary : COLORS.text.light} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => setBoostPost(!boostPost)}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="rocket-outline" size={20} color={COLORS.warning} />
                <Text style={styles.optionText}>Boost Post</Text>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumText}>PREMIUM</Text>
                </View>
              </View>
              <Ionicons 
                name={boostPost ? "toggle" : "toggle-outline"} 
                size={24} 
                color={boostPost ? COLORS.warning : COLORS.text.light} 
              />
            </TouchableOpacity>
          </View>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            <TouchableOpacity 
              style={styles.draftButton}
              onPress={handleSaveDraft}
              disabled={uploading}
            >
              <Ionicons name="bookmark-outline" size={20} color={COLORS.text.secondary} />
              <Text style={styles.draftText}>Save as Draft</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  postButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  postText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visibilityText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginLeft: 4,
  },
  inputSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    padding: 0,
    minHeight: 30,
  },
  contentInput: {
    fontSize: 16,
    color: COLORS.text.primary,
    padding: 0,
    minHeight: 120,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.text.light,
    textAlign: 'right',
    marginTop: 8,
  },
  imagesContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
  },
  addMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  addMediaText: {
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 12,
  },
  section: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  communityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  communityText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 12,
    marginRight: 8,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 12,
    padding: 0,
  },
  optionsSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 12,
    marginRight: 8,
    flex: 1,
  },
  premiumBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  bottomActions: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  draftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  draftText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginLeft: 8,
  },
});

export default CreatePostScreen;